import fetch from 'node-fetch';

const BIN_URL = 'https://jsonblob.com/api/jsonBlob/1391431496337907712';

const generateId = (len = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing ?url=' });

  try {
    const decodedUrl = decodeURIComponent(url);
    const parsed = new URL(decodedUrl);

    const getRes = await fetch(BIN_URL);
    const db = await getRes.json();

    const existing = Object.entries(db).find(([_, val]) => val === parsed.href);
    if (existing) {
      return res.json({ short: `https://${req.headers.host}/${existing[0]}` });
    }

    let id;
    do {
      id = generateId();
    } while (db[id]);

    db[id] = parsed.href;

    const putRes = await fetch(BIN_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db, null, 2)
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      return res.status(500).json({ error: 'Failed to update JsonBlob', detail: text });
    }

    res.json({ short: `https://${req.headers.host}/${id}` });

  } catch (err) {
    res.status(400).json({ error: 'Invalid URL or JSONBlob error', detail: err.message });
  }
  }
