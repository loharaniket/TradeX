const express = require('express');
const router = express.Router();
const {
  getUserTransactions,
  getTransactionById,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// Transaction routes (protected for authenticated users)
router.get('/', protect, getUserTransactions);
router.get('/:id', protect, getTransactionById);

module.exports = router;
