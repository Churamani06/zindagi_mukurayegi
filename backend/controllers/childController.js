// backend/controllers/childController.js
// Handles child record creation and retrieval for Anganwadi


const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Create new child record
router.post('/add', async (req, res) => {
  const { child_name, age, gender, weight, health_status, anganwadi_kendra, school_name, symptoms, submitted_by_user_id } = req.body;
  if (!child_name || !age || !gender || !weight || !health_status || !anganwadi_kendra || !school_name || !submitted_by_user_id) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO child_health_records (child_name, age, gender, weight, health_status, anganwadi_kendra, school_name, symptoms, submitted_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [child_name, age, gender, weight, health_status, anganwadi_kendra, school_name, symptoms || '', submitted_by_user_id]
    );
    const [rows] = await pool.execute('SELECT * FROM child_health_records WHERE id = ?', [result.insertId]);
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error adding child record:', error);
    return res.status(500).json({ success: false, message: 'Failed to add child record.' });
  }
});

// Get child records by submitted_by_user_id
router.get('/all', async (req, res) => {
  const { submitted_by_user_id } = req.query;
  if (!submitted_by_user_id) {
    return res.status(400).json({ success: false, message: 'submitted_by_user_id is required.' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM child_health_records WHERE submitted_by_user_id = ?',
      [submitted_by_user_id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching child records:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch child records.' });
  }
});

// Update health status for a child
router.put('/update-status/:id', async (req, res) => {
  const { id } = req.params;
  const { health_status } = req.body;
  if (!health_status) {
    return res.status(400).json({ success: false, message: 'health_status is required.' });
  }
  try {
    await pool.execute('UPDATE child_health_records SET health_status = ? WHERE id = ?', [health_status, id]);
    const [rows] = await pool.execute('SELECT * FROM child_health_records WHERE id = ?', [id]);
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error updating health status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update health status.' });
  }
});

module.exports = router;
