const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/audit-log
router.get("/", (req, res) => {
  const { category, search, from, to, limit = "50", offset = "0" } = req.query;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  let where = "1=1";
  const params = {};
  if (category) { where += " AND category = @category"; params.category = category; }
  if (from) { where += " AND created_at >= @from"; params.from = from; }
  if (to) { where += " AND created_at <= @to"; params.to = to; }
  if (search) { where += " AND (action LIKE @search OR details LIKE @search)"; params.search = `%${search}%`; }

  try {
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs WHERE ${where}`).get(params);
    const rows = db.prepare(`SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT @lim OFFSET @off`).all({ ...params, lim, off });
    const logs = rows.map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));
    res.json({ logs, total: countRow.total });
  } catch {
    res.status(500).json({ error: "Failed to query audit logs" });
  }
});

// POST /api/audit-log
router.post("/", (req, res) => {
  const { action, category, entity_type, entity_id, actor_type, details, ip_address } = req.body;
  if (!action) return res.status(400).json({ error: "action required" });

  try {
    const stmt = db.prepare(
      "INSERT INTO audit_logs (action, category, entity_type, entity_id, actor_type, details, ip_address) VALUES (@action, @category, @entity_type, @entity_id, @actor_type, @details, @ip_address)"
    );
    stmt.run({
      action, category: category || null, entity_type: entity_type || null,
      entity_id: entity_id || null, actor_type: actor_type || "user",
      details: details ? JSON.stringify(details) : null, ip_address: ip_address || null,
    });
    res.status(201).json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to write audit log" });
  }
});

module.exports = router;
