const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'urls.json');

let db = {};
if (fs.existsSync(dbFile)) {
  try {
    db = JSON.parse(fs.readFileSync(dbFile));
  } catch (err) {
    db = {};
  }
}

export default function handler(req, res) {
  const {
    query: { id }
  } = req;

  const target = db[id];
  if (!target) return res.status(404).send('Short URL not found');
  res.writeHead(302, { Location: target });
  res.end();
}
