// server.js
require('dotenv').config();
const express = require('express');
const db = require('./db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // or replace '*' with your frontend URL, e.g., 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// In server.js or app.js
app.use('/uploads', express.static('uploads'));


app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.send('Backend Running ✅');
});

app.get('/health', async (req, res) => {
  if (!hasFullApiKey(process.env.API_KEY)) {
    return res.status(400).json({
      ok: false,
      error: 'API_KEY must be the full DBMS key, not the dashboard prefix.'
    });
  }

  try {
    const status = await db.status();
    res.json({ ok: true, gateway: status });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));

function hasFullApiKey(value) {
  return typeof value === 'string' && value.startsWith('dbms_') && value.length > 30;
}
