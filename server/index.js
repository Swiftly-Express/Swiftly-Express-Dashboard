// Load local environment variables if available (optional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed in production - ignore
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// Development convenience: redirect malformed Paystack callback URLs to frontend
// This preserves the Paystack query string and forwards to the SPA callback route.
app.get('/api/payment/callback*', (req, res) => {
  try {
    const orig = req.originalUrl || req.url || '';
    const qIndex = orig.indexOf('?');
    const qs = qIndex !== -1 ? orig.slice(qIndex + 1) : '';
    const frontend = process.env.FRONTEND_URL || 'http://localhost:8080';
    const redirectTo = `${frontend.replace(/\/$/, '')}/payment/callback${qs ? `?${qs}` : ''}`;
    console.log('[dev-server] Redirecting Paystack callback ->', redirectTo, 'original:', orig);
    return res.redirect(302, redirectTo);
  } catch (e) {
    console.error('[dev-server] Failed to redirect Paystack callback', e);
    return res.status(500).send('Redirect failed');
  }
});

// Simple in-memory users store (for local testing only)
const users = [];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password, confirmPassword, role } = req.body || {};

  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Check for existing email
  const exists = users.find((u) => u.email === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const user = {
    id: users.length + 1,
    fullName,
    email: email.toLowerCase(),
    role: role || 'customer',
    createdAt: new Date().toISOString()
  };

  users.push(user);

  // In a real backend you'd persist, hash passwords, send verification emails, etc.
  return res.status(201).json({ message: 'Registration successful', data: { id: user.id, email: user.email } });
});

app.get('/api/__health', (req, res) => res.json({ status: 'ok' }));

// Simple mock notifications API for local development
app.get('/api/notifications/unread/count', (req, res) => {
  return res.json({ data: { count: 0 } });
});

app.get('/api/notifications', (req, res) => {
  const sample = [
    { _id: 'n1', title: 'Welcome', message: 'Welcome to Swiftly Rider!', isRead: false, createdAt: new Date().toISOString(), type: 'info' }
  ];
  return res.json({ data: { notifications: sample, totalPages: 1 } });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local auth server listening on http://localhost:${PORT}`);
});
