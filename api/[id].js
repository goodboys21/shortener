import fetch from 'node-fetch';

const BIN_URL = 'https://jsonblob.com/api/jsonBlob/1391431496337907712';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const getRes = await fetch(BIN_URL);
    const db = await getRes.json();

    if (!db[id]) return res.status(404).send('Short URL not found');

    res.writeHead(302, { Location: db[id] });
    res.end();
  } catch (e) {
    res.status(500).send('JSONBlob error: ' + e.message);
  }
}
