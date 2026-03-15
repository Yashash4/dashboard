const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/webhook-deliveries/:webhookId
router.get("/:webhookId", (req, res) => {
  const { limit = "50", offset = "0" } = req.query;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  try {
    const countRow = db.prepare("SELECT COUNT(*) as total FROM webhook_deliveries WHERE webhook_id = @webhookId").get({ webhookId: req.params.webhookId });
    const rows = db.prepare(
      "SELECT * FROM webhook_deliveries WHERE webhook_id = @webhookId ORDER BY created_at DESC LIMIT @lim OFFSET @off"
    ).all({ webhookId: req.params.webhookId, lim, off });
    const deliveries = rows.map((r) => ({
      ...r, success: !!r.success, payload: r.payload ? JSON.parse(r.payload) : null,
    }));
    res.json({ deliveries, total: countRow.total });
  } catch {
    res.status(500).json({ error: "Failed to query deliveries" });
  }
});

// POST /api/webhook-deliveries
router.post("/", (req, res) => {
  const { webhook_id, event_type, payload, status_code, response_body, latency_ms, success, retry_count, next_retry_at } = req.body;
  if (!webhook_id || !event_type) return res.status(400).json({ error: "webhook_id and event_type required" });

  try {
    db.prepare(
      "INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status_code, response_body, latency_ms, success, retry_count, next_retry_at) VALUES (@webhook_id, @event_type, @payload, @status_code, @response_body, @latency_ms, @success, @retry_count, @next_retry_at)"
    ).run({
      webhook_id, event_type, payload: payload ? JSON.stringify(payload) : null,
      status_code: status_code || null, response_body: response_body || null,
      latency_ms: latency_ms || null, success: success ? 1 : 0,
      retry_count: retry_count || 0, next_retry_at: next_retry_at || null,
    });
    res.status(201).json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to record delivery" });
  }
});

module.exports = router;
