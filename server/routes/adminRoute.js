const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected admin dashboard analytics
router.get('/dashboard', protect, admin, getAdminDashboard);

module.exports = router;
