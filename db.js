const sqlite3 = require("sqlite3").verbose();

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

module.exports = db;
