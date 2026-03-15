const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/events
router.get("/", (req, res) => {
  const { type, severity, agent_id, from, to, search, limit = "50", offset = "0" } = req.query;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  let where = "1=1";
  const params = {};
  if (type) { where += " AND event_type = @type"; params.type = type; }
  if (severity) { where += " AND severity = @severity"; params.severity = severity; }
  if (agent_id) { where += " AND agent_id = @agent_id"; params.agent_id = agent_id; }
  if (from) { where += " AND created_at >= @from"; params.from = from; }
  if (to) { where += " AND created_at <= @to"; params.to = to; }
  if (search) { where += " AND (message LIKE @search OR payload LIKE @search)"; params.search = `%${search}%`; }

  try {
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM events WHERE ${where}`).get(params);
    const rows = db.prepare(`SELECT * FROM events WHERE ${where} ORDER BY created_at DESC LIMIT @lim OFFSET @off`).all({ ...params, lim, off });

    const events = rows.map((r) => ({ ...r, payload: r.payload ? JSON.parse(r.payload) : {} }));
    res.json({ events, total: countRow.total });
  } catch (err) {
    res.status(500).json({ error: "Failed to query events" });
  }
});

// POST /api/events
router.post("/", (req, res) => {
  const { event_type, severity = "info", agent_id, task_id, session_id, message, payload } = req.body;
  if (!event_type || !message) return res.status(400).json({ error: "event_type and message required" });

  try {
    const stmt = db.prepare(
      "INSERT INTO events (event_type, severity, agent_id, task_id, session_id, message, payload) VALUES (@event_type, @severity, @agent_id, @task_id, @session_id, @message, @payload)"
    );
    const info = stmt.run({
      event_type, severity, agent_id: agent_id || null, task_id: task_id || null,
      session_id: session_id || null, message, payload: payload ? JSON.stringify(payload) : null,
    });
    const event = db.prepare("SELECT * FROM events WHERE rowid = @rowid").get({ rowid: info.lastInsertRowid });
    res.status(201).json({ event: { ...event, payload: event.payload ? JSON.parse(event.payload) : {} } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

module.exports = router;
