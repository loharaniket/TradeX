const Transaction = require('../models/transactionModel');

// @desc    Get all immutable transactions for the logged-in user
// @route   GET /api/transactions
// @access  Protected
const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({
      timestamp: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions: transactions.map((tx) => ({
        _id: tx._id,
        stock: tx.stock,
        companyName: tx.companyName,
        type: tx.type || tx.orderType,
        orderType: tx.orderType || tx.type,
        quantity: tx.quantity,
        price: tx.price,
        totalAmount: tx.totalAmount || tx.totalValue,
        totalValue: tx.totalValue || tx.totalAmount,
        timestamp: tx.timestamp || tx.date || tx.createdAt,
        status: 'COMPLETED',
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to retrieve transaction history: ${error.message}`,
    });
  }
};

// @desc    Get single immutable transaction details by ID
// @route   GET /api/transactions/:id
// @access  Protected
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction: {
        _id: transaction._id,
        stock: transaction.stock,
        companyName: transaction.companyName,
        type: transaction.type || transaction.orderType,
        orderType: transaction.orderType || transaction.type,
        quantity: transaction.quantity,
        price: transaction.price,
        totalAmount: transaction.totalAmount || transaction.totalValue,
        totalValue: transaction.totalValue || transaction.totalAmount,
        timestamp: transaction.timestamp || transaction.date || transaction.createdAt,
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error retrieving transaction: ${error.message}`,
    });
  }
};

module.exports = {
  getUserTransactions,
  getTransactionById,
};
