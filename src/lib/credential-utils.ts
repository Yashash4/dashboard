/**
 * Utility functions for encrypting/decrypting individual credential fields
 * stored in the vps_instances table (ssh_password, dashboard_password).
 *
 * Wraps the lower-level encryptCredentials/decryptCredentials from crypto.ts
 * which operate on Record<string, string>.
 *
 * Handles backward compatibility: if a stored value is plaintext (not yet
 * encrypted), decryptField returns it as-is so existing data still works
 * during migration.
 */

import {
  encryptCredentials,
  decryptCredentials,
  isEncryptionConfigured,
} from "./crypto";

/**
 * Encrypt a single credential string for storage in Supabase.
 * Returns the encrypted string, or the original value if encryption is not configured.
 */
export function encryptField(value: string): string {
  if (!value) return value;
  if (!isEncryptionConfigured()) {
    console.error(
      "[credential-utils] CREDENTIAL_ENCRYPTION_KEY is not set — storing credentials in PLAINTEXT. " +
      "Set this environment variable immediately to enable encryption."
    );
    throw new Error("Encryption is not configured. Set CREDENTIAL_ENCRYPTION_KEY environment variable.");
  }
  return encryptCredentials({ v: value });
}

/**
 * Decrypt a single credential string read from Supabase.
 * If the value doesn't look like an encrypted payload (backward compat with
 * plaintext data), returns the original string.
 * Returns the original value if encryption is not configured.
 */
export function decryptField(value: string): string {
  if (!value) return value;
  if (!isEncryptionConfigured()) {
    console.warn(
      "[credential-utils] CREDENTIAL_ENCRYPTION_KEY is not set — returning value as-is. " +
      "Credentials may be stored in plaintext. Set this environment variable to enable encryption."
    );
    return value;
  }

  // Encrypted format is "iv_hex:tag_hex:ciphertext_hex"
  // Each part is hex-only. Quick check: must have exactly 2 colons and all hex.
  const parts = value.split(":");
  if (parts.length !== 3) {
    // Not encrypted — return as-is (plaintext from before encryption was added)
    return value;
  }

  // Validate that all three parts are hex strings of expected lengths
  const hexPattern = /^[0-9a-f]+$/i;
  if (!parts.every((p) => hexPattern.test(p) && p.length > 0)) {
    // Doesn't match encrypted format — treat as plaintext
    return value;
  }

  try {
    const record = decryptCredentials(value);
    return record.v || value;
  } catch {
    // Decryption failed — likely plaintext that happened to look like hex
    return value;
  }
}

/**
 * Decrypt ssh_password (and optionally dashboard_password) from a VPS record
 * read from Supabase. Mutates the object in-place and returns it for convenience.
 */
export function decryptVpsCredentials<
  T extends { ssh_password?: string; dashboard_password?: string },
>(vps: T): T {
  if (vps.ssh_password) {
    vps.ssh_password = decryptField(vps.ssh_password);
  }
  if (vps.dashboard_password) {
    vps.dashboard_password = decryptField(vps.dashboard_password);
  }
  return vps;
}
