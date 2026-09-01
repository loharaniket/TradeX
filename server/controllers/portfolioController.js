const Order = require('../models/orderSchema');
const Stock = require('../models/stockSchema');
const User = require('../models/userModel');

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
          companyName: order.companyName || sym,
          quantity: 0,
          shares: 0,
          totalCost: 0,
        };
      }

      if (order.orderType === 'BUY') {
        holdingsMap[sym].quantity += order.quantity;
        holdingsMap[sym].shares += order.quantity;
        holdingsMap[sym].totalCost += order.totalAmount;
      } else if (order.orderType === 'SELL') {
        if (holdingsMap[sym].quantity > 0) {
          const avgCost = holdingsMap[sym].totalCost / holdingsMap[sym].quantity;
          holdingsMap[sym].quantity -= order.quantity;
          holdingsMap[sym].shares -= order.quantity;
          holdingsMap[sym].totalCost -= order.quantity * avgCost;

          if (holdingsMap[sym].quantity <= 0) {
            holdingsMap[sym].quantity = 0;
            holdingsMap[sym].shares = 0;
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
        let currentPrice = item.totalCost / item.quantity;

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
          shares: item.quantity,
          averageBuyPrice,
          currentPrice: Number(currentPrice.toFixed(2)),
          investedAmount,
          currentValue,
          currentValuation: currentValue,
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

    const summary = {
      availableCash,
      totalInvested: Number(totalInvested.toFixed(2)),
      totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
      totalProfitLoss,
      totalProfitLossPercent,
      totalNetWorth,
      holdingsCount: activeHoldings.length,
    };

    res.status(200).json({
      success: true,
      summary,
      holdings: activeHoldings,
      portfolio: {
        summary,
        holdings: activeHoldings,
      },
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
