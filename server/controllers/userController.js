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
// @desc    Get logged-in user profile with trading statistics
// @route   GET /api/users/profile
// @access  Protected
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compute trading statistics from completed orders
    let totalTrades = 0;
    let totalBuys = 0;
    let totalSells = 0;
    let totalTurnover = 0;
    let mostActiveTicker = 'N/A';

    try {
      const orders = await Order.find({ user: user._id, status: 'COMPLETED' });
      totalTrades = orders.length;

      const tickerCounts = {};
      orders.forEach((o) => {
        if (o.orderType === 'BUY') totalBuys += 1;
        if (o.orderType === 'SELL') totalSells += 1;
        totalTurnover += o.totalAmount;

        const sym = o.stock.toUpperCase();
        tickerCounts[sym] = (tickerCounts[sym] || 0) + 1;
      });

      let highestCount = 0;
      for (const [sym, count] of Object.entries(tickerCounts)) {
        if (count > highestCount) {
          highestCount = count;
          mostActiveTicker = sym;
        }
      }
    } catch {
      // Fallback
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      virtualBalance: user.virtualBalance,
      role: user.role,
      createdAt: user.createdAt,
      stats: {
        totalTrades,
        totalBuys,
        totalSells,
        totalTurnover: Number(totalTurnover.toFixed(2)),
        mostActiveTicker,
      },
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Update user profile details (name, contact)
// @route   PUT /api/users/profile
// @access  Protected
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, contact } = req.body;
    if (name) user.name = name.trim();
    if (contact !== undefined) user.contact = contact.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        virtualBalance: user.virtualBalance,
      },
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

// @desc    Admin login with role-based authorization check
// @route   POST /api/users/admin/login
// @access  Public (admin credentials)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide administrator email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Auto-seed default admin if logging in with default credentials for the first time
    if (normalizedEmail === 'admin@tradex.com') {
      const existingAdmin = await User.findOne({ email: normalizedEmail });
      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@12345', salt);
        await User.create({
          name: 'TradeX Admin',
          email: 'admin@tradex.com',
          password: hashedPassword,
          contact: '1800-TRADEX',
          role: 'admin',
          virtualBalance: 1000000,
        });
      }
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    // Crucial check: verify role is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This account does not possess administrator privileges',
      });
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      virtualBalance: user.virtualBalance,
      token: generateToken(user._id),
      message: 'Administrator authentication successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Admin login server error: ${error.message}`,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  getUserProfile,
  updateUserProfile,
  getWalletSummary,
  resetVirtualWallet,
};
