const mongoose = require('mongoose');

const storeConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  storeName: String,
  whatsappNumber: String,
  phone: String,
  email: String,
  address: String,
  hours: String,
  logo: String,
  heroImage: String,
  promoHeading: String,
  promoSubtext: String,
  promoBtnText: String,
  promoBtnLink: String
}, { timestamps: true, strict: false });

module.exports = mongoose.models.StoreConfig || mongoose.model('StoreConfig', storeConfigSchema);
