import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/short", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    // Ambil data GitHub dari Catbox
    const catbox = await fetch("https://files.catbox.moe/k7cs72.json").then(r => r.json());
    const { token, username, repo, branch } = catbox;

    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/shorturl.json?ref=${branch}`;

    // Ambil file shorturl.json dari GitHub
    const data = await fetch(apiUrl, {
      headers: { Authorization: `token ${token}` },
    }).then(r => r.json());

    const content = Buffer.from(data.content, "base64").toString();
    const json = JSON.parse(content);

    // Cek apakah URL sudah disimpan sebelumnya
    const found = Object.entries(json).find(([, v]) => v === url);
    const shortId = found ? found[0] : Math.random().toString(36).substring(2, 8);
    const shortLink = `https://${req.headers.host}/${shortId}`;

    // Jika belum ada, simpan ke GitHub
    if (!found) {
      json[shortId] = url;

      await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add short URL: ${shortId}`,
          content: Buffer.from(JSON.stringify(json, null, 2)).toString("base64"),
          sha: data.sha,
          branch,
        }),
      });
    }

    // Buat QR via API
    const qrRes = await fetch(`https://api.baguss.xyz/api/tools/text2qr?text=${encodeURIComponent(shortLink)}`);
    const qrJson = await qrRes.json();

    res.json({
      short: shortLink,
      qr: qrJson.url,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("✅ Running on port 3000"));
