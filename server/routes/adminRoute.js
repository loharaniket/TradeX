const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  getAllTrades,
  adjustUserBalance,
  toggleStockStatus,
  getAllStocksForAdmin,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected admin routes
router.get('/dashboard', protect, admin, getAdminDashboard);
router.get('/users', protect, admin, getAllUsers);
router.get('/trades', protect, admin, getAllTrades);
router.put('/users/:id/balance', protect, admin, adjustUserBalance);
router.get('/stocks', protect, admin, getAllStocksForAdmin);
router.put('/stocks/:symbol/toggle', protect, admin, toggleStockStatus);

module.exports = router;
