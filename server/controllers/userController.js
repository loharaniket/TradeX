const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Order = require('../models/orderSchema');

// Helper to generate signed JWT token with user ID
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
    const { name, email, password, contact, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in MongoDB
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default virtual balance ($100,000)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      contact: contact ? contact.trim() : '',
      virtualBalance: 100000,
      role: role === 'admin' ? 'admin' : 'user',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      virtualBalance: user.virtualBalance,
      role: user.role,
      token: generateToken(user._id),
    });
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

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

    // Compute trading statistics from completed orders in MongoDB
    const orders = await Order.find({ user: user._id, status: 'COMPLETED' });
    const totalTrades = orders.length;
    let totalBuys = 0;
    let totalSells = 0;
    let totalTurnover = 0;

    const tickerCounts = {};
    orders.forEach((o) => {
      if (o.orderType === 'BUY') totalBuys += 1;
      if (o.orderType === 'SELL') totalSells += 1;
      totalTurnover += o.totalAmount;

      const sym = o.stock.toUpperCase();
      tickerCounts[sym] = (tickerCounts[sym] || 0) + 1;
    });

    let highestCount = 0;
    let mostActiveTicker = 'N/A';
    for (const [sym, count] of Object.entries(tickerCounts)) {
      if (count > highestCount) {
        highestCount = count;
        mostActiveTicker = sym;
      }
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

    const orders = await Order.find({ user: user._id, status: 'COMPLETED' });

    orders.forEach((o) => {
      const sym = o.stock.toUpperCase();
      if (!holdings[sym]) holdings[sym] = { shares: 0, totalCost: 0, currentPrice: o.price };
      if (o.orderType === 'BUY') {
        holdings[sym].shares += o.quantity;
        holdings[sym].totalCost += o.totalAmount;
      } else if (o.orderType === 'SELL') {
        const avg = holdings[sym].shares > 0 ? holdings[sym].totalCost / holdings[sym].shares : 0;
        holdings[sym].shares -= o.quantity;
        holdings[sym].totalCost -= avg * o.quantity;
      }
    });

    Object.keys(holdings).forEach((sym) => {
      const h = holdings[sym];
      if (h.shares > 0) {
        investedAmount += h.totalCost;
        portfolioValue += h.shares * h.currentPrice;
      }
    });

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
    res.status(500).json({ message: `Server error: ${error.message}` });
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
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

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
