const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/sessions
router.get("/", (req, res) => {
  const { agent_id, status, limit = "50", offset = "0" } = req.query;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  let where = "1=1";
  const params = {};
  if (agent_id) { where += " AND agent_id = @agent_id"; params.agent_id = agent_id; }
  if (status === "active") { where += " AND ended_at IS NULL"; }
  else if (status === "completed") { where += " AND ended_at IS NOT NULL AND success = 1"; }
  else if (status === "failed") { where += " AND ended_at IS NOT NULL AND success = 0"; }

  try {
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM sessions WHERE ${where}`).get(params);
    const rows = db.prepare(`SELECT * FROM sessions WHERE ${where} ORDER BY started_at DESC LIMIT @lim OFFSET @off`).all({ ...params, lim, off });
    const sessions = rows.map((r) => ({
      ...r,
      success: !!r.success,
      trace_data: r.trace_data ? JSON.parse(r.trace_data) : {},
      metadata: r.metadata ? JSON.parse(r.metadata) : {},
    }));
    res.json({ sessions, total: countRow.total });
  } catch {
    res.status(500).json({ error: "Failed to query sessions" });
  }
});

// GET /api/sessions/:id
router.get("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM sessions WHERE id = @id").get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: "Session not found" });
    res.json({
      session: { ...row, success: !!row.success, trace_data: row.trace_data ? JSON.parse(row.trace_data) : {}, metadata: row.metadata ? JSON.parse(row.metadata) : {} },
    });
  } catch {
    res.status(500).json({ error: "Failed to get session" });
  }
});

// POST /api/sessions
router.post("/", (req, res) => {
  const { agent_id, task_id } = req.body;
  if (!agent_id) return res.status(400).json({ error: "agent_id required" });

  try {
    const stmt = db.prepare("INSERT INTO sessions (agent_id, task_id) VALUES (@agent_id, @task_id)");
    const info = stmt.run({ agent_id, task_id: task_id || null });
    const session = db.prepare("SELECT * FROM sessions WHERE rowid = @rowid").get({ rowid: info.lastInsertRowid });
    res.status(201).json({ session: { ...session, success: !!session.success, trace_data: {}, metadata: {} } });
  } catch {
    res.status(500).json({ error: "Failed to create session" });
  }
});

// PATCH /api/sessions/:id
router.patch("/:id", (req, res) => {
  const allowed = ["ended_at", "duration_ms", "success", "error_message", "trace_data", "metadata"];
  const sets = [];
  const params = { id: req.params.id };

  for (const key of allowed) {
    if (key in req.body) {
      const val = (key === "trace_data" || key === "metadata") ? JSON.stringify(req.body[key]) : req.body[key];
      sets.push(`${key} = @${key}`);
      params[key] = val;
    }
  }

  if (sets.length === 0) return res.status(400).json({ error: "No updates" });

  try {
    db.prepare(`UPDATE sessions SET ${sets.join(", ")} WHERE id = @id`).run(params);
    const session = db.prepare("SELECT * FROM sessions WHERE id = @id").get({ id: req.params.id });
    res.json({
      session: { ...session, success: !!session.success, trace_data: session.trace_data ? JSON.parse(session.trace_data) : {}, metadata: session.metadata ? JSON.parse(session.metadata) : {} },
    });
  } catch {
    res.status(500).json({ error: "Failed to update session" });
  }
});

module.exports = router;
