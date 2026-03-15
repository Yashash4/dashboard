const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/analytics
router.get("/", (req, res) => {
  const { period = "7d", agent } = req.query;
  const days = period === "90d" ? 90 : period === "30d" ? 30 : period === "14d" ? 14 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    let agentWhere = "";
    const params = { since };
    if (agent) { agentWhere = " AND agent_name = @agent"; params.agent = agent; }

    // Daily totals
    const daily = db.prepare(
      `SELECT message_date as date, COUNT(*) as messages, AVG(response_time_ms) as avg_response_ms FROM analytics WHERE message_date >= @since${agentWhere} GROUP BY message_date ORDER BY message_date`
    ).all(params);

    // Hourly distribution
    const hourly = db.prepare(
      `SELECT hour, COUNT(*) as messages FROM analytics WHERE message_date >= @since${agentWhere} GROUP BY hour ORDER BY hour`
    ).all(params);

    // By agent
    const byAgent = db.prepare(
      `SELECT agent_name, COUNT(*) as messages, AVG(response_time_ms) as avg_response_ms FROM analytics WHERE message_date >= @since GROUP BY agent_name ORDER BY messages DESC`
    ).all({ since });

    // Summary
    const summary = db.prepare(
      `SELECT COUNT(*) as total_messages, AVG(response_time_ms) as avg_response_ms, COUNT(DISTINCT message_date) as active_days FROM analytics WHERE message_date >= @since${agentWhere}`
    ).get(params);

    res.json({ daily, hourly, by_agent: byAgent, summary: summary || {} });
  } catch {
    res.status(500).json({ error: "Failed to query analytics" });
  }
});

// POST /api/analytics
router.post("/", (req, res) => {
  const { agent_name, channel_type, response_time_ms, message_date, hour } = req.body;

  try {
    db.prepare(
      "INSERT INTO analytics (agent_name, channel_type, response_time_ms, message_date, hour) VALUES (@agent_name, @channel_type, @response_time_ms, @message_date, @hour)"
    ).run({
      agent_name: agent_name || null, channel_type: channel_type || null,
      response_time_ms: response_time_ms || 0,
      message_date: message_date || new Date().toISOString().split("T")[0],
      hour: hour ?? new Date().getHours(),
    });
    res.status(201).json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to record analytics" });
  }
});

module.exports = router;
