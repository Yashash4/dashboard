-- ClawHQ Migration: Analytics fixes from senior review
-- 1. SECURITY INVOKER instead of DEFINER
-- 2. Consistent conversation counting (use chat_messages for both daily + summary)
-- 3. Indexes on chat_messages and chat_conversations

-- Add indexes for analytics query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created
  ON public.chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
  ON public.chat_conversations(user_id, updated_at);

-- Replace RPC function with fixes
CREATE OR REPLACE FUNCTION get_analytics_usage(
  p_user_id UUID,
  p_days INT DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
  prev_start TIMESTAMPTZ := NOW() - (p_days * 2 || ' days')::INTERVAL;
BEGIN
  SELECT json_build_object(
    -- Daily breakdown: messages, errors, avg response time, conversations
    'daily', (
      SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.date), '[]'::json)
      FROM (
        SELECT
          dates.date,
          COALESCE(aa.messages, 0) AS messages,
          COALESCE(aa.errors, 0) AS errors,
          COALESCE(aa.avg_response_ms, 0) AS avg_response_ms,
          COALESCE(cv.conversations, 0) AS conversations
        FROM (
          SELECT generate_series(
            period_start::date,
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        ) dates
        LEFT JOIN (
          SELECT
            DATE(created_at) AS date,
            COUNT(*) FILTER (WHERE metric_type = 'message') AS messages,
            COUNT(*) FILTER (WHERE metric_type = 'error') AS errors,
            COALESCE(AVG(response_time_ms) FILTER (WHERE metric_type = 'message'), 0)::INT AS avg_response_ms
          FROM agent_analytics
          WHERE user_id = p_user_id AND created_at >= period_start
          GROUP BY DATE(created_at)
        ) aa ON aa.date = dates.date
        LEFT JOIN (
          SELECT
            DATE(cm.created_at) AS date,
            COUNT(DISTINCT cm.conversation_id) AS conversations
          FROM chat_messages cm
          JOIN chat_conversations cc ON cc.id = cm.conversation_id
          WHERE cc.user_id = p_user_id
            AND cm.created_at >= period_start
            AND cm.role = 'user'
          GROUP BY DATE(cm.created_at)
        ) cv ON cv.date = dates.date
      ) d
    ),

    -- Hourly breakdown: requests per hour of day (UTC)
    'hourly', (
      SELECT COALESCE(json_agg(row_to_json(h) ORDER BY h.hour), '[]'::json)
      FROM (
        SELECT
          hours.hour,
          COALESCE(aa.requests, 0) AS requests
        FROM (SELECT generate_series(0, 23) AS hour) hours
        LEFT JOIN (
          SELECT
            EXTRACT(HOUR FROM created_at)::INT AS hour,
            COUNT(*) AS requests
          FROM agent_analytics
          WHERE user_id = p_user_id AND created_at >= period_start
          GROUP BY EXTRACT(HOUR FROM created_at)
        ) aa ON aa.hour = hours.hour
      ) h
    ),

    -- Agent breakdown: messages per agent
    'agents', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT
          aa.agent_id,
          COALESCE(ag.name, 'Unknown') AS name,
          COUNT(*) AS value
        FROM agent_analytics aa
        LEFT JOIN agents ag ON ag.id = aa.agent_id
        WHERE aa.user_id = p_user_id
          AND aa.created_at >= period_start
          AND aa.metric_type = 'message'
        GROUP BY aa.agent_id, ag.name
        ORDER BY value DESC
      ) a
    ),

    -- Current period summary
    'summary', (
      SELECT row_to_json(s)
      FROM (
        SELECT
          COUNT(*) FILTER (WHERE metric_type = 'message') AS total_messages,
          COUNT(*) FILTER (WHERE metric_type = 'error') AS total_errors,
          COALESCE(AVG(response_time_ms) FILTER (WHERE metric_type = 'message'), 0)::INT AS avg_response_ms,
          -- Error rate: errors / (messages + errors). Future metric_types won't inflate denominator.
          CASE WHEN COUNT(*) FILTER (WHERE metric_type IN ('message', 'error')) > 0
            THEN ROUND(
              COUNT(*) FILTER (WHERE metric_type = 'error')::NUMERIC /
              COUNT(*) FILTER (WHERE metric_type IN ('message', 'error'))::NUMERIC * 100, 1)
            ELSE 0
          END AS error_rate
        FROM agent_analytics
        WHERE user_id = p_user_id AND created_at >= period_start
      ) s
    ),

    -- Previous period summary (for % change)
    'prev_summary', (
      SELECT row_to_json(ps)
      FROM (
        SELECT
          COUNT(*) FILTER (WHERE metric_type = 'message') AS total_messages,
          COUNT(*) FILTER (WHERE metric_type = 'error') AS total_errors
        FROM agent_analytics
        WHERE user_id = p_user_id
          AND created_at >= prev_start
          AND created_at < period_start
      ) ps
    ),

    -- Conversation counts: use chat_messages for consistency with daily breakdown
    'conversations', (
      SELECT COUNT(DISTINCT cm.conversation_id)
      FROM chat_messages cm
      JOIN chat_conversations cc ON cc.id = cm.conversation_id
      WHERE cc.user_id = p_user_id
        AND cm.created_at >= period_start
        AND cm.role = 'user'
    ),
    'prev_conversations', (
      SELECT COUNT(DISTINCT cm.conversation_id)
      FROM chat_messages cm
      JOIN chat_conversations cc ON cc.id = cm.conversation_id
      WHERE cc.user_id = p_user_id
        AND cm.created_at >= prev_start
        AND cm.created_at < period_start
        AND cm.role = 'user'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
