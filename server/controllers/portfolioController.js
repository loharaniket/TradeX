const Order = require('../models/orderSchema');
const Stock = require('../models/stockSchema');
const User = require('../models/userModel');

// Baseline stock information fallback
const DEFAULT_STOCKS = {
  AAPL: { companyName: 'Apple Inc.', price: 232.50 },
  MSFT: { companyName: 'Microsoft Corporation', price: 428.15 },
  GOOGL: { companyName: 'Alphabet Inc.', price: 165.40 },
  AMZN: { companyName: 'Amazon.com Inc.', price: 188.90 },
  TSLA: { companyName: 'Tesla Inc.', price: 218.80 },
  NVDA: { companyName: 'NVIDIA Corporation', price: 121.25 },
  META: { companyName: 'Meta Platforms Inc.', price: 512.60 },
  NFLX: { companyName: 'Netflix Inc.', price: 684.30 },
  JPM: { companyName: 'JPMorgan Chase & Co.', price: 214.70 },
  V: { companyName: 'Visa Inc.', price: 272.40 },
};

// @desc    Get complete user portfolio with holdings, current prices, and P&L
// @route   GET /api/portfolio
// @access  Protected
const getPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Retrieve all completed orders for this user in chronological order
    const orders = await Order.find({ user: user._id, status: 'COMPLETED' }).sort({ createdAt: 1 });

    // Track holdings by symbol
    const holdingsMap = {};

    orders.forEach((order) => {
      const sym = order.stock.toUpperCase();
      if (!holdingsMap[sym]) {
        holdingsMap[sym] = {
          symbol: sym,
          companyName: order.companyName || DEFAULT_STOCKS[sym]?.companyName || sym,
          quantity: 0,
          totalCost: 0,
        };
      }

      if (order.orderType === 'BUY') {
        holdingsMap[sym].quantity += order.quantity;
        holdingsMap[sym].totalCost += order.totalAmount;
      } else if (order.orderType === 'SELL') {
        if (holdingsMap[sym].quantity > 0) {
          const avgCost = holdingsMap[sym].totalCost / holdingsMap[sym].quantity;
          holdingsMap[sym].quantity -= order.quantity;
          holdingsMap[sym].totalCost -= order.quantity * avgCost;

          if (holdingsMap[sym].quantity <= 0) {
            holdingsMap[sym].quantity = 0;
            holdingsMap[sym].totalCost = 0;
          }
        }
      }
    });

    // Fetch active stock prices to value holdings
    let totalInvested = 0;
    let totalPortfolioValue = 0;
    const activeHoldings = [];

    for (const sym of Object.keys(holdingsMap)) {
      const item = holdingsMap[sym];
      if (item.quantity > 0) {
        let currentPrice = DEFAULT_STOCKS[sym]?.price || (item.totalCost / item.quantity);

        try {
          const stockDoc = await Stock.findOne({ symbol: sym });
          if (stockDoc && stockDoc.currentPrice) {
            currentPrice = stockDoc.currentPrice;
            item.companyName = stockDoc.companyName || item.companyName;
          }
        } catch {
          // Ignore
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

    res.status(200).json({
      success: true,
      summary: {
        availableCash,
        totalInvested: Number(totalInvested.toFixed(2)),
        totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
        totalProfitLoss,
        totalProfitLossPercent,
        totalNetWorth,
        holdingsCount: activeHoldings.length,
      },
      holdings: activeHoldings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to calculate portfolio: ${error.message}`,
    });
  }
};

module.exports = {
  getPortfolio,
};
