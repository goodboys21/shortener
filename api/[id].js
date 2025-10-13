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
    const { username, repo, branch } = await getConfig();
    const url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${FILE_PATH}`;
    const getRes = await fetch(url);
    const db = await getRes.json();

    if (!db[id]) return res.status(404).send('Short URL not found');

    res.writeHead(302, { Location: db[id] });
    res.end();
  } catch (e) {
    res.status(500).send('GitHub DB error: ' + e.message);
  }
}
