-- ClawHQ Migration: Audit Enhancement tables

-- 11.2 Tamper-proof hash chain
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entry_hash TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS previous_hash TEXT;

-- 11.1 SIEM streaming config
-- siem_configs table is created in 20260315550000_siem_configs.sql
-- Just ensure RLS is enabled (idempotent)
ALTER TABLE public.siem_configs ENABLE ROW LEVEL SECURITY;

-- 11.6 Retention policy
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS audit_retention_days INTEGER DEFAULT 90;

-- 11.9 Date range filter index
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at);
