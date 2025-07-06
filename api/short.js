const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'urls.json');

function generateId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

let db = {};
if (fs.existsSync(dbFile)) {
  try {
    db = JSON.parse(fs.readFileSync(dbFile));
  } catch (err) {
    db = {};
  }
}

const saveDb = () => {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
};

export default function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url=' });
  }

  try {
    const parsed = new URL(url);

    const existing = Object.entries(db).find(([key, val]) => val === parsed.href);
    if (existing) {
      return res.json({ short: `https://cgo.qzz.io/${existing[0]}` });
    }

    let id;
    do {
      id = generateId();
    } while (db[id]);

    db[id] = parsed.href;
    saveDb();

    res.json({ short: `https://cgo.qzz.io/${id}` });
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
  }
}
