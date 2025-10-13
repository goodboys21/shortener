import fetch from 'node-fetch';

const CONFIG_URL = 'https://files.catbox.moe/k7cs72.json';
const FILE_PATH = 'shorturl.json';

const generateId = (len = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

async function getConfig() {
  const res = await fetch(CONFIG_URL);
  if (!res.ok) throw new Error('Failed to fetch GitHub config from Catbox');
  return await res.json();
}

async function getDB({ username, repo, branch }) {
  const url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${FILE_PATH}`;
  const res = await fetch(url);
  if (!res.ok) return {}; // file belum ada → return kosong
  return await res.json();
}

async function updateDB({ username, repo, token }, newData) {
  const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${FILE_PATH}`;

  // ambil sha file lama, kalau belum ada maka biarin undefined
  let sha;
  const getRes = await fetch(apiUrl, {
    headers: { Authorization: `token ${token}` }
  });
  if (getRes.ok) {
    const getJson = await getRes.json();
    sha = getJson.sha;
  }

  const encoded = Buffer.from(JSON.stringify(newData, null, 2)).toString('base64');

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: sha ? 'Update short links database' : 'Create short links database',
      content: encoded,
      sha
    })
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`GitHub update failed: ${text}`);
  }
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing ?url=' });

  try {
    const config = await getConfig();
    const decodedUrl = decodeURIComponent(url);
    const parsed = new URL(decodedUrl);

    const db = await getDB(config);

    // kalau sudah ada URL yang sama
    const existing = Object.entries(db).find(([_, val]) => val === parsed.href);
    if (existing) {
      return res.json({ short: `https://${req.headers.host}/${existing[0]}` });
    }

    let id;
    do {
      id = generateId();
    } while (db[id]);

    db[id] = parsed.href;

    await updateDB(config, db);

    res.json({ short: `https://${req.headers.host}/${id}` });
  } catch (err) {
    res.status(400).json({ error: 'Failed to process request', detail: err.message });
  }
}
