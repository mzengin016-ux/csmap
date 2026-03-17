const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Harita dosyasını serve et — index.html aynı klasörde olmalı
app.use(express.static(path.join(__dirname)));

const dbPath = path.join(__dirname, 'db.json');

// Initialize local JSON database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

// GET all events
app.get('/api/events', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// POST a new event
app.post('/api/events', (req, res) => {
  const { username, password, event } = req.body;
  
  // Basic Admin Authentication
  if (username !== 'admin' || password !== '123123') {
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }
  
  if(!event || !event.lat || !event.lng || !event.name || !event.type) {
    return res.status(400).json({ error: 'Invalid event data' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    data.push(event);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Event added successfully' });
  } catch(err) {
    res.status(500).json({ error: 'Failed to save event to database' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Iran Crisis Map Event Server running on port ${PORT}`);
});
