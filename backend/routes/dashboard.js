const express = require('express');
const { getDashboardStats, getRecordsByStatus, getRecordsByDateRange } = require('../controllers/recordsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Dashboard routes (Admin only)
router.get('/stats', authenticateToken, requireAdmin, getDashboardStats);
router.get('/records-by-status/:status', authenticateToken, requireAdmin, getRecordsByStatus);
router.get('/records-by-date', authenticateToken, requireAdmin, getRecordsByDateRange);

module.exports = router;
