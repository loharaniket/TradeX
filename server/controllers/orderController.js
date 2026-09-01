const Order = require('../models/orderSchema');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const Stock = require('../models/stockSchema');

// Helper to get current stock price and name from Stock collection
const getStockPriceAndName = async (symbol) => {
  const sym = symbol.toUpperCase().trim();
  try {
    const stock = await Stock.findOne({ symbol: sym });
    if (stock && stock.currentPrice) {
      return {
        companyName: stock.companyName,
        currentPrice: stock.currentPrice,
        tradingEnabled: stock.tradingEnabled !== false,
      };
    }
  } catch {
    // Continue
  }
  return null;
};

// @desc    Create a new paper trading order (BUY or SELL)
// @route   POST /api/orders
// @access  Protected
const createOrder = async (req, res) => {
  try {
    const { symbol, orderType, quantity } = req.body;

    // 1. Validate inputs
    if (!symbol || !orderType || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide stock symbol, order type (BUY or SELL), and quantity',
      });
    }

    const type = orderType.toUpperCase().trim();
    if (type !== 'BUY' && type !== 'SELL') {
      return res.status(400).json({
        success: false,
        message: 'Order type must be either BUY or SELL',
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer greater than 0',
      });
    }

    const sym = symbol.toUpperCase().trim();

    // 2. Fetch stock price & trading status
    const stockInfo = await getStockPriceAndName(sym);
    if (!stockInfo) {
      return res.status(404).json({
        success: false,
        message: `Stock '${sym}' is not currently available for trading`,
      });
    }

    if (stockInfo.tradingEnabled === false) {
      return res.status(400).json({
        success: false,
        message: `Trading for ${sym} is currently suspended by the platform administrator.`,
      });
    }

    const { companyName, currentPrice } = stockInfo;
    const totalAmount = Number((qty * currentPrice).toFixed(2));

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (type === 'BUY') {
      if (user.virtualBalance < totalAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient virtual balance. You need $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} but only have $${user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        });
      }
      user.virtualBalance = Number((user.virtualBalance - totalAmount).toFixed(2));
    } else if (type === 'SELL') {
      const userOrders = await Order.find({ user: user._id, stock: sym, status: 'COMPLETED' });
      let ownedShares = 0;
      userOrders.forEach((o) => {
        if (o.orderType === 'BUY') ownedShares += o.quantity;
        else if (o.orderType === 'SELL') ownedShares -= o.quantity;
      });

      if (ownedShares < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient shares to sell. You currently own ${ownedShares} shares of ${sym}, but attempted to sell ${qty}.`,
        });
      }
      user.virtualBalance = Number((user.virtualBalance + totalAmount).toFixed(2));
    }

    await user.save();

    const order = await Order.create({
      user: user._id,
      stock: sym,
      companyName,
      orderType: type,
      quantity: qty,
      price: currentPrice,
      totalAmount,
      status: 'COMPLETED',
    });

    const transaction = await Transaction.create({
      user: user._id,
      stock: sym,
      companyName,
      orderType: type,
      quantity: qty,
      price: currentPrice,
      totalValue: totalAmount,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Successfully ${type === 'BUY' ? 'purchased' : 'sold'} ${qty} shares of ${sym} for $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      order,
      transaction,
      updatedBalance: user.virtualBalance,
      userRemainingBalance: user.virtualBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to execute paper trading order: ${error.message}`,
    });
  }
};

// @desc    Get user's holding quantity for a specific stock
// @route   GET /api/orders/holding/:symbol
// @access  Protected
const getUserStockHolding = async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase().trim();
    const orders = await Order.find({ user: req.user._id, stock: sym, status: 'COMPLETED' });

    let ownedShares = 0;
    let totalCost = 0;

    orders.forEach((o) => {
      if (o.orderType === 'BUY') {
        ownedShares += o.quantity;
        totalCost += o.totalAmount;
      } else if (o.orderType === 'SELL') {
        if (ownedShares > 0) {
          const avgCost = totalCost / ownedShares;
          ownedShares -= o.quantity;
          totalCost -= o.quantity * avgCost;
          if (ownedShares <= 0) {
            ownedShares = 0;
            totalCost = 0;
          }
        }
      }
    });

    const averageBuyPrice = ownedShares > 0 ? Number((totalCost / ownedShares).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      symbol: sym,
      ownedShares,
      averageBuyPrice,
      totalInvested: Number(totalCost.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
// @access  Protected
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order details by order ID
// @route   GET /api/orders/:id
// @access  Protected
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getUserStockHolding,
};
