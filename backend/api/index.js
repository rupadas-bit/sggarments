// Vercel serverless entry point — SG Fashion Backend API
// Vercel imports this exported Express app; app.listen() is NOT called here.

require('dotenv').config();

const express = require('express');
const { connectDB } = require('../db');

// Trigger background DB connection attempt without blocking app export
connectDB().catch(err => console.error('Initial MongoDB connection error:', err));

const app = express();
app.disable('x-powered-by');

/* ------------------------------------------------------------------
   UNIVERSAL FAIL-SAFE CORS MIDDLEWARE
   Reflects requesting origin, supports credentials, and responds
   to preflight OPTIONS requests with 200 OK across all environments.
   ------------------------------------------------------------------ */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization, Origin');

  // Fast response for CORS preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

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

// Import route handlers
const productsRouter = require('../routes/products');
const ordersRouter = require('../routes/orders');
const enquiriesRouter = require('../routes/enquiries');
const configRouter = require('../routes/config');
const authRouter = require('../routes/auth');
const uploadRouter = require('../routes/upload');

// Construct single API v1 Router instance
const apiV1Router = express.Router();
apiV1Router.use('/products', productsRouter);
apiV1Router.use('/orders', ordersRouter);
apiV1Router.use('/enquiries', enquiriesRouter);
apiV1Router.use('/config', configRouter);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/upload', uploadRouter);

// Primary API Router Mount
app.use('/api/v1', apiV1Router);

// Legacy /api alias forwarder
app.use('/api', (req, res, next) => {
  if (req.url.startsWith('/v1')) {
    return next();
  }
  req.url = '/api/v1' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  return app.handle(req, res, next);
});

// 404 Catch-All Middleware for unmatched routes (includes CORS headers)
app.use((req, res) => {
  res.status(404).json({ success: false, error: `API route '${req.originalUrl}' not found.` });
});

// Global Express Error Handler
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
