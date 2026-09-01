const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Protected dashboard summary route
router.get('/', protect, getDashboardSummary);

module.exports = router;
