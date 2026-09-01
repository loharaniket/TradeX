const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Order = require('../models/orderSchema');
const Stock = require('../models/stockSchema');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'sb_stocks_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default virtual balance ($100,000)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      contact: contact ? contact.trim() : '',
      virtualBalance: 100000,
      role: 'user',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        virtualBalance: user.virtualBalance,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Authenticate user and return JWT token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Check if user exists and password matches
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        virtualBalance: user.virtualBalance,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Protected
const getUserProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware protect function
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      contact: req.user.contact,
      virtualBalance: req.user.virtualBalance,
      role: req.user.role,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Get user's virtual wallet metrics (Available Balance, Invested Amount, Portfolio Value)
// @route   GET /api/users/wallet
// @access  Protected
const getWalletSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const availableBalance = user.virtualBalance || 0;
    let investedAmount = 0;
    let portfolioValue = 0;
    const holdings = {};

    // If mongoose is connected, compute holdings from user's completed orders
    if (mongoose.connection.readyState === 1) {
      try {
        const orders = await Order.find({ user: user._id, status: 'COMPLETED' }).sort({ createdAt: 1 });

        orders.forEach((ord) => {
          const sym = ord.stock.toUpperCase();
          if (!holdings[sym]) {
            holdings[sym] = { quantity: 0, totalCost: 0 };
          }

          if (ord.orderType === 'BUY') {
            holdings[sym].quantity += ord.quantity;
            holdings[sym].totalCost += ord.totalAmount;
          } else if (ord.orderType === 'SELL') {
            if (holdings[sym].quantity > 0) {
              const avgCost = holdings[sym].totalCost / holdings[sym].quantity;
              holdings[sym].quantity -= ord.quantity;
              holdings[sym].totalCost -= ord.quantity * avgCost;
              if (holdings[sym].quantity <= 0) {
                holdings[sym].quantity = 0;
                holdings[sym].totalCost = 0;
              }
            }
          }
        });

        for (const sym of Object.keys(holdings)) {
          const item = holdings[sym];
          if (item.quantity > 0) {
            investedAmount += item.totalCost;
            let currentPrice = item.totalCost / item.quantity;
            const stockRecord = await Stock.findOne({ symbol: sym });
            if (stockRecord && stockRecord.currentPrice) {
              currentPrice = stockRecord.currentPrice;
            }
            portfolioValue += item.quantity * currentPrice;
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    const totalAccountValue = availableBalance + portfolioValue;
    const unrealizedProfitLoss = portfolioValue - investedAmount;
    const profitLossPercent = investedAmount > 0 ? (unrealizedProfitLoss / investedAmount) * 100 : 0;

    res.status(200).json({
      success: true,
      availableBalance: Number(availableBalance.toFixed(2)),
      investedAmount: Number(investedAmount.toFixed(2)),
      portfolioValue: Number(portfolioValue.toFixed(2)),
      totalAccountValue: Number(totalAccountValue.toFixed(2)),
      unrealizedProfitLoss: Number(unrealizedProfitLoss.toFixed(2)),
      profitLossPercent: Number(profitLossPercent.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

// @desc    Reset virtual balance to default $100,000 for paper trading practice
// @route   POST /api/users/wallet/reset
// @access  Protected
const resetVirtualWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.virtualBalance = 100000;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Virtual balance successfully reset to $100,000.00',
      virtualBalance: user.virtualBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getWalletSummary,
  resetVirtualWallet,
};
