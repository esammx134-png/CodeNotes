const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dataFile = path.join(__dirname, 'fq-db.json');
let db = { users: {}, progress: {} };

if (fs.existsSync(dataFile)) {
  try { db = JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch (e) { console.error('Invalid db file', e); }
}

function saveDb() {
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/register', (req, res) => {
  const { user, email, phone, passwordHash } = req.body;
  if (!user || !email || !phone || !passwordHash) return res.status(400).json({ error: 'Missing required fields' });
  if (db.users[user]) return res.status(409).json({ error: 'User exists' });
  const alreadyEmail = Object.values(db.users).some((u) => u.email === email);
  if (alreadyEmail) return res.status(409).json({ error: 'Email exists' });
  db.users[user] = { email, phone, passwordHash, createdAt: new Date().toISOString() };
  saveDb();
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { user, passwordHash } = req.body;
  if (!user || !passwordHash) return res.status(400).json({ error: 'Missing fields' });
  const account = db.users[user];
  if (!account || account.passwordHash !== passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user });
});

app.get('/api/progress/:user', (req, res) => {
  const user = req.params.user;
  if (!db.progress[user]) return res.json({ currentLevel: 1, totalStars: 0, levelStars: {} });
  res.json(db.progress[user]);
});

app.post('/api/progress/:user', (req, res) => {
  const user = req.params.user;
  const { currentLevel = 1, totalStars = 0, levelStars = {} } = req.body;
  db.progress[user] = { currentLevel, totalStars, levelStars };
  saveDb();
  res.json({ success: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
