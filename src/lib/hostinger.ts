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
