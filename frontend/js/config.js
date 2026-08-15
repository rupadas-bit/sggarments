/**
 * Sutorekha (সূত্ররেখা) — Frontend API Configuration
 *
 * DEFAULT: Set your Vercel backend URL in OVERRIDE_API_BASE_URL (without trailing slash).
 * LOCAL: Uses relative paths ('') automatically when testing on localhost.
 */

(function () {
  // Set your Vercel backend URL here
  let url = window.OVERRIDE_API_BASE_URL || 'https://sggarments.vercel.app';

  // Automatically remove any trailing slashes to prevent double slashes (//api) in fetch URLs
  if (typeof url === 'string') {
    url = url.replace(/\/+$/, '');
  }

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  window.API_BASE_URL = isLocalhost ? '' : url;
})();
