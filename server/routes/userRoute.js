const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getWalletSummary,
  resetVirtualWallet,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected user profile & wallet routes
router.get('/profile', protect, getUserProfile);
router.get('/wallet', protect, getWalletSummary);
router.post('/wallet/reset', protect, resetVirtualWallet);

module.exports = router;
