const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/activities/:taskId
router.get("/:taskId", (req, res) => {
  const { limit = "50", offset = "0" } = req.query;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  try {
    const countRow = db.prepare("SELECT COUNT(*) as total FROM activities WHERE task_id = @taskId").get({ taskId: req.params.taskId });
    const rows = db.prepare("SELECT * FROM activities WHERE task_id = @taskId ORDER BY created_at DESC LIMIT @lim OFFSET @off").all({ taskId: req.params.taskId, lim, off });
    res.json({ activities: rows, total: countRow.total });
  } catch {
    res.status(500).json({ error: "Failed to query activities" });
  }
});

// POST /api/activities
router.post("/", (req, res) => {
  const { task_id, actor, action, old_value, new_value } = req.body;
  if (!task_id || !action) return res.status(400).json({ error: "task_id and action required" });

  try {
    const stmt = db.prepare("INSERT INTO activities (task_id, actor, action, old_value, new_value) VALUES (@task_id, @actor, @action, @old_value, @new_value)");
    const info = stmt.run({ task_id, actor: actor || null, action, old_value: old_value || null, new_value: new_value || null });
    const activity = db.prepare("SELECT * FROM activities WHERE rowid = @rowid").get({ rowid: info.lastInsertRowid });
    res.status(201).json({ activity });
  } catch {
    res.status(500).json({ error: "Failed to create activity" });
  }
});

module.exports = router;
