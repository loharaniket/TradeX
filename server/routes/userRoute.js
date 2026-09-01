const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  adminLogin,
  getUserProfile,
  getWalletSummary,
  resetVirtualWallet,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin authentication route
router.post('/admin/login', adminLogin);

// Protected user profile & wallet routes
router.get('/profile', protect, getUserProfile);
router.get('/wallet', protect, getWalletSummary);
router.post('/wallet/reset', protect, resetVirtualWallet);

// Protected admin authorization verification route
router.get('/admin/verify', protect, admin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin authorization verified',
    admin: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
