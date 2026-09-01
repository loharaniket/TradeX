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

    // 3. Most Traded Stocks (aggregated by trade frequency & volume)
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

    let mostTradedStocks = mostTradedAgg.map((item) => ({
      symbol: item._id,
      companyName: item.companyName || item._id,
      tradesCount: item.tradesCount,
      totalVolume: Number(item.totalVolume.toFixed(2)),
      totalShares: item.totalShares,
    }));

    // Fallback if platform has few or no trades yet
    if (mostTradedStocks.length === 0) {
      mostTradedStocks = [
        { symbol: 'NVDA', companyName: 'NVIDIA Corporation', tradesCount: 0, totalVolume: 0, totalShares: 0 },
        { symbol: 'AAPL', companyName: 'Apple Inc.', tradesCount: 0, totalVolume: 0, totalShares: 0 },
        { symbol: 'TSLA', companyName: 'Tesla Inc.', tradesCount: 0, totalVolume: 0, totalShares: 0 },
        { symbol: 'MSFT', companyName: 'Microsoft Corporation', tradesCount: 0, totalVolume: 0, totalShares: 0 },
      ];
    }

    // 4. Recent Platform Activity (Latest 10 trades across all platform users)
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

    // 5. Total stocks listed
    const activeStocksCount = (await Stock.countDocuments({})) || 10;

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

module.exports = {
  getAdminDashboard,
};
