/**
 * SG Fashion — Frontend API Configuration
 *
 * IMPORTANT: Set BACKEND_URL to your actual Vercel backend deployment URL.
 *
 * How to find your backend URL:
 *   1. Go to https://vercel.com/dashboard
 *   2. Open your BACKEND project (root: backend/)
 *   3. Copy the deployment URL (e.g. https://sg-fashion-api.vercel.app)
 *   4. Replace the value below.
 *
 * LOCAL DEV: Leave as '' (empty string) — relative paths work with local server.
 */

// Auto-detect: use empty string locally, use backend URL on Vercel frontend deployment
(function () {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // ← REPLACE this with your actual backend Vercel URL (no trailing slash)
  const BACKEND_VERCEL_URL = 'https://sggarments-api.vercel.app';

  window.API_BASE_URL = isLocalhost ? '' : BACKEND_VERCEL_URL;
})();
