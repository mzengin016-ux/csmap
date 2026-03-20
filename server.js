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

  // Sunucuya eklenme zamanını kaydet
  event.addedAt = new Date().toISOString();

  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    data.push(event);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Event added successfully' });
  } catch(err) {
    res.status(500).json({ error: 'Failed to save event to database' });
  }
});

// DELETE an event by index
app.delete('/api/events/:index', (req, res) => {
  const { username, password } = req.body;
  if (username !== 'admin' || password !== '123123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idx = parseInt(req.params.index);
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (idx < 0 || idx >= data.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    data.splice(idx, 1);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

const PORT = process.env.PORT || 3000;

// GET district GeoJSON
const ALLOWED_ISO = ['SYR','LBN','IRQ','ISR','IRN','TUR','YEM','SAU','JOR','PSE'];
app.get('/api/districts/:iso', (req, res) => {
  const iso = req.params.iso.toUpperCase().replace(/[^A-Z]/g,'');
  if (!ALLOWED_ISO.includes(iso))
    return res.status(400).json({ error: 'Unsupported: ' + iso });
  const fp = path.join(__dirname, 'districts', iso + '.geojson');
  if (!fs.existsSync(fp))
    return res.status(404).json({ error: 'Not found: ' + iso });
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','public,max-age=86400');
  fs.createReadStream(fp).pipe(res);
});

// GET / POST paint state
const paintPath = path.join(__dirname, 'paint.json');
app.get('/api/paint', (req, res) => {
  if (!fs.existsSync(paintPath)) return res.json([]);
  try { res.json(JSON.parse(fs.readFileSync(paintPath,'utf8'))); }
  catch(e) { res.json([]); }
});
app.post('/api/paint', (req, res) => {
  const { username, password, regions } = req.body;
  if (username !== 'admin' || password !== '123123')
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    fs.writeFileSync(paintPath, JSON.stringify(regions||[], null, 2));
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'Write failed' }); }
});


app.listen(PORT, () => {
  console.log(`Iran Crisis Map Event Server running on port ${PORT}`);
});
