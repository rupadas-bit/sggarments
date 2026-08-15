// Contact form submission handlers.

const fs = require('fs');
const path = require('path');
const Enquiry = require('../models/Enquiry');
const { isDbConnected, ensureDb } = require('../db');
const { getStoreConfig } = require('./configController');

const enquiriesFilePath = path.join(__dirname, '../data/enquiries.json');
const writableEnquiriesFilePath = process.env.VERCEL
  ? '/tmp/enquiries.json'
  : enquiriesFilePath;

function stripMongo(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

async function readEnquiries() {
  await ensureDb();
  if (isDbConnected()) {
    try {
      const docs = await Enquiry.find({}).lean();
      return docs.map(stripMongo);
    } catch (err) {
      console.error('Error reading enquiries from MongoDB:', err);
    }
  }

  try {
    const targetFile = fs.existsSync(writableEnquiriesFilePath) ? writableEnquiriesFilePath : enquiriesFilePath;
    if (!fs.existsSync(targetFile)) return [];
    const raw = fs.readFileSync(targetFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading enquiries data:', err);
    return [];
  }
}

async function saveEnquiries(enquiries) {
  await ensureDb();
  if (isDbConnected()) {
    const ops = enquiries.map(e => ({
      updateOne: {
        filter: { enquiryId: e.enquiryId },
        update: { $set: e },
        upsert: true
      }
    }));
    await Enquiry.bulkWrite(ops);
    return true;
  }

  try {
    fs.writeFileSync(writableEnquiriesFilePath, JSON.stringify(enquiries, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving enquiry:', err);
    return false;
  }
}

// POST /api/v1/enquiries
exports.createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in your Name, Phone Number, and Message.'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit phone number.'
      });
    }

    const storeConfig = await getStoreConfig();
    const storeWhatsapp = storeConfig.whatsappNumber;
    const enquiryId = 'ENQ-' + Math.floor(100000 + Math.random() * 900000);

    const enquiryRecord = {
      enquiryId,
      timestamp: new Date().toISOString(),
      name,
      phone: cleanPhone,
      email: email || '',
      message
    };

    const enquiries = await readEnquiries();
    enquiries.push(enquiryRecord);
    await saveEnquiries(enquiries);

    const waMsg = `*SUTOREKHA STORE ENQUIRY*\n*ID:* #${enquiryId}\n\nName: ${name}\nPhone: ${cleanPhone}\nEmail: ${email || 'N/A'}\n\n*Message:*\n${message}`;
    const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(waMsg)}`;

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      enquiryId,
      whatsappUrl
    });
  } catch (err) {
    console.error('createEnquiry error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/enquiries
exports.getEnquiries = async (req, res) => {
  try {
    const enquiries = await readEnquiries();
    res.json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (err) {
    console.error('getEnquiries error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};
