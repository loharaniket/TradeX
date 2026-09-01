const mongoose = require('mongoose');

// Connect to Cloud MongoDB (e.g., MongoDB Atlas) using Mongoose
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn('Warning: MONGO_URI is not defined in server/.env file.');
    console.warn('Please add your Cloud MongoDB connection string to server/.env');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, { dbName: 'tradex' });
    console.log(`Cloud MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Cloud MongoDB Connection Error: ${error.message}`);
    console.log('Troubleshooting tips for MongoDB Atlas:');
    console.log('1. Verify your database username and password in server/.env');
    console.log('2. Ensure your IP address is allowed in Atlas Network Access (e.g., allow 0.0.0.0/0 for development)');
    console.log('3. Ensure the database name is specified in the URI');
  }
};

module.exports = connectDB;
