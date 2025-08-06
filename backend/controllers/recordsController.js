const { pool } = require('../config/database');

// Submit child health data (User only)
const submitChildData = async (req, res) => {
  try {
    const {
      child_name,
      age,
      gender,
      weight,
      symptoms,
      school_name,
      anganwadi_kendra,
      health_status = ''
    } = req.body;

    // Validation
    if (!child_name || !age || !gender || !weight || !school_name || !anganwadi_kendra) {
      return res.status(400).json({
        success: false,
        message: 'Child name, age, gender, weight, school name, and anganwadi kendra are required'
      });
    }

    if (age < 0 || age > 18) {
      return res.status(400).json({
        success: false,
        message: 'Age must be between 0 and 18 years'
      });
    }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be Male, Female, or Other'
      });
    }

    if (weight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a positive number'
      });
    }

    const validStatuses = ['Pending', 'Checked', 'Referred', 'Treated', 'Follow-up Required'];
    if (!validStatuses.includes(health_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid health status'
      });
    }

    // Insert child health record
    const [result] = await pool.execute(
      `INSERT INTO child_health_records 
       (child_name, age, gender, weight, symptoms, school_name, anganwadi_kendra, health_status, submitted_by_user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [child_name, age, gender, weight, symptoms || null, school_name, anganwadi_kendra, health_status, req.user.id]
    );

    // Get the created record with user info
    const [records] = await pool.execute(
      `SELECT chr.*, u.username as submitted_by 
       FROM child_health_records chr 
       JOIN users u ON chr.submitted_by_user_id = u.id 
       WHERE chr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Child health record submitted successfully',
      data: records[0]
    });

  } catch (error) {
    console.error('Submit child data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while submitting child data'
    });
  }
};

// Get all child health records (Admin only)
const getAllRecords = async (req, res) => {
  try {
    console.log('📋 getAllRecords called with query:', req.query);
    
    const { 
      page = 1, 
      limit = 10000  // Increased limit for government use - 10,000 records per page
    } = req.query;

    // Simple query without complex filters for now
    let query = `
      SELECT 
        chr.id,
        chr.child_name,
        chr.age,
        chr.gender,
        chr.weight,
        chr.symptoms,
        chr.school_name,
        chr.anganwadi_kendra,
        chr.health_status,
        chr.created_at,
        chr.updated_at,
        u.username as submitted_by
      FROM child_health_records chr
      LEFT JOIN users u ON chr.submitted_by_user_id = u.id
      ORDER BY chr.created_at DESC
    `;

    // Safe pagination with alternative syntax - High limits for government use
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(50000, parseInt(limit) || 10000)); // Max 50,000 records for government
    const offset = (pageNum - 1) * limitNum;
    
    // Use simpler LIMIT syntax
    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    console.log('📋 Executing simplified query:', query);

    // Execute query without parameters for LIMIT/OFFSET
    const [records] = await pool.execute(query);
    console.log('📋 Records fetched:', records.length);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM child_health_records'
    );
    const total = countResult[0].total;
    console.log('📋 Total records in DB:', total);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_records: total,
          records_per_page: limitNum
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all records error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch records',
      error: error.message
    });
  }
};

// Get user's own submitted records
const getUserRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [records] = await pool.execute(
      `SELECT 
        id, child_name, age, gender, weight, symptoms, 
        school_name, anganwadi_kendra, health_status, 
        created_at, updated_at
       FROM child_health_records 
       WHERE submitted_by_user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM child_health_records WHERE submitted_by_user_id = ?',
      [req.user.id]
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_records: total,
          records_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user records'
    });
  }
};

// Get dashboard statistics (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get total records count
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM child_health_records'
    );

    // Get records by status
    const [statusResult] = await pool.execute(
      `SELECT health_status, COUNT(*) as count 
       FROM child_health_records 
       GROUP BY health_status`
    );

    // Get records by anganwadi kendra (top 10)
    const [kendraResult] = await pool.execute(
      `SELECT anganwadi_kendra, COUNT(*) as count 
       FROM child_health_records 
       GROUP BY anganwadi_kendra 
       ORDER BY count DESC 
       LIMIT 10`
    );

    // Get recent submissions (last 7 days)
    const [recentResult] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM child_health_records 
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`
    );

    res.json({
      success: true,
      data: {
        total_records: totalResult[0].total,
        status_breakdown: statusResult,
        top_anganwadi_kendras: kendraResult,
        recent_submissions: recentResult
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dashboard statistics'
    });
  }
};

// Get records by status (Admin only)
const getRecordsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log(`Fetching records with status: ${status}`);

    const [records] = await pool.execute(
      `SELECT 
        chr.id, chr.child_name, chr.age, chr.gender, chr.weight, 
        chr.symptoms, chr.school_name, chr.anganwadi_kendra, 
        chr.health_status, chr.created_at, u.username as submitted_by
       FROM child_health_records chr
       JOIN users u ON chr.submitted_by_user_id = u.id
       WHERE chr.health_status = ?
       ORDER BY chr.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, parseInt(limit), offset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM child_health_records WHERE health_status = ?',
      [status]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult[0].total / parseInt(limit)),
          total_records: countResult[0].total,
          records_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get records by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching records by status'
    });
  }
};

// Get records by date range (Admin only)
const getRecordsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { page = 1, limit = 20 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log(`Fetching records from ${startDate} to ${endDate}`);

    const [records] = await pool.execute(
      `SELECT 
        chr.id, chr.child_name, chr.age, chr.gender, chr.weight, 
        chr.symptoms, chr.school_name, chr.anganwadi_kendra, 
        chr.health_status, chr.created_at, u.username as submitted_by
       FROM child_health_records chr
       JOIN users u ON chr.submitted_by_user_id = u.id
       WHERE DATE(chr.created_at) BETWEEN ? AND ?
       ORDER BY chr.created_at DESC
       LIMIT ? OFFSET ?`,
      [startDate, endDate, parseInt(limit), offset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM child_health_records WHERE DATE(created_at) BETWEEN ? AND ?',
      [startDate, endDate]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult[0].total / parseInt(limit)),
          total_records: countResult[0].total,
          records_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get records by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching records by date range'
    });
  }
};

module.exports = {
  submitChildData,
  getAllRecords,
  getUserRecords,
  getDashboardStats,
  getRecordsByStatus,
  getRecordsByDateRange
};
