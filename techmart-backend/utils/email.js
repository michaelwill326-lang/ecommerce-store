const { BrevoClient } = require("@getbrevo/brevo");

// 🔍 Runtime Environment Diagnostics Check
if (!process.env.BREVO_API_KEY) {
  console.error("❌ DEPLOYMENT CRITICAL: process.env.BREVO_API_KEY is undefined or empty inside Render environment settings!");
} else {
  console.log(`📡 BREVO ENV CHECK: Key is present (Length: ${process.env.BREVO_API_KEY.length} chars)`);
}

// 1. Initialize the modern BrevoClient directly with your key
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : "",
});

// 2. Define your default verified sender identity
const FROM = { email: "michaelwill326@gmail.com", name: "TechMart" };

/* =========================================================================
   💳 ORDER CONFIRMATION EMAIL
========================================================================= */
const sendOrderConfirmation = async (order) => {
  console.log("📧 EMAIL CALLED FROM:", new Error().stack);
  console.log("📧 SENDING EMAIL TRIGGERED AT:", new Date().toISOString());
  try {
    const itemRows = order.items.map(item => `
      <tr>
        <td style="color: #aaa; font-size: 14px; padding: 8px 0;">${item.name} (x${item.quantity || 1})</td>
        <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right;">₦${(item.price * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">TechMart</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Order Receipt</p>
          </div>

          <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; margin: 0;">📦</p>
            <h2 style="color: #fff; font-size: 24px; font-weight: 800; margin: 16px 0 8px;">Order Confirmed!</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Thank you for your purchase. We are preparing your order.</p>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 16px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemRows}
              <tr><td colspan="2" style="border-top: 1px solid #222; padding: 8px 0;"></td></tr>
              <tr>
                <td style="color: #fff; font-size: 16px; font-weight: 700; padding: 8px 0;">Total Amount</td>
                <td style="color: #f97316; font-size: 18px; font-weight: 800; text-align: right;">₦${order.amount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; border-top: 1px solid #222; padding-top: 24px;">
            <p style="color: #f97316; font-weight: 800; font-size: 18px; margin: 0 0 4px;">TechMart</p>
            <p style="color: #555; font-size: 12px; margin: 0;">Built with ❤️ in Nigeria 🇳🇬</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await brevo.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email: order.email }],
      subject: `🛒 TechMart Order Confirmation [${order.reference}]`,
      htmlContent: html,
    });
    console.log(`📧 Order confirmation email sent to ${order.email}`);
  } catch (err) {
    console.error("❌ BREVO ERROR inside sendOrderConfirmation:", err.message);
  }
};

/* =========================================================================
   👤 WELCOME EMAIL
========================================================================= */
const sendWelcomeEmail = async (user) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">TechMart</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Welcome Aboard</p>
          </div>

          <div style="background: linear-gradient(135deg, #f97316, #dc2626); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; margin: 0;">🎉</p>
            <h2 style="color: #fff; font-size: 24px; font-weight: 800; margin: 16px 0 8px;">Welcome to TechMart, ${user.name}!</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Your account has been created successfully.</p>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #aaa; font-size: 15px; margin: 0 0 16px;">Start exploring the best tech deals in Nigeria.</p>
            <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316, #dc2626); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
              🛍️ Shop Now
            </a>
          </div>

          <div style="text-align: center; border-top: 1px solid #222; padding-top: 24px;">
            <p style="color: #f97316; font-weight: 800; font-size: 18px; margin: 0 0 4px;">TechMart</p>
            <p style="color: #555; font-size: 12px; margin: 0;">Built with ❤️ in Nigeria 🇳🇬</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await brevo.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email: user.email }],
      subject: `🎉 Welcome to TechMart, ${user.name}!`,
      htmlContent: html,
    });
    console.log(`📧 Welcome email sent to ${user.email}`);
  } catch (err) {
    console.error("❌ BREVO ERROR inside sendWelcomeEmail:", err.message);
  }
};

/* =========================================================================
   🚚 SHIPPING UPDATE EMAIL
========================================================================= */
const sendShippingUpdate = async (order) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">TechMart</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Shipping Update</p>
          </div>

          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; margin: 0;">🚚</p>
            <h2 style="color: #fff; font-size: 24px; font-weight: 800; margin: 16px 0 8px;">Your Order is on its Way!</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Your TechMart order has been shipped.</p>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #888; font-size: 14px; padding: 8px 0;">Order Reference</td>
                <td style="color: #fff; font-size: 14px; font-weight: 700; text-align: right;">${order.reference}</td>
              </tr>
              <tr><td colspan="2" style="border-top: 1px solid #222;"></td></tr>
              <tr>
                <td style="color: #888; font-size: 14px; padding: 8px 0;">Status</td>
                <td style="color: #3b82f6; font-size: 14px; font-weight: 700; text-align: right;">🚚 Shipped</td>
              </tr>
              ${order.trackingNumber ? `
              <tr><td colspan="2" style="border-top: 1px solid #222;"></td></tr>
              <tr>
                <td style="color: #888; font-size: 14px; padding: 8px 0;">Tracking Number</td>
                <td style="color: #fff; font-size: 14px; font-weight: 700; text-align: right;">${order.trackingNumber}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.FRONTEND_URL}/tracking" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316, #dc2626); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
              📦 Track Your Order
            </a>
          </div>

          <div style="text-align: center; border-top: 1px solid #222; padding-top: 24px;">
            <p style="color: #f97316; font-weight: 800; font-size: 18px; margin: 0 0 4px;">TechMart</p>
            <p style="color: #555; font-size: 12px; margin: 0;">Built with ❤️ in Nigeria 🇳🇬</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await brevo.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email: order.email }],
      subject: `🚚 Your Order ${order.reference} has been Shipped!`,
      htmlContent: html,
    });
    console.log(`📧 Shipping update sent to ${order.email}`);
  } catch (err) {
    console.error("❌ BREVO ERROR inside sendShippingUpdate:", err.message);
  }
};

