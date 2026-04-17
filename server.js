const express = require("express");
const path = require("path");
const cors = require("cors");
const { nanoid } = require("nanoid");
const QRCode = require("qrcode");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

/* ---------- Database ---------- */
const db = new sqlite3.Database(
  path.join(__dirname, "shortly.db"),
  (err) => {
    if (err) {
      console.error("DB Error:", err);
    } else {
      console.log("✅ DB Connected");
    }
  }
);

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    originalUrl TEXT NOT NULL,
    shortId TEXT UNIQUE,
    clicks INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "Public")));

/* ---------- Routes ---------- */

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "index.html"));
});

// Shorten URL
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
        return res.status(400).json({ error: err.message });
      }

      console.log("✅ URL Saved:", shortId);

      res.json({
        shortUrl: `${BASE_URL}/${shortId}`
      });
    }
  );
});

// Redirect + update clicks
app.get("/:shortId", (req, res) => {
  const shortId = req.params.shortId.trim();

  console.log("🔥 Redirect HIT:", shortId);

  db.get(
    "SELECT originalUrl FROM urls WHERE shortId = ?",
    [shortId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error");
      }

      if (!row) {
        console.log("❌ Not found in DB");
        return res.status(404).send("Not found");
      }

      db.run(
        "UPDATE urls SET clicks = clicks + 1 WHERE shortId = ?",
        [shortId],
        function (err) {
          if (err) {
            console.error("❌ Update error:", err);
          } else {
            console.log("✅ Click updated. Rows:", this.changes);
          }

          res.redirect(row.originalUrl);
        }
      );
    }
  );
});

// Analytics
app.get("/api/analytics/:shortId", (req, res) => {
  db.get(
    "SELECT originalUrl, clicks, createdAt FROM urls WHERE shortId = ?",
    [req.params.shortId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (!row) return res.status(404).json({ error: "Not found" });

      res.json(row);
    }
  );
});

// QR Code
app.get("/api/qrcode/:shortId", async (req, res) => {
  try {
    const url = `${BASE_URL}/${req.params.shortId}`;
    const qr = await QRCode.toDataURL(url);
    res.json({ qr });
  } catch {
    res.status(500).json({ error: "QR error" });
  }
});

/* ---------- Start Server ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Running at ${BASE_URL}`);
});

