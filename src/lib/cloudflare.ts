const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

function getConfig() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID");
  }
  return { token, zoneId };
}

// Create an A record: subdomain.clawhq.tech → VPS IP
export async function createSubdomain(
  subdomain: string,
  ip: string
): Promise<{ success: boolean; hostname: string; error?: string }> {
  const { token, zoneId } = getConfig();
  const hostname = `${subdomain}.clawhq.tech`;

  // Check if record already exists
  const existing = await fetch(
    `${CLOUDFLARE_API}/zones/${zoneId}/dns_records?type=A&name=${hostname}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const existingData = await existing.json();

  if (existingData.result && existingData.result.length > 0) {
    // Update existing record
    const recordId = existingData.result[0].id;
    const res = await fetch(
      `${CLOUDFLARE_API}/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "A",
          name: subdomain,
          content: ip,
          ttl: 1, // Auto
          proxied: true, // Cloudflare handles SSL, origin uses self-signed cert
        }),
      }
    );
    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        hostname,
        error: data.errors?.[0]?.message || "Failed to update DNS record",
      };
    }
    return { success: true, hostname };
  }

  // Create new record
  const res = await fetch(
    `${CLOUDFLARE_API}/zones/${zoneId}/dns_records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "A",
        name: subdomain,
        content: ip,
        ttl: 1, // Auto
        proxied: true, // Cloudflare handles SSL, origin uses self-signed cert
      }),
    }
  );
  const data = await res.json();

  if (!data.success) {
    return {
      success: false,
      hostname,
      error: data.errors?.[0]?.message || "Failed to create DNS record",
    };
  }

  return { success: true, hostname };
}

// Ensure SSL/TLS mode is set to "Full" (zone-level setting)
// This makes Cloudflare connect to origin via HTTPS (using our self-signed cert)
export async function ensureSslFull(): Promise<{ success: boolean; error?: string }> {
  const { token, zoneId } = getConfig();

  const res = await fetch(
    `${CLOUDFLARE_API}/zones/${zoneId}/settings/ssl`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "full" }),
    }
  );
  const data = await res.json();

  if (!data.success) {
    return {
      success: false,
      error: data.errors?.[0]?.message || "Failed to set SSL mode",
    };
  }

  return { success: true };
}

// Ensure "Always Use HTTPS" is enabled (zone-level redirect HTTP → HTTPS)
export async function ensureAlwaysHttps(): Promise<{ success: boolean; error?: string }> {
  const { token, zoneId } = getConfig();

  const res = await fetch(
    `${CLOUDFLARE_API}/zones/${zoneId}/settings/always_use_https`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "on" }),
    }
  );
  const data = await res.json();

  if (!data.success) {
    return {
      success: false,
      error: data.errors?.[0]?.message || "Failed to enable Always Use HTTPS",
    };
  }

  return { success: true };
}

// Delete a subdomain record
export async function deleteSubdomain(
  subdomain: string
): Promise<{ success: boolean; error?: string }> {
  const { token, zoneId } = getConfig();
  const hostname = `${subdomain}.clawhq.tech`;

  const existing = await fetch(
    `${CLOUDFLARE_API}/zones/${zoneId}/dns_records?type=A&name=${hostname}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const existingData = await existing.json();

  if (!existingData.result || existingData.result.length === 0) {
    return { success: true }; // Already gone
  }

  const recordId = existingData.result[0].id;
  const res = await fetch(
    `${CLOUDFLARE_API}/zones/${zoneId}/dns_records/${recordId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();

  if (!data.success) {
    return {
      success: false,
      error: data.errors?.[0]?.message || "Failed to delete DNS record",
    };
  }

  return { success: true };
}
