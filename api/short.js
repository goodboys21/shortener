import fetch from 'node-fetch';

const RAW_URL = 'https://raw.githubusercontent.com/codegood21/code/main/urls.json';
const API_URL = 'https://api.github.com/repos/codegood21/code/contents/urls.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

    const dbRes = await fetch(RAW_URL);
    let db = await dbRes.json();

    const existing = Object.entries(db).find(([_, val]) => val === parsed.href);
    if (existing) {
      return res.json({ short: `https://shortener-sooty.vercel.app/${existing[0]}` });
    }

    let id;
    do {
      id = generateId();
    } while (db[id]);

    db[id] = parsed.href;

    const updatedContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');

    const getSha = await fetch(API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const { sha } = await getSha.json();

    const updateRes = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `add ${id}`,
        content: updatedContent,
        sha
      })
    });

    if (!updateRes.ok) {
      const error = await updateRes.text();
      return res.status(500).json({ error: 'Failed to update GitHub', detail: error });
    }

    res.json({ short: `https://shortener-sooty.vercel.app/${id}` });

  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL or GitHub error', detail: e.message });
  }
}
