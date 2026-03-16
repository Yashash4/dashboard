-- ============================================================
-- Enhance payments and payment_orders tables for full
-- audit trail and verification support
-- ============================================================

-- Add Razorpay IDs and user snapshot to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'razorpay';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Enhance payment_orders with IP and region
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;

-- RLS for payments (if not already enabled)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own payments' AND tablename = 'payments') THEN
    CREATE POLICY "Users read own payments" ON payments
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
