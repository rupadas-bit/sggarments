/**
 * LOCAL DEVELOPMENT SERVER ONLY
 * ─────────────────────────────
 * This file is NOT used in production.
 *
 * For Vercel deployment:
 *   • Frontend  → deploy the  `frontend/`  directory
 *   • Backend   → deploy the  `backend/`   directory
 *
 * Run locally with:  node server.js  (or npm run dev from root)
 *
 * This server serves the frontend statically and proxies all /api/* requests
 * to the same Express backend — replicating what the two Vercel deployments do.
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync(path.join(__dirname, '.env'))) {
  dotenv.config({ path: path.join(__dirname, '.env') });
} else if (fs.existsSync(path.join(__dirname, 'backend', '.env'))) {
  dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
} else {
  dotenv.config();
}
const express = require('express');
const { connectDB } = require('./backend/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Attempt MongoDB connection (falls back to JSON storage if unavailable)
connectDB();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Backend API Routes (inline — mirrors the Vercel backend deployment)
const backendApi = require('./backend/server');
app.use('/api/v1', backendApi);
app.use('/api', backendApi);

// Serve static assets from frontend directory
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  let reqPath = req.path === '/' ? '/index.html' : req.path;
  if (!reqPath.includes('.')) reqPath += '.html';

  const filePath = path.join(frontendPath, reqPath);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);

  res.sendFile(path.join(frontendPath, 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`\n  ✅  SG Fashion dev server → http://localhost:${port}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use — trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

startServer(Number(PORT));
