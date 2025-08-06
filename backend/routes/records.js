const express = require('express');
const { 
  submitChildData, 
  getAllRecords, 
  getUserRecords, 
  getDashboardStats 
} = require('../controllers/recordsController');
const { authenticateToken, requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// User routes (Anganwadi workers)
router.post('/', authenticateToken, requireUser, submitChildData);
router.get('/user', authenticateToken, requireUser, getUserRecords);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllRecords);

module.exports = router;
