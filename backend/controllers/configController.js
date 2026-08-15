// Store configuration persistence.
// Settings edited in the admin panel are stored in MongoDB (when connected)
// or in backend/data/config.json as a fallback.
// Environment variables (STORE_*) act as the initial defaults / fallback.

const fs = require('fs');
const path = require('path');
const StoreConfig = require('../models/StoreConfig');
const { isDbConnected, ensureDb } = require('../db');

const configFilePath = path.join(__dirname, '../data/config.json');
const writableConfigFilePath = process.env.VERCEL
  ? '/tmp/config.json'
  : configFilePath;

const envDefaults = {
  storeName: process.env.STORE_NAME || 'সূত্ররেখা (Sutorekha)',
  whatsappNumber: process.env.STORE_WHATSAPP_NUMBER || '919876543210',
  phone: process.env.STORE_PHONE || '+91 98765 43210',
  email: process.env.STORE_EMAIL || 'support@sutorekha.com',
  address: process.env.STORE_ADDRESS || 'Commercial Hub, M.G. Road, Kolkata, West Bengal — 700007',
  hours: process.env.STORE_HOURS || 'Mon – Sat: 10:00 AM – 8:30 PM | Sun: 11:00 AM – 6:00 PM',
  logo: process.env.STORE_LOGO || '',
  heroImage: process.env.STORE_HERO_IMAGE || ''
};

async function readStoredConfig() {
  await ensureDb();
  if (isDbConnected()) {
    try {
      const doc = await StoreConfig.findOne({ key: 'main' }).lean();
      if (doc) {
        const { _id, __v, key, createdAt, updatedAt, ...rest } = doc;
        return rest;
      }
      return {};
    } catch (err) {
      console.error('Error reading config from MongoDB:', err);
    }
  }

  try {
    const targetFile = fs.existsSync(writableConfigFilePath) ? writableConfigFilePath : configFilePath;
    if (!fs.existsSync(targetFile)) return {};
    return JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  } catch (err) {
    console.error('Error reading config data:', err);
    return {};
  }
}

async function saveStoredConfig(config) {
  await ensureDb();
  if (isDbConnected()) {
    await StoreConfig.findOneAndUpdate({ key: 'main' }, { $set: config }, { upsert: true });
    return true;
  }

  try {
    fs.writeFileSync(writableConfigFilePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving config data:', err);
    return false;
  }
}

// Merges stored settings over env defaults. Stored settings take priority.
async function getStoreConfig() {
  return { ...envDefaults, ...(await readStoredConfig()) };
}

// GET /api/v1/config (public)
exports.getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: await getStoreConfig()
    });
  } catch (err) {
    console.error('getConfig error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// PUT /api/v1/config (admin only)
exports.updateConfig = async (req, res) => {
  try {
    const stored = await readStoredConfig();
    const allowed = ['storeName', 'whatsappNumber', 'phone', 'email', 'address', 'hours', 'logo', 'heroImage'];
    const updated = { ...stored };

    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        updated[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
    });

    if (updated.whatsappNumber) {
      const clean = updated.whatsappNumber.replace(/\D/g, '');
      if (clean.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'WhatsApp number must contain at least 10 digits.'
        });
      }
      updated.whatsappNumber = clean;
    }

    const saved = await saveStoredConfig(updated);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save store settings.'
      });
    }

    res.json({
      success: true,
      message: 'Store settings updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('updateConfig error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

exports.getStoreConfig = getStoreConfig;