/* =========================================================================
   🔐 PASSWORD RESET EMAIL
========================================================================= */
const sendPasswordResetEmail = async (email, token) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">TechMart</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Password Reset</p>
          </div>

          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; margin: 0;">🔐</p>
            <h2 style="color: #fff; font-size: 24px; font-weight: 800; margin: 16px 0 8px;">Password Reset Request</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Use the code below to reset your TechMart password.</p>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="color: #888; font-size: 14px; margin: 0 0 16px;">Your reset code is:</p>
            <p style="color: #f97316; font-size: 48px; font-weight: 900; letter-spacing: 12px; margin: 0;">${token}</p>
            <p style="color: #555; font-size: 12px; margin: 16px 0 0;">This code expires in 1 hour.</p>
          </div>

          <div style="background: #111; border: 1px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #888; font-size: 13px; margin: 0;">⚠️ If you did not request a password reset, please ignore this email. Your account remains secure.</p>
          </div>

          <div style="text-align: center; border-top: 1px solid #222; padding-top: 24px;">
            <p style="color: #f97316; font-weight: 800; font-size: 18px; margin: 0 0 4px;">TechMart</p>
            <p style="color: #555; font-size: 12px; margin: 0;">Built with ❤️ in Nigeria 🇳🇬</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await brevo.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email }],
      subject: `🔐 Your TechMart Password Reset Code`,
      htmlContent: html,
    });
    console.log(`📧 Password reset email sent to ${email}`);
  } catch (err) {
    console.error("❌ BREVO ERROR inside sendPasswordResetEmail:", err.message);
  }
};


