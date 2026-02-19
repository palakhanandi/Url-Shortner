const express = require("express");
const path = require("path");
const { nanoid } = require("nanoid");
const QRCode = require("qrcode");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;


/* ---------- Database ---------- */
const db = new sqlite3.Database("./shortly.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      originalUrl TEXT NOT NULL,
      shortId TEXT UNIQUE,
      clicks INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ---------- Routes ---------- */

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Create short URL
app.post("/api/shorten", (req, res) => {
  const { originalUrl, customAlias } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  const shortId = customAlias || nanoid(6);

  db.run(
    "INSERT INTO urls (originalUrl, shortId) VALUES (?, ?)",
    [originalUrl, shortId],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Custom alias already exists" });
      }

      res.json({
        shortUrl: `${BASE_URL}/${shortId}`
      });
    }
  );
});

// Redirect + count clicks
app.get("/:shortId", (req, res) => {
  const { shortId } = req.params;

  db.get(
    "SELECT originalUrl FROM urls WHERE shortId = ?",
    [shortId],
    (err, row) => {
      if (!row) return res.status(404).send("Link not found");

      db.run(
        "UPDATE urls SET clicks = clicks + 1 WHERE shortId = ?",
        [shortId]
      );

      res.redirect(row.originalUrl);
    }
  );
});

// Analytics
app.get("/api/analytics/:shortId", (req, res) => {
  db.get(
    "SELECT originalUrl, clicks, createdAt FROM urls WHERE shortId = ?",
    [req.params.shortId],
    (err, row) => {
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    }
  );
});

// QR Code
app.get("/api/qrcode/:shortId", async (req, res) => {
  const url = `${BASE_URL}/${req.params.shortId}`;
  const qr = await QRCode.toDataURL(url);
  res.json({ qr });
});

/* ---------- Start Server ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Shortly running at ${BASE_URL}`);
});


