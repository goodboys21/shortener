import fetch from 'node-fetch';

const CONFIG_URL = 'https://files.catbox.moe/k7cs72.json';
const FILE_PATH = 'shorturl.json';

async function getConfig() {
  const res = await fetch(CONFIG_URL);
  if (!res.ok) throw new Error('Failed to fetch GitHub config from Catbox');
  return await res.json();
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const { username, repo, token } = await getConfig();
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${FILE_PATH}`;

    const getRes = await fetch(apiUrl, {
      headers: { Authorization: `token ${token}` }
    });

    if (!getRes.ok) {
      const text = await getRes.text();
      return res.status(500).send('GitHub API error: ' + text);
    }

    const file = await getRes.json();
    const decoded = Buffer.from(file.content, 'base64').toString();
    const db = JSON.parse(decoded);

    if (!db[id]) {
      return res.status(404).send(`Short URL not found for id: ${id}`);
    }

    res.writeHead(302, { Location: db[id] });
    res.end();
  } catch (e) {
    res.status(500).send('GitHub DB error: ' + e.message);
  }
}
