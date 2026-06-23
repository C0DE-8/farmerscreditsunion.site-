const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/authMiddleware');
const { isConfigured, sendGmailEmail } = require('../utils/gmailMailer');

const router = express.Router();

function normalizeEmailList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateSendPayload(req, res, next) {
  const to = normalizeEmailList(req.body?.to);
  const subject = String(req.body?.subject || '').trim();
  const text = String(req.body?.text || '').trim();
  const html = String(req.body?.html || '').trim();

  if (!to.length) {
    return res.status(400).json({ error: 'At least one recipient email is required.' });
  }

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  if (!text && !html) {
    return res.status(400).json({ error: 'Email text or HTML message is required.' });
  }

  req.emailPayload = {
    to,
    subject,
    text,
    html,
    replyTo: req.body?.replyTo ? String(req.body.replyTo).trim() : '',
  };

  next();
}

router.use(authenticateToken, checkAdmin);

router.get('/status', (req, res) => {
  res.json({
    configured: isConfigured(),
    from: process.env.GMAIL_USER || null,
  });
});

router.post('/send', validateSendPayload, async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({ error: 'Gmail mailer is not configured.' });
    }

    const info = await sendGmailEmail(req.emailPayload);
    res.json({
      message: 'Email sent successfully.',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send email.',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

router.post('/test', async (req, res) => {
  const to = normalizeEmailList(req.body?.to || process.env.GMAIL_USER);

  if (!to.length) {
    return res.status(400).json({ error: 'Recipient email is required for test email.' });
  }

  try {
    if (!isConfigured()) {
      return res.status(503).json({ error: 'Gmail mailer is not configured.' });
    }

    const info = await sendGmailEmail({
      to,
      subject: 'Test email from West Bridge Vault Reserve',
      text: 'This is a sample plain text email sent through the new Gmail mailer.',
      html: `
        <p>Hello,</p>
        <p>This is a sample HTML email sent through the new Gmail mailer.</p>
        <p>The admin message area supports both plain text and HTML content.</p>
      `,
    });

    res.json({
      message: 'Test email sent successfully.',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send test email.',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

module.exports = router;
