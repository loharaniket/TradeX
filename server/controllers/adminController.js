const User = require('../models/userModel');
const Order = require('../models/orderSchema');
const Transaction = require('../models/transactionModel');
const Stock = require('../models/stockSchema');

// @desc    Get complete administrative analytics (users, trades, platform volume, top stocks, recent activity)
// @route   GET /api/admin/dashboard
// @access  Protected (Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    // 1. User metrics
    const totalUsers = await User.countDocuments({});
    const totalTraders = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // 2. Trade count and total volume
    const totalTrades = await Order.countDocuments({ status: 'COMPLETED' });

    const volumeResult = await Order.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalPlatformVolume = volumeResult[0]?.total || 0;

    // 3. Most Traded Stocks
    const mostTradedAgg = await Order.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: '$stock',
          companyName: { $first: '$companyName' },
          tradesCount: { $sum: 1 },
          totalVolume: { $sum: '$totalAmount' },
          totalShares: { $sum: '$quantity' },
        },
      },
      { $sort: { tradesCount: -1, totalVolume: -1 } },
      { $limit: 6 },
    ]);

    const mostTradedStocks = mostTradedAgg.map((item) => ({
      symbol: item._id,
      companyName: item.companyName || item._id,
      tradesCount: item.tradesCount,
      totalVolume: Number(item.totalVolume.toFixed(2)),
      totalShares: item.totalShares,
    }));

    // 4. Recent Platform Activity
    const recentOrders = await Order.find({ status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    const recentPlatformActivity = recentOrders.map((ord) => ({
      _id: ord._id,
      userName: ord.user?.name || 'Trader',
      userEmail: ord.user?.email || 'N/A',
      stock: ord.stock,
      companyName: ord.companyName,
      orderType: ord.orderType,
      quantity: ord.quantity,
      price: ord.price,
      totalAmount: ord.totalAmount,
      timestamp: ord.createdAt,
      status: ord.status,
    }));

    const activeStocksCount = await Stock.countDocuments({});

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalTraders,
        totalAdmins,
        totalTrades,
        totalPlatformVolume: Number(totalPlatformVolume.toFixed(2)),
        activeStocksCount,
      },
      mostTradedStocks,
      recentPlatformActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to retrieve admin dashboard analytics: ${error.message}`,
    });
  }
};

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Protected (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all platform trades across all users
// @route   GET /api/admin/trades
// @access  Protected (Admin only)
const getAllTrades = async (req, res) => {
  try {
    const trades = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: trades.length,
      trades: trades.map((t) => ({
        _id: t._id,
        traderName: t.user?.name || 'Unknown User',
        traderEmail: t.user?.email || 'N/A',
        stock: t.stock,
        companyName: t.companyName,
        orderType: t.orderType,
        quantity: t.quantity,
        price: t.price,
        totalAmount: t.totalAmount,
        status: t.status,
        timestamp: t.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust a user's virtual balance (testing tool)
// @route   PUT /api/admin/users/:id/balance
// @access  Protected (Admin only)
const adjustUserBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    const newBal = parseFloat(balance);

    if (isNaN(newBal) || newBal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid, non-negative virtual balance amount',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.virtualBalance = Number(newBal.toFixed(2));
    await user.save();

    res.status(200).json({
      success: true,
      message: `Virtual balance for ${user.name} updated to $${user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      user: { _id: user._id, name: user.name, email: user.email, virtualBalance: user.virtualBalance },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enable or disable trading for a stock
// @route   PUT /api/admin/stocks/:symbol/toggle
// @access  Protected (Admin only)
const toggleStockStatus = async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase().trim();

    let stock = await Stock.findOne({ symbol: sym });
    if (!stock) {
      stock = await Stock.create({
        symbol: sym,
        companyName: `${sym} Corporation`,
        currentPrice: 150.0,
        tradingEnabled: false,
      });
    } else {
      stock.tradingEnabled = !stock.tradingEnabled;
      await stock.save();
    }

    res.status(200).json({
      success: true,
      message: `Trading for ${stock.symbol} is now ${stock.tradingEnabled ? 'ENABLED' : 'SUSPENDED'}`,
      symbol: stock.symbol,
      tradingEnabled: stock.tradingEnabled,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all stocks with trading status for admin
// @route   GET /api/admin/stocks
// @access  Protected (Admin only)
const getAllStocksForAdmin = async (req, res) => {
  try {
    const stocks = await Stock.find({}).sort({ symbol: 1 });
    res.status(200).json({
      success: true,
      count: stocks.length,
      stocks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  getAllTrades,
  adjustUserBalance,
  toggleStockStatus,
  getAllStocksForAdmin,
};
