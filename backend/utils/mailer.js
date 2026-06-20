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

const cleanIp = (value = '') => {
  const ip = String(value)
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '');

  if (!ip || ip === '::1') return '127.0.0.1';
  return ip;
};

const getRequestIp = (req = {}) => {
  const headers = req.headers || {};
  const forwarded = headers.forwarded?.match(/for="?([^;,"]+)/i)?.[1];

  return cleanIp(
    headers['cf-connecting-ip'] ||
    headers['true-client-ip'] ||
    headers['x-real-ip'] ||
    headers['x-client-ip'] ||
    headers['x-forwarded-for'] ||
    forwarded ||
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ''
  ) || 'Unknown';
};

const isPrivateIp = (ip = '') => {
  return (
    ip === 'Unknown' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
};

const formatClientHintsBrand = (value = '') => {
  const brands = String(value)
    .split(',')
    .map((part) => part.match(/"([^"]+)";v="([^"]+)"/))
    .filter(Boolean)
    .map((match) => `${match[1]} ${match[2]}`)
    .filter((brand) => !/not.a.brand|not a brand/i.test(brand));

  return brands[0] || '';
};

const getClientDetails = (req = {}) => {
  const headers = req.headers || {};
  const agent = useragent.parse(headers['user-agent'] || '');
  const clientHintBrowser = formatClientHintsBrand(headers['sec-ch-ua']);
  const clientHintPlatform = String(headers['sec-ch-ua-platform'] || '').replace(/"/g, '');
  const isMobile = String(headers['sec-ch-ua-mobile'] || '').includes('?1');

  const parsedBrowser = agent.family && agent.family !== 'Other' ? agent.toAgent() : '';
  const parsedOs = agent.os?.family && agent.os.family !== 'Other' ? agent.os.toString() : '';

  return {
    browser: clientHintBrowser || parsedBrowser || headers['user-agent'] || 'Unknown browser',
    device: [
      clientHintPlatform || parsedOs || 'Unknown device',
      isMobile ? 'Mobile' : headers['sec-ch-ua-mobile'] ? 'Desktop' : ''
    ].filter(Boolean).join(' - '),
    userAgent: headers['user-agent'] || 'Not provided'
  };
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
const sendWelcomeEmail = async (to, fullName, accountNumber, details = {}) => {
  const bankName = await getBankName();
  const currentAccountNumber = details.currentAccountNumber || details.current_account_number || "";
  const savingsAccountNumber = details.savingsAccountNumber || details.savings_account_number || "";
  const status = details.status || "Active";
  const loginUrl = details.loginUrl || process.env.FRONTEND_URL || "";

  const mailOptions = {
    from: `"${bankName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${bankName} - Account Approved`,
    html: `
      <div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;color:#0f172a;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:#003366;color:white;padding:24px;">
          <h2 style="margin:0 0 8px;">${bankName}</h2>
          <p style="margin:0;">Your account has been approved</p>
        </div>
        <div style="padding:30px;background:#ffffff;">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Your online banking account has been approved and activated. Keep the account details below for your records.</p>
          <div style="margin:24px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
            <p style="margin:0 0 12px;color:#64748b;font-size:13px;text-transform:uppercase;font-weight:bold;">Primary account number</p>
            <p style="margin:0;font-size:26px;font-weight:bold;color:#003366;letter-spacing:1px;">${accountNumber}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:18px 0;">
            <tr>
              <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Current Account</strong></td>
              <td style="padding:12px;border:1px solid #e2e8f0;">${currentAccountNumber || "Generated"}</td>
            </tr>
            <tr>
              <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Savings Account</strong></td>
              <td style="padding:12px;border:1px solid #e2e8f0;">${savingsAccountNumber || "Generated"}</td>
            </tr>
            <tr>
              <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Account Status</strong></td>
              <td style="padding:12px;border:1px solid #e2e8f0;">${status}</td>
            </tr>
          </table>
          <p>You can now sign in to access your dashboard, transfer funds, request cards, and manage your account securely.</p>
          ${loginUrl ? `<p><a href="${loginUrl}" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">Login to your account</a></p>` : ""}
          <div style="margin-top:24px;padding:14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;color:#9a3412;">
            <strong>Security reminder:</strong> ${bankName} will never ask for your password, OTP, PIN, or full card details by email.
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
    subject: `${bankName} - Account Application Update`,
    html: `
      <div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;color:#0f172a;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:#7f1d1d;color:white;padding:24px;">
          <h2 style="margin:0 0 8px;">${bankName}</h2>
          <p style="margin:0;">Account application update</p>
        </div>
        <div style="padding:30px;background:#ffffff;">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your online banking application could not be approved at this time.</p>
          <div style="margin:22px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:16px;">
            <p style="margin:0 0 8px;color:#991b1b;font-weight:bold;">Reason</p>
            <p style="margin:0;color:#7f1d1d;">${reason}</p>
          </div>
          <p>Please review the information you submitted and contact support if you need help correcting your application.</p>
          <p style="color:#64748b;font-size:13px;">If you believe this was a mistake, reply to this email or contact support with your registered email address.</p>
        </div>
      </div>
    `
  });
};

/* -------------------- LOGIN ALERT EMAIL -------------------- */
const sendLoginAlertEmail = async (to, fullName, req = {}) => {
  const bankName = await getBankName();
  const ip = getRequestIp(req);
  const { browser, device, userAgent } = getClientDetails(req);

  let locationInfo = 'Unknown Location';
  if (isPrivateIp(ip)) {
    locationInfo = 'Unavailable for private/local IP';
  } else {
    try {
      const locRes = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}`, {
        timeout: 2500
      });
      if (locRes.data?.status === 'success') {
        const { city, regionName, country, isp } = locRes.data;
        locationInfo = [city, regionName, country].filter(Boolean).join(', ');
        if (isp) locationInfo += ` (${isp})`;
      }
    } catch {
      locationInfo = 'Location lookup unavailable';
    }
  }

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
            <li><strong>Device:</strong> ${device}</li>
            <li><strong>Browser:</strong> ${browser}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p style="color:#64748b;font-size:12px;margin-top:20px;">User agent: ${userAgent}</p>
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
