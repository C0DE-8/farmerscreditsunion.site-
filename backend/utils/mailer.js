// utils/mailer.js
const db = require('../db');
const nodemailer = require('nodemailer');
const axios = require('axios');
const useragent = require('useragent');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "server165.web-hosting.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === "true" ? true : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fetch bank name from DB
const getBankName = () => {
  return new Promise((resolve) => {
    db.query(
      'SELECT value FROM settings WHERE key_name = "bank_name" LIMIT 1',
      (err, result) => {
        if (err || result.length === 0) return resolve('iT Auth Bank');
        resolve(result[0].value);
      }
    );
  });
};

/* -------------------- SEND OTP EMAIL -------------------- */
const sendOTPEmail = async (to, fullName, otp) => {
  const bankName = await getBankName();

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${bankName} - Email Verification Code`,
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif;">
        <div style="background-color: #003366; color: white; padding: 20px;">
          <h2>${bankName}</h2>
          <p>Secure Banking Verification</p>
        </div>
        <div style="padding: 30px;">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your one-time password (OTP) is:</p>
          <div style="text-align:center;margin:30px 0;">
            <span style="font-size:32px;font-weight:bold;color:#003366;letter-spacing:5px;">${otp}</span>
          </div>
          <p>This code expires in <strong>${process.env.OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/* -------------------- SEND WELCOME EMAIL -------------------- */
const sendWelcomeEmail = async (to, fullName, accountNumber) => {
  const bankName = await getBankName();

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Welcome to ${bankName} 🎉`,
    html: `
      <div style="max-width: 600px;margin:auto;">
        <div style="background:#003366;color:white;padding:20px;">
          <h2>${bankName}</h2>
          <p>Welcome to your secure banking experience</p>
        </div>
        <div style="padding:30px;">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Your account has been created successfully.</p>
          <div style="text-align:center;margin:25px 0;">
            <span style="font-size:26px;font-weight:bold;color:#003366;">${accountNumber}</span>
          </div>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendOnboardingSubmittedEmail = async (to, fullName) => {
  const bankName = await getBankName();

  return transporter.sendMail({
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${bankName} - Onboarding Submitted`,
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;">
        <div style="background:#003366;color:white;padding:20px;">
          <h2>${bankName}</h2>
          <p>Account onboarding received</p>
        </div>
        <div style="padding:30px;">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your online banking registration has been submitted for admin review.</p>
          <p>After approval, your account number will be generated and sent to this email address.</p>
        </div>
      </div>
    `
  });
};

const sendOnboardingRejectedEmail = async (to, fullName, reason) => {
  const bankName = await getBankName();

  return transporter.sendMail({
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${bankName} - Onboarding Update`,
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;">
        <div style="background:#003366;color:white;padding:20px;">
          <h2>${bankName}</h2>
          <p>Account onboarding update</p>
        </div>
        <div style="padding:30px;">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your online banking onboarding could not be approved at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please contact support if you need help correcting your submission.</p>
        </div>
      </div>
    `
  });
};

/* -------------------- LOGIN ALERT EMAIL -------------------- */
const sendLoginAlertEmail = async (to, fullName, req = {}) => {
  const bankName = await getBankName();

  const headers = req.headers || {};
  const connection = req.connection || {};

  const ip =
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    connection.remoteAddress ||
    'Unknown';

  const agent = useragent.parse(headers['user-agent'] || '');
  const os = agent.os.toString();
  const browser = agent.toAgent();

  let locationInfo = 'Unknown Location';
  try {
    const locRes = await axios.get(`http://ip-api.com/json/${ip}`);
    if (locRes.data?.status === 'success') {
      const { city, regionName, country, isp } = locRes.data;
      locationInfo = `${city}, ${regionName}, ${country} (${isp})`;
    }
  } catch {}

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Login Alert - ${bankName}`,
    html: `
      <div style="max-width:600px;margin:auto;">
        <div style="background:#003366;color:white;padding:20px;">
          <h2>${bankName}</h2>
          <p>Security Login Alert</p>
        </div>
        <div style="padding:30px;">
          <p>Hello <strong>${fullName}</strong>, a login attempt was detected.</p>
          <ul>
            <li><strong>IP:</strong> ${ip}</li>
            <li><strong>Location:</strong> ${locationInfo}</li>
            <li><strong>Device:</strong> ${os}</li>
            <li><strong>Browser:</strong> ${browser}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/* -------------------- LOGIN OTP EMAIL -------------------- */
