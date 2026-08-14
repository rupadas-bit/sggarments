// Vercel serverless entry point — SG Fashion Backend API
// Vercel imports this exported Express app; app.listen() is NOT called here.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('../db');

// Trigger background DB connection attempt without blocking app export
connectDB().catch(err => console.error('Initial MongoDB connection error:', err));

const app = express();
app.disable('x-powered-by');

/* ------------------------------------------------------------------
   CORS — permissive origin resolver for serverless environments
   ------------------------------------------------------------------ */
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser, server-to-server, curl, or Postman requests
    if (!origin) return callback(null, true);
    // Allow all *.vercel.app domains (frontend, preview, production)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow local development servers
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // Allow explicitly defined FRONTEND_URL if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    // Fallback allow to guarantee seamless API communication across domains
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Root health-check endpoint (prevents 500/404 on direct backend URL access)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SG Garments Backend API is online and operational.',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node Environment',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SG Garments API v1 Endpoints are ready.',
    routes: ['/api/v1/products', '/api/v1/orders', '/api/v1/enquiries', '/api/v1/config', '/api/v1/auth']
  });
});

// ----- API Routes -----
const backendRouter = require('../server');
app.use('/api/v1', backendRouter);
app.use('/api',    backendRouter); // legacy route prefix alias

// 404 Catch-All Middleware for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `API route '${req.originalUrl}' not found.` });
});

// Global Express Error Handler (4-argument signature prevents Serverless apply error)
app.use((err, req, res, next) => {
  console.error('Express Serverless Execution Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Export Express app for Vercel Serverless execution
module.exports = app;
