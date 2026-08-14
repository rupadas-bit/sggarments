// Vercel serverless entry point — SG Fashion Backend API
// Vercel imports this exported Express app; app.listen() is NOT called here.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('../db');

// Connect to MongoDB (no-op if MONGODB_URI is unset — falls back to JSON files)
connectDB();

const app = express();

/* ------------------------------------------------------------------
   CORS — allow the deployed frontend + localhost for local dev.
   Set FRONTEND_URL in your Vercel backend environment variables,
   e.g. FRONTEND_URL=https://sggarments-fcb4.vercel.app
   ------------------------------------------------------------------ */
const allowedOrigins = [
  process.env.FRONTEND_URL,           // production frontend
  'http://localhost:3000',            // local full-stack dev
  'http://127.0.0.1:3000',
  'http://localhost:5500',            // VS Code Live Server
  'http://127.0.0.1:5500',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app preview or production URL
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ----- API Routes -----
const backendRouter = require('../server');
app.use('/api/v1', backendRouter);
app.use('/api',    backendRouter); // legacy alias

// Catch-all for unmatched API paths
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Export for Vercel serverless runtime
module.exports = app;
