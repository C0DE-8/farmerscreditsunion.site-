const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { sendOTPEmail, sendWelcomeEmail, sendLoginAlertEmail, sendLoginOTPEmail, sendPasswordResetOtpEmail, sendOnboardingSubmittedEmail } = require('../utils/mailer');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logActivity } = require('../utils/activityLogger');
const multer = require('multer');
const path = require('path');


function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAccountNumber() {
  return '01' + Math.floor(1000000000 + Math.random() * 9000000000);
}
function generateCurrentAccountNumber() {
  return '01' + Math.floor(100000000 + Math.random() * 900000000); // e.g. 01XXXXXXXXX
}
function generateSavingsAccountNumber() {
  return '81' + Math.floor(100000000 + Math.random() * 900000000); // e.g. 81XXXXXXXXX
}

const onboardingStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const field = file.fieldname.replace(/[^a-z0-9_-]/gi, '');
    cb(null, `kyc_${field}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const onboardingUpload = multer({
  storage: onboardingStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

const getUploadedPath = (req, field) => {
  const file = req.files?.[field]?.[0];
  return file ? `/uploads/${file.filename}` : '';
};

// User Registration: submit KYC details for admin approval before account numbers are issued.
router.post(
  '/register',
  onboardingUpload.fields([
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 },
    { name: 'face_photo', maxCount: 1 }
  ]),
  async (req, res) => {
    const {
      username,
      password,
      first_name,
      middle_name = '',
      last_name,
      full_name,
      email,
      age,
      work_id,
      id_type,
      phone = '',
      address = ''
    } = req.body;

    const cleanIdType = String(id_type || '').trim();
    const computedFullName = full_name || [first_name, middle_name, last_name].filter(Boolean).join(' ').trim();
    const ageNumber = Number(age);
    const idFront = getUploadedPath(req, 'id_front');
    const idBack = getUploadedPath(req, 'id_back');
    const facePhoto = getUploadedPath(req, 'face_photo');

    if (!username || !password || !email || !first_name || !last_name || !age || !work_id || !cleanIdType) {
      return res.status(400).json({ error: 'Personal details, work ID, ID type, email, username, and password are required' });
    }

    if (!['passport', 'driver_license'].includes(cleanIdType)) {
      return res.status(400).json({ error: 'ID type must be passport or driver_license' });
    }

    if (!Number.isInteger(ageNumber) || ageNumber < 18 || ageNumber > 120) {
      return res.status(400).json({ error: 'Applicant age must be between 18 and 120' });
    }

    if (!idFront || !idBack || !facePhoto) {
      return res.status(400).json({ error: 'ID front, ID back, and face photo are required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.beginTransaction((txErr) => {
        if (txErr) return res.status(500).json({ error: 'Database error', details: txErr.message });

        db.query(
          `INSERT INTO users
            (username, password, full_name, email, is_admin, account_number, email_verified, acct_status)
           VALUES (?, ?, ?, ?, 0, NULL, 0, 'pending')`,
          [username, hashedPassword, computedFullName, email],
          (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                return db.rollback(() => res.status(400).json({ error: 'Username or email already exists' }));
              }
              return db.rollback(() => res.status(500).json({ error: 'Database error', details: err.message }));
            }

            const userId = result.insertId;

            db.query(
              `INSERT INTO user_onboarding
                (user_id, first_name, middle_name, last_name, age, work_id, id_type, id_front_url, id_back_url, face_photo_url, phone, address, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
              [userId, first_name, middle_name, last_name, ageNumber, work_id, cleanIdType, idFront, idBack, facePhoto, phone, address],
              (kycErr) => {
                if (kycErr) {
                  return db.rollback(() => res.status(500).json({ error: 'Failed to save onboarding details', details: kycErr.message }));
                }

                db.commit(async (commitErr) => {
                  if (commitErr) {
                    return db.rollback(() => res.status(500).json({ error: 'Database error', details: commitErr.message }));
                  }

                  try {
                    await sendOnboardingSubmittedEmail(email, computedFullName);
                  } catch (emailError) {
                    console.warn('⚠️ Onboarding submitted email failed:', emailError?.message || emailError);
                  }

                  return res.status(201).json({
                    message: 'Registration submitted. An admin must approve your onboarding before account numbers are issued.'
                  });
                });
              }
            );
          }
        );
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  }
);

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  // Get user ID by email
  db.query('SELECT id, email_verified, full_name, account_number FROM users WHERE email = ?', [email], (err, users) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Get matching OTP
    db.query(
      'SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND otp_expires_at > NOW()',
      [user.id, otp],
      (err2, otps) => {
        if (err2) return res.status(500).json({ error: 'OTP check error' });
        if (otps.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });

        // ✅ Update email_verified and cleanup
        db.query('UPDATE users SET email_verified = 1 WHERE id = ?', [user.id], (err3) => {
          if (err3) return res.status(500).json({ error: 'Verification failed' });

          db.query('DELETE FROM otps WHERE user_id = ?', [user.id], async (err4) => {
            if (err4) console.warn('OTP cleanup failed (non-blocking)');

            // ✅ Send Welcome Email AFTER OTP is verified
            try {
              await sendWelcomeEmail(email, user.full_name, user.account_number);
              res.json({ message: 'Email verified and welcome email sent' });
            } catch (emailErr) {
              console.error('❌ Failed to send welcome email:', emailErr);
              res.status(200).json({
                message: 'Email verified, but welcome email failed to send',
                email_verified: true
              });
            }
          });
        });
      }
    );
  });
});

