// Order formatting handlers.

const fs = require('fs');
const path = require('path');
const Order = require('../models/Order');
const { isDbConnected, ensureDb } = require('../db');
const { getStoreConfig } = require('./configController');
const { sendOrderNotificationEmail } = require('../mailer');

const ordersFilePath = path.join(__dirname, '../data/orders.json');
const writableOrdersFilePath = process.env.VERCEL
  ? '/tmp/orders.json'
  : ordersFilePath;

function stripMongo(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

async function readOrders() {
  await ensureDb();
  if (isDbConnected()) {
    try {
      const docs = await Order.find({}).lean();
      return docs.map(stripMongo);
    } catch (err) {
      console.error('Error reading orders from MongoDB:', err);
    }
  }

  try {
    const targetFile = fs.existsSync(writableOrdersFilePath) ? writableOrdersFilePath : ordersFilePath;
    if (!fs.existsSync(targetFile)) return [];
    const raw = fs.readFileSync(targetFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading orders data:', err);
    return [];
  }
}

async function saveOrders(orders) {
  await ensureDb();
  if (isDbConnected()) {
    const ops = orders.map(o => ({
      updateOne: {
        filter: { orderId: o.orderId },
        update: { $set: o },
        upsert: true
      }
    }));
    await Order.bulkWrite(ops);
    return true;
  }

  try {
    fs.writeFileSync(writableOrdersFilePath, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving order record:', err);
    return false;
  }
}

// POST /api/v1/orders
exports.createOrder = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      pincode,
      address,
      city,
      productName,
      productId,
      price,
      selectedColor,
      selectedSize,
      quantity,
      paymentMethod,
      notes
    } = req.body;

    // Server-side Validation
    if (!fullName || !phone || !address || !pincode) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required customer details (Name, Phone, Address, PIN Code).'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit phone/WhatsApp number.'
      });
    }

    const storeConfig = await getStoreConfig();
    const storeWhatsapp = storeConfig.whatsappNumber;
    const orderId = 'SGG-' + Math.floor(100000 + Math.random() * 900000);
    const qty = parseInt(quantity, 10) || 1;
    const unitPrice = parseFloat(price) || 0;
    const totalPrice = unitPrice * qty;

    const orderRecord = {
      orderId,
      timestamp: new Date().toISOString(),
      customer: {
        fullName,
        phone: cleanPhone,
        email: email || 'N/A',
        pincode,
        address,
        city: city || 'N/A'
      },
      item: {
        productId,
        productName: productName || 'Sutorekha Apparel Item',
        selectedColor: selectedColor || 'Standard Color',
        selectedSize: selectedSize || 'Standard Size',
        quantity: qty,
        unitPrice,
        totalPrice
      },
      paymentMethod: paymentMethod || 'Cash on Delivery / WhatsApp Payment',
      notes: notes || '',
      status: 'PENDING_WHATSAPP'
    };

    // Save order to backend data repository
    const orders = await readOrders();
    orders.push(orderRecord);
    await saveOrders(orders);

    // Trigger automated Zoho Mail email notification in background (non-blocking)
    sendOrderNotificationEmail(orderRecord).catch(err => {
      console.error('Background order email notification error:', err.message);
    });

    // Construct formatted WhatsApp message for store owner
    let waMsg = `*NEW ORDER SUBMISSION — SUTOREKHA (সূত্ররেখা)*\n`;
    waMsg += `*Order ID:* #${orderId}\n\n`;
    waMsg += `*PRODUCT DETAILS*\n`;
    waMsg += `• *Item:* ${orderRecord.item.productName}\n`;
    waMsg += `• *Color:* ${orderRecord.item.selectedColor}\n`;
    waMsg += `• *Size:* ${orderRecord.item.selectedSize}\n`;
    waMsg += `• *Quantity:* ${orderRecord.item.quantity}\n`;
    waMsg += `• *Total Price:* ₹${orderRecord.item.totalPrice.toLocaleString('en-IN')}\n\n`;
    waMsg += `*CUSTOMER DETAILS*\n`;
    waMsg += `• *Name:* ${fullName}\n`;
    waMsg += `• *Phone:* ${cleanPhone}\n`;
    if (email) waMsg += `• *Email:* ${email}\n`;
    waMsg += `• *Delivery Address:* ${address}, ${city || ''} — ${pincode}\n`;
    waMsg += `• *Payment Mode:* ${orderRecord.paymentMethod}\n`;
    if (notes) waMsg += `\n*Note:* ${notes}`;

    const encodedMsg = encodeURIComponent(waMsg);
    const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodedMsg}`;

    res.status(201).json({
      success: true,
      message: 'Order created successfully and queued for owner dispatch.',
      orderId,
      whatsappUrl,
      data: orderRecord
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/orders (for store management / admin logging)
exports.getOrders = async (req, res) => {
  try {
    const orders = await readOrders();
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};
