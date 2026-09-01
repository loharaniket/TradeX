const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes and verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header contains a Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using JWT_SECRET
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'sb_stocks_secret_jwt_key_2026'
      );

      // Find user by ID and attach to request (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
