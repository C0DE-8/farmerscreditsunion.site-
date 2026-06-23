const nodemailer = require('nodemailer');

const DEFAULT_BANK_NAME = 'West Bridge Vault Reserve';
const SUPPORT_EMAIL = 'support@westbridgevaultreserve.online';

function isConfigured() {
  const user = String(process.env.GMAIL_USER || '').trim();
  const password = String(process.env.GMAIL_APP_PASSWORD || '').trim();

  return Boolean(
    user &&
    password &&
    user !== 'yourgmail@gmail.com' &&
    password !== 'your_16_character_app_password'
  );
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtml(text = '') {
  return escapeHtml(text)
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<br />'))
    .join('');
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function createTransporter() {
  if (!isConfigured()) {
    throw new Error('Gmail mailer is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function buildEmailTemplate({ subject, bodyHtml }) {
  const safeSubject = escapeHtml(subject || 'Message from West Bridge Vault Reserve');
  const year = new Date().getFullYear();

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeSubject}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e8edf4;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(16,24,40,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#1A2C79,#007cc5);padding:28px;color:#ffffff;">
                    <h1 style="margin:0;font-size:24px;line-height:1.2;">${DEFAULT_BANK_NAME}</h1>
                    <p style="margin:8px 0 0;font-size:13px;opacity:0.86;">Secure banking communication</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h2 style="margin:0 0 18px;font-size:20px;line-height:1.3;color:#101828;">${safeSubject}</h2>
                    <div style="font-size:15px;line-height:1.75;color:#344054;">
                      ${bodyHtml}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px;background:#eef5ff;border-top:1px solid #dbeafe;color:#475467;font-size:12px;line-height:1.6;">
                    <strong style="display:block;color:#1A2C79;margin-bottom:6px;">${DEFAULT_BANK_NAME}</strong>
                    This email was sent by an authorized administrator. You can reply directly to this email for help or follow-up, no need to start a new message.
                    You can also contact
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:#1A2C79;text-decoration:none;">${SUPPORT_EMAIL}</a>.
                    <br />
                    &copy; ${year} ${DEFAULT_BANK_NAME}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function sendGmailEmail({ to, subject, text, html, replyTo }) {
  const messageHtml = html ? String(html) : textToHtml(text || '');
  const wrappedHtml = buildEmailTemplate({ subject, bodyHtml: messageHtml });
  const plainText = text || stripHtml(html || '') || stripHtml(messageHtml);
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${DEFAULT_BANK_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: `${subject}\n\n${plainText}\n\n${DEFAULT_BANK_NAME}\nYou can reply directly to this email for help or follow-up.\nSupport: ${SUPPORT_EMAIL}`,
    html: wrappedHtml,
  };

  if (replyTo) mailOptions.replyTo = replyTo;

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[gmail-mailer] Email sent', {
      to,
      subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    console.error('[gmail-mailer] Failed to send email', {
      to,
      subject,
      error: error.message,
      code: error.code,
      command: error.command,
    });
    throw error;
  }
}

module.exports = {
  isConfigured,
  sendGmailEmail,
};
