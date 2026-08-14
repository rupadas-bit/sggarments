// MongoDB connection manager.
// If MONGODB_URI is set and reachable the app uses MongoDB, otherwise it
// falls back to JSON file storage.

const mongoose = require('mongoose');

let isConnected = false;
let lastFailTime = 0;
const FAIL_RETRY_INTERVAL_MS = 30000; // Retry connection after 30s on failure

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    if (!process.env.SUPPRESS_MONGO_WARN) {
      console.warn('MONGODB_URI is not set. Running in JSON fallback storage mode.');
      process.env.SUPPRESS_MONGO_WARN = 'true';
    }
    isConnected = false;
    return false;
  }

  // Reuse existing active connection
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // Prevent repeated 8s timeouts if connection failed recently
  if (!isConnected && Date.now() - lastFailTime < FAIL_RETRY_INTERVAL_MS) {
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    isConnected = true;
    console.log('Connected successfully to MongoDB Atlas');
    return true;
  } catch (err) {
    lastFailTime = Date.now();
    isConnected = false;
    console.error('MongoDB connection failed (falling back to JSON mode):', err.message);
    return false;
  }
}

async function ensureDb() {
  if (process.env.MONGODB_URI && (!mongoose.connection || mongoose.connection.readyState !== 1)) {
    await connectDB();
  }
  return isDbConnected();
}

function isDbConnected() {
  return isConnected || (mongoose.connection && mongoose.connection.readyState === 1);
}

module.exports = { connectDB, ensureDb, isDbConnected };
