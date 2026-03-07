const API_BASE = "https://developers.hostinger.com/api/vps/v1";

function getHeaders() {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) throw new Error("HOSTINGER_API_TOKEN is not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface HostingerVM {
  id: number;
  hostname: string;
  state: string; // "running" | "stopped" | "restoring" | "error" etc.
  cpus: number;
  memory: number; // MB
  disk: number; // MB
  bandwidth: number; // MB
  ipv4: { id: number; address: string; ptr: string }[];
  ipv6: { id: number; address: string; ptr: string }[];
  template: { id: number; name: string; description: string };
  firewall_group_id: number;
  subscription_id: string;
  data_center_id: number;
  plan: string;
  actions_lock: string;
  ns1: string;
  ns2: string;
  created_at: string;
}

// Get all VMs for the account
export async function listVMs(): Promise<HostingerVM[]> {
  const res = await fetch(`${API_BASE}/virtual-machines`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hostinger API error (${res.status}): ${text}`);
  }
  return res.json();
}

// Get a specific VM by ID
export async function getVM(vmId: number): Promise<HostingerVM> {
  const res = await fetch(`${API_BASE}/virtual-machines/${vmId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hostinger API error (${res.status}): ${text}`);
  }
  return res.json();
}

// Get VM status
export async function getVMStatus(vmId: number): Promise<string> {
  const res = await fetch(`${API_BASE}/virtual-machines/${vmId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to get VM status (${res.status})`);
  }
  const vm: HostingerVM = await res.json();
  return vm.state;
}

// Start VM
export async function startVM(vmId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/virtual-machines/${vmId}/start`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to start VM (${res.status}): ${text}`);
  }
}

// Stop VM
export async function stopVM(vmId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/virtual-machines/${vmId}/stop`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to stop VM (${res.status}): ${text}`);
  }
}

// Restart VM
export async function restartVM(vmId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/virtual-machines/${vmId}/restart`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to restart VM (${res.status}): ${text}`);
  }
}

// --- Firewall Management ---

export interface FirewallRule {
  id?: number;
  action: string;
  protocol: string;
  port: string;
  source: string;
  source_detail: string;
}

export interface Firewall {
  id: number;
  name: string;
  rules: FirewallRule[];
}

// Find VM by IP address
export async function findVMByIP(ip: string): Promise<HostingerVM | undefined> {
  const vms = await listVMs();
  return vms.find((vm) =>
    vm.ipv4?.some((addr) => addr.address === ip)
  );
}

// Get firewall details (includes rules)
export async function getFirewall(firewallId: number): Promise<Firewall> {
  const res = await fetch(`${API_BASE}/firewall/${firewallId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get firewall (${res.status}): ${text}`);
  }
  return res.json();
}

// Create a firewall rule
export async function createFirewallRule(
  firewallId: number,
  rule: { protocol: string; port: string; source: string; source_detail: string }
): Promise<FirewallRule> {
  const res = await fetch(`${API_BASE}/firewall/${firewallId}/rules`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(rule),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create firewall rule (${res.status}): ${text}`);
  }
  return res.json();
}

// Sync firewall rules to a VM
export async function syncFirewall(
  firewallId: number,
  vmId: number
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/firewall/${firewallId}/sync/${vmId}`,
    { method: "POST", headers: getHeaders() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to sync firewall (${res.status}): ${text}`);
  }
}

// Activate firewall on a VM
export async function activateFirewall(
  firewallId: number,
  vmId: number
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/firewall/${firewallId}/activate/${vmId}`,
    { method: "POST", headers: getHeaders() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to activate firewall (${res.status}): ${text}`);
  }
}

// Ensure ports 22, 80, 443 are open on the VM's firewall
export async function ensureFirewallPorts(
  ip: string
): Promise<{ vmId: number; firewallId: number; portsOpened: string[] }> {
  // 1. Find the VM by IP
  const vm = await findVMByIP(ip);
  if (!vm) {
    throw new Error(`No VM found with IP ${ip}`);
  }

  const firewallId = vm.firewall_group_id;
  if (!firewallId) {
    // No firewall group = no provider-level firewall blocking ports. Skip gracefully.
    return { vmId: vm.id, firewallId: 0, portsOpened: [] };
  }

  // 2. Get current firewall rules
  const firewall = await getFirewall(firewallId);
  const existingPorts = new Set(
    firewall.rules
      ?.filter((r) => r.protocol === "TCP" && r.action === "accept")
      .map((r) => r.port) || []
  );

  // 3. Add missing rules for required ports
  const requiredPorts = ["22", "80", "443"];
  const portsOpened: string[] = [];

  for (const port of requiredPorts) {
    if (!existingPorts.has(port)) {
      await createFirewallRule(firewallId, {
        protocol: "TCP",
        port,
        source: "any",
        source_detail: "any",
      });
      portsOpened.push(port);
    }
  }

  // 4. Sync firewall to VM if we added any rules
  if (portsOpened.length > 0) {
    await syncFirewall(firewallId, vm.id);
  }

  return { vmId: vm.id, firewallId, portsOpened };
}