/* =========================================================================
   ADMIN ORDER NOTIFICATION EMAIL
========================================================================= */
const sendAdminOrderNotification = async (order) => {
  try {
    const itemRows = order.items.map(item => `
      <tr>
        <td style="color: #aaa; font-size: 14px; padding: 8px 0;">${item.name} (x${item.quantity || 1})</td>
        <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right;">₦${(item.price * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">TechMart</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">New Order Alert</p>
          </div>
          <div style="background: linear-gradient(135deg, #f97316, #dc2626); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; margin: 0;">🛒</p>
            <h2 style="color: #fff; font-size: 24px; font-weight: 800; margin: 16px 0 8px;">New Order Received!</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Reference: ${order.reference}</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 16px;">Customer Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #888; font-size: 14px; padding: 6px 0;">Email</td>
                <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right;">${order.email}</td>
              </tr>
              <tr>
                <td style="color: #888; font-size: 14px; padding: 6px 0;">Phone</td>
                <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right;">${order.phone || "N/A"}</td>
              </tr>
              <tr>
                <td style="color: #888; font-size: 14px; padding: 6px 0;">Delivery Address</td>
                <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right;">${order.deliveryAddress || "N/A"}</td>
              </tr>
            </table>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 16px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemRows}
              <tr><td colspan="2" style="border-top: 1px solid #222; padding: 8px 0;"></td></tr>
              <tr>
                <td style="color: #fff; font-size: 16px; font-weight: 700; padding: 8px 0;">Total Amount</td>
                <td style="color: #f97316; font-size: 18px; font-weight: 800; text-align: right;">₦${order.amount.toLocaleString()}</td>
              </tr>
              ${order.couponCode ? `<tr><td style="color: #888; font-size: 13px;">Coupon Used</td><td style="color: #10b981; font-size: 13px; text-align: right;">${order.couponCode}</td></tr>` : ""}
            </table>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.FRONTEND_URL}/admin" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316, #dc2626); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
              View in Admin Dashboard
            </a>
          </div>
          <div style="text-align: center; border-top: 1px solid #222; padding-top: 24px;">
            <p style="color: #f97316; font-weight: 800; font-size: 18px; margin: 0 0 4px;">TechMart</p>
            <p style="color: #555; font-size: 12px; margin: 0;">Built with love in Nigeria</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await brevo.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email: "michaelwill326@gmail.com" }],
      subject: `New Order: ${order.reference} - ₦${order.amount.toLocaleString()}`,
      htmlContent: html,
    });
    console.log("Admin order notification sent");
  } catch (err) {
    console.error("Admin notification error:", err.message);
  }
};


/* =========================================================================
   LOW STOCK ALERT EMAIL
========================================================================= */
const sendLowStockAlert = async (product) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">TechMart</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Stock Alert</p>
          </div>
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; margin: 0;">⚠️</p>
            <h2 style="color: #fff; font-size: 24px; font-weight: 800; margin: 16px 0 8px;">Low Stock Warning!</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">A product is running low on stock.</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #888; font-size: 14px; padding: 8px 0;">Product</td>
                <td style="color: #fff; font-size: 14px; font-weight: 700; text-align: right;">${product.name}</td>
              </tr>
              <tr><td colspan="2" style="border-top: 1px solid #222;"></td></tr>
              <tr>
                <td style="color: #888; font-size: 14px; padding: 8px 0;">Remaining Stock</td>
                <td style="color: #dc2626; font-size: 20px; font-weight: 900; text-align: right;">${product.stock} units</td>
              </tr>
              <tr><td colspan="2" style="border-top: 1px solid #222;"></td></tr>
              <tr>
                <td style="color: #888; font-size: 14px; padding: 8px 0;">Price</td>
                <td style="color: #fff; font-size: 14px; font-weight: 700; text-align: right;">₦${product.price.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.FRONTEND_URL}/admin" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316, #dc2626); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
              Update Stock in Admin
            </a>
          </div>
          <div style="text-align: center; border-top: 1px solid #222; padding-top: 24px;">
            <p style="color: #f97316; font-weight: 800; font-size: 18px; margin: 0 0 4px;">TechMart</p>
            <p style="color: #555; font-size: 12px; margin: 0;">Built with love in Nigeria</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await brevo.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email: "michaelwill326@gmail.com" }],
      subject: `Low Stock Alert: ${product.name} (${product.stock} left)`,
      htmlContent: html,
    });
    console.log(`Low stock alert sent for ${product.name}`);
  } catch (err) {
    console.error("Low stock alert error:", err.message);
  }
};


const sendOTPEmail = async (email, name, otp) => {
  const client = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = "Your TechMart Login OTP";
  sendSmtpEmail.to = [{ email, name }];
  sendSmtpEmail.sender = { name: "TechMart", email: "noreply@techmart.com" };
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f97316;">TechMart Security Code</h2>
      <p>Hi ${name},</p>
      <p>Your one-time login code is:</p>
      <div style="background: #f97316; color: #fff; font-size: 36px; font-weight: 900; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #888;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #888;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  try {
    await client.sendTransacEmail(sendSmtpEmail);
    console.log("OTP email sent to:", email);
  } catch (err) {
    console.error("OTP email error:", err.message);
    throw err;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendWelcomeEmail,
  sendShippingUpdate,
  sendPasswordResetEmail,
  sendAdminOrderNotification,
  sendLowStockAlert,
  sendOTPEmail,
};