// Resend OTP
router.post('/resend-otp', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Step 1: Find user
  db.query('SELECT id, full_name, email_verified FROM users WHERE email = ?', [email], (err, users) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const newOtp = generateOTP();
    const newExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60000);

    // Step 2: Update or insert OTP
    db.query(
      'INSERT INTO otps (user_id, otp_code, otp_expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), otp_expires_at = VALUES(otp_expires_at)',
      [user.id, newOtp, newExpiry],
      async (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to save new OTP' });

        // Step 3: Send OTP email
        try {
          await sendOTPEmail(email, user.full_name, newOtp);
          res.json({ message: 'A new OTP has been sent to your email' });
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError);
          res.status(500).json({ error: 'Failed to send OTP email' });
        }
      }
    );
  });
});

// User Login auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/Account Number and password are required' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ? OR account_number = ?',
    [identifier, identifier],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

      const user = results[0];

      if (user.acct_status === 'pending') {
        logActivity(user.id, 'login_failed', 'Onboarding pending approval');
        return res.status(403).json({ error: 'Your onboarding is still pending admin approval' });
      }

      if (user.acct_status === 'rejected') {
        logActivity(user.id, 'login_failed', 'Onboarding rejected');
        return res.status(403).json({ error: 'Your onboarding was rejected. Please contact support.' });
      }

      if (!user.email_verified) {
        logActivity(user.id, 'login_failed', 'Email not verified');
        return res.status(403).json({ error: 'Email not verified' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        logActivity(user.id, 'login_failed', 'Incorrect password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        await sendLoginAlertEmail(user.email, user.full_name, req);
        logActivity(user.id, 'login_alert_sent', 'Login alert email sent');
      } catch (e) {
        console.warn('⚠️ Failed to send login alert email:', e.message);
      }

      const loginOTPEnabled = user.login_otp_enabled === 1;

      if (loginOTPEnabled) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60000);

        db.query(
          `INSERT INTO login_otps (user_id, otp_code, otp_expires_at)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), otp_expires_at = VALUES(otp_expires_at)`,
          [user.id, otp, otpExpiresAt],
          async (err2) => {
            if (err2) {
              logActivity(user.id, 'otp_error', 'Failed to store login OTP');
              return res.status(500).json({ error: 'Failed to save login OTP' });
            }

            try {
              await sendLoginOTPEmail(user.email, user.full_name, otp);
              logActivity(user.id, 'otp_sent', 'Login OTP sent');
              return res.json({
                message: 'Login OTP sent to your email. Please verify to complete login.',
                otp_required: true
              });
            } catch (emailErr) {
              logActivity(user.id, 'otp_email_failed', 'Failed to send OTP email');
              return res.status(500).json({ error: 'Failed to send OTP email' });
            }
          }
        );
      } else {
        // No OTP required
        const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, process.env.JWT_SECRET, {
          expiresIn: '7h'
        });

        logActivity(user.id, 'login', 'Login successful (OTP not required)');
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            account_number: user.account_number,
            is_admin: user.is_admin
          }
        });
      }
    }
  );
});

// ✅ Verify Login OTP
router.post('/login/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
    if (err || users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];

    db.query(
      'SELECT * FROM login_otps WHERE user_id = ? AND otp_code = ? AND otp_expires_at > NOW()',
      [user.id, otp],
      (err2, otps) => {
        if (err2 || otps.length === 0) {
          logActivity(user.id, 'otp_failed', 'Invalid or expired OTP during login');
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // OTP is valid, delete it and issue token
        db.query('DELETE FROM login_otps WHERE user_id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, process.env.JWT_SECRET, {
          expiresIn: '7h'
        });

        logActivity(user.id, 'login', 'OTP verified. Login successful');
        return res.json({
          message: 'OTP verified. Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            account_number: user.account_number,
            is_admin: user.is_admin
          }
        });
      }
    );
  });
});

// Forgot Password (OTP)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Find user
  db.query('SELECT id, full_name FROM users WHERE email = ?', [email], (err, users) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save OTP
    db.query(
      `INSERT INTO password_resets (user_id, otp, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?`,
      [user.id, otp, expires, otp, expires],
      async (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to save OTP' });

        try {
          await sendPasswordResetOtpEmail(email, user.full_name, otp);
          res.json({ message: 'OTP sent to email' });
        } catch (e) {
          console.error('Email failed:', e.message);
          res.status(500).json({ error: 'Failed to send email' });
        }
      }
    );
  });
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;

  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: 'Email, OTP and new password are required' });
  }

  // Check OTP validity
  db.query(
    `SELECT pr.user_id 
     FROM password_resets pr
     JOIN users u ON pr.user_id = u.id
     WHERE u.email = ? AND pr.otp = ? AND pr.expires_at > NOW()`,
    [email, otp],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'DB Error' });
      if (results.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });

      const userId = results[0].user_id;
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Failed to reset password' });

          // Delete OTP after use
          db.query('DELETE FROM password_resets WHERE user_id = ?', [userId]);

          res.json({ message: 'Password has been reset successfully' });
        }
      );
    }
  );
});


module.exports = router;
