const express = require("express");
const authMiddleware = require("./auth");

// Initialize database (creates tables on first run)
require("./db");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Health endpoint (no auth required)
app.get("/health", (req, res) => {
  const db = require("./db");
  const uptime = process.uptime();
  let dbSizeMb = 0;
  try {
    const row = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
    dbSizeMb = Math.round((row?.size || 0) / 1024 / 1024 * 100) / 100;
  } catch {}
  res.json({ status: "ok", uptime: Math.round(uptime), db_size_mb: dbSizeMb });
});

// All other routes require auth
app.use(authMiddleware);

// Mount route handlers
app.use("/api/events", require("./routes/events"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/audit-log", require("./routes/audit-log"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/kb", require("./routes/kb"));
app.use("/api/webhook-deliveries", require("./routes/deliveries"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error("Data API error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5556;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ClawHQ Data API running on port ${PORT}`);
});
