const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create all tables on first startup
db.exec(`
  -- MC Events
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    agent_id TEXT,
    task_id TEXT,
    session_id TEXT,
    message TEXT,
    payload TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);

  -- MC Sessions
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_id TEXT,
    task_id TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    duration_ms INTEGER,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    trace_data TEXT,
    metadata TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent_id);

  -- MC Activities
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL,
    actor TEXT,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_activities_task ON activities(task_id);

  -- Audit Logs
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    action TEXT NOT NULL,
    category TEXT,
    entity_type TEXT,
    entity_id TEXT,
    actor_type TEXT DEFAULT 'user',
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(category);

  -- Analytics
  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_name TEXT,
    channel_type TEXT,
    response_time_ms INTEGER,
    message_date TEXT,
    hour INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(message_date);
  CREATE INDEX IF NOT EXISTS idx_analytics_agent ON analytics(agent_name);

  -- KB Documents
  CREATE TABLE IF NOT EXISTS kb_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER DEFAULT 0,
    content TEXT,
    status TEXT DEFAULT 'processing',
    chunk_count INTEGER DEFAULT 0,
    retrieval_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    indexed_at TEXT
  );

  -- KB Chunks
  CREATE TABLE IF NOT EXISTS kb_chunks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    document_id TEXT NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    embedding BLOB,
    metadata TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_chunks_doc ON kb_chunks(document_id);

  -- Webhook Delivery Logs
  CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    webhook_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    status_code INTEGER,
    response_body TEXT,
    latency_ms INTEGER,
    success INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
  CREATE INDEX IF NOT EXISTS idx_deliveries_retry ON webhook_deliveries(next_retry_at);
`);

module.exports = db;
