// Node.js / Express API server entry point.

const express = require('express');

function createBackendRouter() {
  const router = express.Router();

  const productsRouter = require('./routes/products');
  const ordersRouter = require('./routes/orders');
  const enquiriesRouter = require('./routes/enquiries');
  const configRouter = require('./routes/config');
  const authRouter = require('./routes/auth');
  const uploadRouter = require('./routes/upload');

  router.use('/products', productsRouter);
  router.use('/orders', ordersRouter);
  router.use('/enquiries', enquiriesRouter);
  router.use('/config', configRouter);
  router.use('/auth', authRouter);
  router.use('/upload', uploadRouter);

  return router;
}

module.exports = createBackendRouter();
