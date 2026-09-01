const express = require('express');
const router = express.Router();
const {
  getAllStocks,
  getStockBySymbol,
  getStockHistory,
} = require('../controllers/stockController');

// Stock browsing and detail routes
router.get('/', getAllStocks);
router.get('/:symbol', getStockBySymbol);
router.get('/:symbol/history', getStockHistory);

module.exports = router;
