const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local auth server listening on http://localhost:${PORT}`);
});
