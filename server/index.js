const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection helper
const connectDB = require('./config/db');

// Route imports
const userRoute = require('./routes/userRoute');
const stockRoute = require('./routes/stockRoute');
const orderRoute = require('./routes/orderRoute');
const transactionRoute = require('./routes/transactionRoute');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoute);
app.use('/api/stocks', stockRoute);
app.use('/api/orders', orderRoute);
app.use('/api/transactions', transactionRoute);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'SB Stocks API is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
