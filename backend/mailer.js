/**
 * SG Fashion — Zoho Mail & SMTP Order Notification Mailer
 * ─────────────────────────────────────────────────────────────
 * Sends automated email notifications for new orders and enquiries via Zoho Mail.
 * 
 * Environment Variables required for Zoho Mail:
 *   • ZOHO_MAIL_USER (or ZOHO_USER / SMTP_USER): e.g. support@sggarments.com
 *   • ZOHO_MAIL_PASS (or ZOHO_PASS / SMTP_PASS): Zoho password or App-Specific Password
 *   • ZOHO_SMTP_HOST: Optional, defaults to "smtppro.zoho.in" (or "smtp.zoho.com")
 *   • ZOHO_SMTP_PORT: Optional, defaults to 465 (SSL) or 587 (TLS)
 *   • NOTIFICATION_EMAIL: Optional, email to receive order alerts (defaults to STORE_EMAIL or ZOHO_MAIL_USER)
 */

const nodemailer = require('nodemailer');

function createTransporter(targetHost) {
  const user = process.env.ZOHO_MAIL_USER || process.env.ZOHO_USER || process.env.SMTP_USER;
  const pass = process.env.ZOHO_MAIL_PASS || process.env.ZOHO_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  const host = targetHost || process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
  const port = parseInt(process.env.ZOHO_SMTP_PORT || '465', 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends an automated email notification when a customer places an order.
 * @param {Object} order Record containing orderId, customer, item, paymentMethod, notes, etc.
 */
async function sendOrderNotificationEmail(order) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('⚠️ [Mailer] Zoho Mail credentials (ZOHO_MAIL_USER & ZOHO_MAIL_PASS) not configured in .env. Skipping email dispatch.');
      return false;
    }

    const fromUser = process.env.ZOHO_MAIL_USER || process.env.ZOHO_USER || process.env.SMTP_USER;
    const recipientEmail = process.env.NOTIFICATION_EMAIL || process.env.STORE_EMAIL || fromUser;

    const item = order.item || {};
    const customer = order.customer || {};
    const formattedPrice = item.totalPrice ? `₹${item.totalPrice.toLocaleString('en-IN')}` : `₹0`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121214; color: #e4e4e7; margin: 0; padding: 20px; }
          .email-card { max-width: 600px; margin: 0 auto; background: #1a1a1e; border-radius: 12px; border: 1px solid #3f3f46; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .email-header { background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 24px; text-align: center; border-bottom: 2px solid #c59b27; }
          .email-header h1 { color: #f4e078; font-size: 22px; margin: 0 0 6px 0; font-family: Georgia, serif; letter-spacing: 0.5px; }
          .email-header p { color: #a1a1aa; font-size: 13px; margin: 0; }
          .order-badge { display: inline-block; background: rgba(197, 155, 39, 0.15); color: #f4e078; border: 1px solid rgba(197, 155, 39, 0.4); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-top: 10px; }
          .section { padding: 20px 24px; border-bottom: 1px solid #27272a; }
          .section-title { font-size: 14px; font-weight: 700; color: #c59b27; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .info-table { width: 100%; border-collapse: collapse; }
          .info-table td { padding: 8px 0; font-size: 14px; vertical-align: top; }
          .info-label { color: #a1a1aa; width: 35%; font-weight: 500; }
          .info-val { color: #f4f4f5; font-weight: 600; }
          .product-card { background: #27272a; border-radius: 8px; padding: 14px; margin-top: 8px; border: 1px solid #3f3f46; }
          .total-box { background: rgba(197, 155, 39, 0.1); border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(197, 155, 39, 0.3); margin-top: 12px; }
          .total-title { color: #e4e4e7; font-weight: 600; font-size: 15px; }
          .total-amount { color: #f4e078; font-size: 20px; font-weight: 800; }
          .wa-btn { display: block; width: calc(100% - 48px); margin: 20px 24px 24px 24px; background: #25D366; color: #ffffff !important; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
          .footer { text-align: center; font-size: 12px; color: #71717a; padding: 16px; background: #121214; border-top: 1px solid #27272a; }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="email-header">
            <h1>SG FASHION — NEW ORDER ALERT</h1>
            <p>Quality • Style • Trust</p>
            <div class="order-badge">Order ID: #${order.orderId}</div>
          </div>

          <!-- Product Details Section -->
          <div class="section">
            <div class="section-title">🛍️ Ordered Garment Details</div>
            <div class="product-card">
              <table class="info-table">
                <tr><td class="info-label">Product Name:</td><td class="info-val" style="color: #f4e078;">${item.productName}</td></tr>
                <tr><td class="info-label">Color / Pattern:</td><td class="info-val">${item.selectedColor}</td></tr>
                <tr><td class="info-label">Size Selected:</td><td class="info-val">${item.selectedSize}</td></tr>
                <tr><td class="info-label">Quantity:</td><td class="info-val">${item.quantity}</td></tr>
                <tr><td class="info-label">Unit Price:</td><td class="info-val">₹${(item.unitPrice || 0).toLocaleString('en-IN')}</td></tr>
              </table>
            </div>

            <div class="total-box">
              <span class="total-title">Total Payable Amount:</span>
              <span class="total-amount">${formattedPrice}</span>
            </div>
          </div>

          <!-- Customer Details Section -->
          <div class="section">
            <div class="section-title">👤 Customer & Shipping Info</div>
            <table class="info-table">
              <tr><td class="info-label">Customer Name:</td><td class="info-val">${customer.fullName}</td></tr>
              <tr><td class="info-label">Phone / Mobile:</td><td class="info-val"><a href="tel:${customer.phone}" style="color: #60a5fa; text-decoration: none;">+91 ${customer.phone}</a></td></tr>
              <tr><td class="info-label">Email Address:</td><td class="info-val">${customer.email || 'N/A'}</td></tr>
              <tr><td class="info-label">Delivery Address:</td><td class="info-val">${customer.address}, ${customer.city || ''} — ${customer.pincode}</td></tr>
              <tr><td class="info-label">Payment Mode:</td><td class="info-val">${order.paymentMethod || 'Cash on Delivery / WhatsApp Payment'}</td></tr>
              ${order.notes ? `<tr><td class="info-label">Customer Note:</td><td class="info-val" style="font-style: italic; color: #fbbf24;">"${order.notes}"</td></tr>` : ''}
            </table>
          </div>

          <!-- Direct WhatsApp Action Button -->
          <a href="https://wa.me/${customer.phone}?text=Hello%20${encodeURIComponent(customer.fullName)},%20thank%20you%20for%20ordering%20${encodeURIComponent(item.productName)}%20(Order%20%23${order.orderId})%20from%20SG%20Fashion." class="wa-btn" target="_blank">
            💬 Contact Customer on WhatsApp (+91 ${customer.phone})
          </a>

          <div class="footer">
            This is an automated order alert sent via Zoho Mail from SG Garments Store.<br>
            Timestamp: ${new Date(order.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SG Fashion Orders" <${fromUser}>`,
      to: recipientEmail,
      subject: `🛍️ New Order #${order.orderId} - ${item.productName} (₹${(item.totalPrice || 0).toLocaleString('en-IN')})`,
      html: htmlContent
    };

    // If customer provided an email address, copy/BCC customer receipt if enabled
    if (customer.email && customer.email.includes('@') && customer.email !== 'N/A') {
      mailOptions.cc = customer.email;
    }

    const hostsToTry = [
      process.env.ZOHO_SMTP_HOST,
      'smtp.zoho.com',
      'smtp.zoho.in',
      'smtppro.zoho.in',
      'smtppro.zoho.com'
    ].filter((h, idx, arr) => h && arr.indexOf(h) === idx);

    let lastErr = null;
    for (const host of hostsToTry) {
      try {
        const transporter = createTransporter(host);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Mailer] Order email notification sent successfully to ${recipientEmail} via ${host}. Message ID: ${info.messageId}`);
        return true;
      } catch (err) {
        lastErr = err;
        console.warn(`⚠️ [Mailer] Attempt via ${host} failed: ${err.message}. Trying next host...`);
      }
    }

    console.error('❌ [Mailer] All Zoho Mail SMTP hosts failed to send order email:', lastErr ? lastErr.message : 'Unknown error');
    return false;

  } catch (err) {
    console.error('❌ [Mailer] Failed to send order email via Zoho Mail:', err.message);
    return false;
  }
}

module.exports = {
  sendOrderNotificationEmail
};
