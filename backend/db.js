// MongoDB connection manager.
// If MONGODB_URI is set and reachable the app uses MongoDB, otherwise it
// falls back to the JSON files under backend/data/.

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set. Running in JSON file storage mode.');
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });
    isConnected = true;
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    isConnected = false;
    return false;
  }
}

async function ensureDb() {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  return isDbConnected();
}

function isDbConnected() {
  return isConnected || (mongoose.connection && mongoose.connection.readyState === 1);
}

module.exports = { connectDB, ensureDb, isDbConnected };
