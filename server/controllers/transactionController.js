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
        orderType: tx.orderType,
        quantity: tx.quantity,
        price: tx.price,
        totalValue: tx.totalValue,
        timestamp: tx.timestamp || tx.createdAt,
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
        orderType: transaction.orderType,
        quantity: transaction.quantity,
        price: transaction.price,
        totalValue: transaction.totalValue,
        timestamp: transaction.timestamp || transaction.createdAt,
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
