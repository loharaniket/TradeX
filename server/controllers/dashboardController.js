const User = require('../models/userModel');
const Order = require('../models/orderSchema');
const Transaction = require('../models/transactionModel');
const Stock = require('../models/stockSchema');

// @desc    Get aggregated dashboard summary (account, portfolio, recent trades, market highlights)
// @route   GET /api/dashboard
// @access  Protected
const getDashboardSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Compute Portfolio & Holdings
    const orders = await Order.find({ user: user._id, status: 'COMPLETED' }).sort({ createdAt: 1 });
    const holdingsMap = {};

    orders.forEach((ord) => {
      const sym = ord.stock.toUpperCase();
      if (!holdingsMap[sym]) {
        holdingsMap[sym] = {
          symbol: sym,
          companyName: ord.companyName || sym,
          quantity: 0,
          totalCost: 0,
        };
      }

      if (ord.orderType === 'BUY') {
        holdingsMap[sym].quantity += ord.quantity;
        holdingsMap[sym].totalCost += ord.totalAmount;
      } else if (ord.orderType === 'SELL') {
        if (holdingsMap[sym].quantity > 0) {
          const avgCost = holdingsMap[sym].totalCost / holdingsMap[sym].quantity;
          holdingsMap[sym].quantity -= ord.quantity;
          holdingsMap[sym].totalCost -= ord.quantity * avgCost;
          if (holdingsMap[sym].quantity <= 0) {
            holdingsMap[sym].quantity = 0;
            holdingsMap[sym].totalCost = 0;
          }
        }
      }
    });

    let totalInvested = 0;
    let totalPortfolioValue = 0;
    const activeHoldings = [];

    for (const sym of Object.keys(holdingsMap)) {
      const item = holdingsMap[sym];
      if (item.quantity > 0) {
        let currentPrice = item.totalCost / item.quantity;
        try {
          const stockDoc = await Stock.findOne({ symbol: sym });
          if (stockDoc && stockDoc.currentPrice) {
            currentPrice = stockDoc.currentPrice;
            item.companyName = stockDoc.companyName || item.companyName;
          }
        } catch {
          // Continue
        }

        const averageBuyPrice = Number((item.totalCost / item.quantity).toFixed(2));
        const currentValue = Number((item.quantity * currentPrice).toFixed(2));
        const investedAmount = Number(item.totalCost.toFixed(2));
        const unrealizedProfitLoss = Number((currentValue - investedAmount).toFixed(2));
        const profitLossPercent = investedAmount > 0
          ? Number(((unrealizedProfitLoss / investedAmount) * 100).toFixed(2))
          : 0;

        totalInvested += investedAmount;
        totalPortfolioValue += currentValue;

        activeHoldings.push({
          symbol: item.symbol,
          companyName: item.companyName,
          quantity: item.quantity,
          averageBuyPrice,
          currentPrice: Number(currentPrice.toFixed(2)),
          investedAmount,
          currentValue,
          unrealizedProfitLoss,
          profitLossPercent,
        });
      }
    }

    const availableCash = Number((user.virtualBalance || 0).toFixed(2));
    const totalNetWorth = Number((availableCash + totalPortfolioValue).toFixed(2));
    const totalProfitLoss = Number((totalPortfolioValue - totalInvested).toFixed(2));
    const totalProfitLossPercent = totalInvested > 0
      ? Number(((totalProfitLoss / totalInvested) * 100).toFixed(2))
      : 0;

    // 2. Fetch Recent 5 Transactions from MongoDB Atlas
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(5);

    // 3. Market Highlights from MongoDB Atlas Stock Collection
    let marketHighlights = [];
    try {
      const allStocks = await Stock.find({});
      if (allStocks && allStocks.length > 0) {
        marketHighlights = [...allStocks]
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 4)
          .map((s) => ({
            symbol: s.symbol,
            companyName: s.companyName,
            currentPrice: s.currentPrice,
            change: s.change,
            changePercent: s.changePercent,
          }));
      }
    } catch {
      // Continue
    }

    res.status(200).json({
      success: true,
      account: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      portfolio: {
        availableCash,
        totalInvested: Number(totalInvested.toFixed(2)),
        totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
        totalProfitLoss,
        totalProfitLossPercent,
        totalNetWorth,
        holdingsCount: activeHoldings.length,
        topHoldings: activeHoldings.slice(0, 4),
      },
      recentTransactions: recentTransactions.map((tx) => ({
        _id: tx._id,
        stock: tx.stock,
        companyName: tx.companyName,
        orderType: tx.orderType,
        quantity: tx.quantity,
        price: tx.price,
        totalValue: tx.totalValue,
        timestamp: tx.timestamp || tx.createdAt,
        status: 'COMPLETED',
      })),
      marketHighlights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to load dashboard data: ${error.message}`,
    });
  }
};

module.exports = {
  getDashboardSummary,
};