const sendLoginOTPEmail = async (to, fullName, otp) => {
  const bankName = await getBankName();

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Login OTP - ${bankName}`,
    html: `
      <div style="max-width:600px;margin:auto;">
        <div style="background:#003366;color:white;padding:20px;">
          <h2>${bankName}</h2>
          <p>Secure Login OTP</p>
        </div>
        <div style="padding:30px;">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your login OTP is:</p>
          <div style="font-size:32px;font-weight:bold;text-align:center;margin:20px 0;color:#003366;">
            ${otp}
          </div>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/* -------------------- PASSWORD RESET OTP EMAIL -------------------- */
const sendPasswordResetOtpEmail = async (to, fullName, otp) => {
  const bankName = await getBankName();

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${bankName} Password Reset OTP`,
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
        
        <!-- HEADER -->
        <div style="background:#003366;color:white;padding:20px;text-align:center;">
          <h2 style="margin:0;">${bankName}</h2>
        </div>

        <!-- BODY -->
        <div style="padding:30px;background:#ffffff;">
          <p style="font-size:16px;color:#333;">
            Hi <strong>${fullName}</strong>,
          </p>

          <p style="font-size:15px;color:#555;line-height:1.6;">
            We received a request to reset your password.
            Use the One-Time Password (OTP) below to proceed:
          </p>

          <!-- OTP BOX -->
          <div style="text-align:center;margin:30px 0;">
            <div style="
              display:inline-block;
              background:#f4f7fb;
              border:2px dashed #003366;
              padding:15px 30px;
              border-radius:10px;
              font-size:32px;
              font-weight:bold;
              letter-spacing:8px;
              color:#003366;
            ">
              ${otp}
            </div>
          </div>

          <p style="font-size:14px;color:#666;">
            This OTP will expire in <strong>15 minutes</strong>.
          </p>

          <p style="font-size:14px;color:#999;">
            If you did not request this, please ignore this email.
          </p>
        </div>

        <!-- FOOTER -->
        <div style="background:#f1f1f1;padding:15px;text-align:center;font-size:12px;color:#777;">
          © ${new Date().getFullYear()} ${bankName}. All rights reserved.
        </div>

      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/* -------------------- ATM CARD REQUEST EMAILS -------------------- */
const sendAtmCardRequestEmail = async (to, fullName, accountType, currency, fee) => {
  const bankName = await getBankName();

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `ATM Card Request Submitted - ${bankName}`,
    html: `
      <div style="max-width:600px;margin:auto;padding:20px;">
        <h2>${bankName}</h2>
        <p>Your request has been received.</p>
        <p>Card Type: <strong>${accountType}</strong></p>
        <p>Fee: <strong>${currency}${fee}</strong></p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/* -------------------- ATM CARD APPROVED EMAIL -------------------- */
const sendAtmCardApprovedEmail = async (details) => {
  const bankName = await getBankName();

  const {
    to,
    bankCustomerName,
    accountType,
    cardNumberMasked,
    cardNumberGrouped,
    expiryDate,
    cvvMasked
  } = details;

  const html = `
    <div style="max-width:600px;margin:auto;font-family:Arial;color:#0b1831;">
      <h2>${bankName}</h2>
      <p>Your ATM card for your ${accountType} account has been approved.</p>

      <p><strong>Card Number:</strong> ${cardNumberGrouped}</p>
      <p><strong>Expires:</strong> ${expiryDate}</p>
      <p><strong>CVV:</strong> ${cvvMasked}</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your ${bankName} ATM Card Has Been Approved`,
    html
  });
};

/* -------------------- TRANSFER OTP EMAIL -------------------- */
const sendTransferOTPEmail = async (to, fullName, otp, meta = {}) => {
  const bankName = await getBankName();

  const { amountText = "", beneficiaryText = "" } = meta;

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Transfer OTP - ${bankName}`,
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;">
        <div style="background:#003366;color:white;padding:20px;">
          <h2 style="margin:0;">${bankName}</h2>
          <p style="margin:6px 0 0;">Transfer Verification OTP</p>
        </div>
        <div style="padding:30px;">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Please confirm your transfer request${amountText ? ` for <strong>${amountText}</strong>` : ""}${beneficiaryText ? ` to <strong>${beneficiaryText}</strong>` : ""}.</p>
          <p>Your OTP code is:</p>
          <div style="font-size:34px;font-weight:bold;text-align:center;margin:20px 0;color:#003366;letter-spacing:6px;">
            ${otp}
          </div>
          <p style="color:#555;">This OTP expires in <strong>5 minutes</strong>. If you didn’t request this transfer, ignore this email.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};


module.exports = {
  sendOTPEmail,
  sendTransferOTPEmail,
  sendWelcomeEmail,
  sendOnboardingSubmittedEmail,
  sendOnboardingRejectedEmail,
  sendLoginAlertEmail,
  sendLoginOTPEmail,
  sendPasswordResetOtpEmail,
  sendAtmCardRequestEmail,
  sendAtmCardApprovedEmail
};
