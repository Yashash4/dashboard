import crypto from "crypto";

/**
 * Compute SHA-256 hash for an audit log entry.
 * Creates a tamper-proof chain where each entry references the previous hash.
 */
export function computeEntryHash(entry: {
  id: string;
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  category?: string;
  details?: Record<string, unknown>;
  created_at: string;
  previous_hash: string | null;
}): string {
  const payload = JSON.stringify({
    id: entry.id,
    user_id: entry.user_id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    category: entry.category,
    details: entry.details,
    created_at: entry.created_at,
    previous_hash: entry.previous_hash,
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Verify integrity of an audit log chain.
 * Returns { valid, broken_at } — if invalid, broken_at is the index where the chain broke.
 */
export function verifyChain(
  entries: {
    id: string;
    entry_hash: string | null;
    previous_hash: string | null;
    user_id: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    category?: string;
    details?: Record<string, unknown>;
    created_at: string;
  }[]
): { valid: boolean; verified: number; broken_at?: number } {
  let verified = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.entry_hash) continue; // Legacy entries without hashes

    const expectedHash = computeEntryHash({
      id: entry.id,
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      category: entry.category,
      details: entry.details,
      created_at: entry.created_at,
      previous_hash: entry.previous_hash,
    });

    if (expectedHash !== entry.entry_hash) {
      return { valid: false, verified, broken_at: i };
    }

    // Verify chain link
    if (i > 0 && entries[i - 1].entry_hash && entry.previous_hash !== entries[i - 1].entry_hash) {
      return { valid: false, verified, broken_at: i };
    }

    verified++;
  }

  return { valid: true, verified };
}
