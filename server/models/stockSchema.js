const mongoose = require('mongoose');

// Stock schema definition
const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      default: 0,
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
    },
    high52Week: {
      type: Number,
      default: 0,
    },
    low52Week: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
