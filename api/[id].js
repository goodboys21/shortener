import fetch from 'node-fetch';

const RAW_URL = 'https://raw.githubusercontent.com/codegood21/code/main/urls.json';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const dbRes = await fetch(RAW_URL);
    const db = await dbRes.json();

    if (!db[id]) return res.status(404).send('Short URL not found');

    res.writeHead(302, { Location: db[id] });
    res.end();
  } catch {
    res.status(500).send('Failed to fetch redirect database');
  }
}
