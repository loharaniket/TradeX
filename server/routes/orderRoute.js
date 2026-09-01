const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getUserStockHolding,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Order routes (protected for authenticated users)
router.post('/', protect, createOrder);
router.get('/', protect, getUserOrders);
router.get('/holding/:symbol', protect, getUserStockHolding);
router.get('/:id', protect, getOrderById);

module.exports = router;
