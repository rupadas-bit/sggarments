// Vercel serverless entry point — SG Fashion Backend API

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('../db');

connectDB().catch(() => {});

const app = express();
app.disable('x-powered-by');

// CORS
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'SG Garments API is running.' });
});

// Mount all API routes under a single fresh Router — no double-mounting
const apiRouter = express.Router();

apiRouter.use('/products',  require('../routes/products'));
apiRouter.use('/orders',    require('../routes/orders'));
apiRouter.use('/enquiries', require('../routes/enquiries'));
apiRouter.use('/config',    require('../routes/config'));
apiRouter.use('/auth',      require('../routes/auth'));
apiRouter.use('/upload',    require('../routes/upload'));

// Single mount — /api/v1 only, no legacy alias (eliminates double-mount & recursive app.handle)
app.use('/api/v1', apiRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// Global error handler (4-arg required for Express to recognise it as error middleware)
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error.' });
});

module.exports = app;
