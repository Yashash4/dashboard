import { NodeSSH } from "node-ssh";

interface VPSCredentials {
  ip_address: string;
  ssh_user: string;
  ssh_password: string;
  ssh_port?: number;
}

async function connect(creds: VPSCredentials): Promise<NodeSSH> {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: creds.ip_address,
    username: creds.ssh_user,
    password: creds.ssh_password,
    port: creds.ssh_port || 22,
    readyTimeout: 10000,
  });
  return ssh;
}

// Detect if OpenClaw runs in Docker or as a native process
async function detectRuntime(ssh: NodeSSH): Promise<"docker" | "native"> {
  const result = await ssh.execCommand(
    'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
  );
  if (result.stdout.trim() && !result.stderr) {
    return "docker";
  }
  return "native";
}

// Find the systemd service name for OpenClaw (could be openclaw, open-claw, etc.)
async function findSystemdService(ssh: NodeSSH): Promise<string | null> {
  const result = await ssh.execCommand(
    'systemctl list-unit-files --type=service 2>/dev/null | grep -iE "(openclaw|open-claw)" | head -1 | awk \'{print $1}\''
  );
  const service = result.stdout.trim();
  if (service) return service;

  // Also check running services in case unit file isn't listed
  const running = await ssh.execCommand(
    'systemctl list-units --type=service --state=running 2>/dev/null | grep -iE "(openclaw|open-claw)" | head -1 | awk \'{print $1}\''
  );
  return running.stdout.trim() || null;
}

// Check if OpenClaw process is running via ps
async function isProcessRunning(ssh: NodeSSH): Promise<boolean> {
  const result = await ssh.execCommand(
    'ps aux | grep -iE "(openclaw|open-claw)" | grep -v grep'
  );
  return result.stdout.trim().length > 0;
}

export async function getProcessStatus(creds: VPSCredentials) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);

    if (runtime === "docker") {
      const result = await ssh.execCommand(
        'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
      );
      const status = result.stdout.trim();
      return status === "running" ? "running" : "stopped";
    }

    // Native: check systemd service first, then fall back to process check
    const serviceName = await findSystemdService(ssh);
    if (serviceName) {
      const result = await ssh.execCommand(
        `systemctl is-active ${serviceName} 2>/dev/null`
      );
      return result.stdout.trim() === "active" ? "running" : "stopped";
    }

    return (await isProcessRunning(ssh)) ? "running" : "stopped";
  } finally {
    ssh.dispose();
  }
}

export async function getVPSStats(creds: VPSCredentials) {
  const ssh = await connect(creds);
  try {
    const [cpuResult, memResult, uptimeResult, diskResult, netResult] = await Promise.all([
      ssh.execCommand("top -bn1 | grep 'Cpu(s)' | head -1"),
      ssh.execCommand("free -m | grep Mem"),
      ssh.execCommand("cat /proc/uptime"),
      ssh.execCommand("df -BG / | tail -1"),
      ssh.execCommand("cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1"),
    ]);

    const cpuLine = cpuResult.stdout.trim();
    const idleMatch = cpuLine.match(/([\d.]+)\s*id/);
    const cpuPercent = idleMatch ? 100 - parseFloat(idleMatch[1]) : 0;

    const memFields = memResult.stdout.trim().split(/\s+/);
    const ramTotalMb = parseInt(memFields[1] || "0");
    const ramUsedMb = parseInt(memFields[2] || "0");

    const uptimeSeconds = Math.floor(
      parseFloat(uptimeResult.stdout.trim().split(" ")[0] || "0")
    );

    const diskParts = diskResult.stdout.trim().split(/\s+/);
    const diskTotalGb = parseInt(diskParts[1]?.replace("G", "") || "0");
    const diskUsedGb = parseInt(diskParts[2]?.replace("G", "") || "0");

    // Parse /proc/net/dev: iface rx_bytes ... tx_bytes ...
    let netRxBytes = 0;
    let netTxBytes = 0;
    const netLine = netResult.stdout.trim();
    if (netLine) {
      const netFields = netLine.split(":")[1]?.trim().split(/\s+/) || [];
      netRxBytes = parseInt(netFields[0] || "0");
      netTxBytes = parseInt(netFields[8] || "0");
    }

    return {
      cpu_percent: cpuPercent,
      ram_used_mb: ramUsedMb,
      ram_total_mb: ramTotalMb,
      disk_used_gb: diskUsedGb,
      disk_total_gb: diskTotalGb,
      uptime_seconds: uptimeSeconds,
      net_rx_bytes: netRxBytes,
      net_tx_bytes: netTxBytes,
    };
  } finally {
    ssh.dispose();
  }
}

export async function startOpenClaw(creds: VPSCredentials) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);

    if (runtime === "docker") {
      const result = await ssh.execCommand("docker start openclaw");
      if (result.stderr && !result.stderr.includes("openclaw")) {
        throw new Error(result.stderr);
      }
      return { success: true };
    }

    // Check if already running
    if (await isProcessRunning(ssh)) {
      return { success: true };
    }

    // Try systemd first
    const serviceName = await findSystemdService(ssh);
    if (serviceName) {
      await ssh.execCommand(`systemctl start ${serviceName}`);
      await ssh.execCommand("sleep 2");

      const check = await ssh.execCommand(
        `systemctl is-active ${serviceName} 2>/dev/null`
      );
      if (check.stdout.trim() === "active") {
        return { success: true };
      }
      throw new Error(`Failed to start service ${serviceName}`);
    }

    // No systemd service — try direct binary
    const whichResult = await ssh.execCommand(
      "which openclaw 2>/dev/null || which open-claw 2>/dev/null"
    );
    const binary = whichResult.stdout.trim();
    if (!binary) {
      throw new Error("OpenClaw binary not found on the server");
    }

    const result = await ssh.execCommand(
      `nohup ${binary} > /var/log/openclaw.log 2>&1 & echo $!`
    );
    if (!result.stdout.trim()) {
      throw new Error("Failed to start OpenClaw process");
    }

    await ssh.execCommand("sleep 2");
    if (!(await isProcessRunning(ssh))) {
      throw new Error("OpenClaw process exited immediately after start");
    }

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

export async function stopOpenClaw(creds: VPSCredentials) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);

    if (runtime === "docker") {
      const result = await ssh.execCommand("docker stop openclaw");
      if (result.stderr && !result.stderr.includes("openclaw")) {
        throw new Error(result.stderr);
      }
      return { success: true };
    }

    // Check if running
    if (!(await isProcessRunning(ssh))) {
      return { success: true };
    }

    // Try systemd first — this properly stops AND prevents auto-restart
    const serviceName = await findSystemdService(ssh);
    if (serviceName) {
      await ssh.execCommand(`systemctl stop ${serviceName}`);
      await ssh.execCommand("sleep 2");

      const check = await ssh.execCommand(
        `systemctl is-active ${serviceName} 2>/dev/null`
      );
      if (check.stdout.trim() !== "active") {
        return { success: true };
      }
      // If systemctl stop didn't work, fall through to pkill
    }

    // Fallback: SIGTERM
    await ssh.execCommand('pkill -f "openclaw" 2>/dev/null || true');
    await ssh.execCommand('pkill -f "open-claw" 2>/dev/null || true');
    await ssh.execCommand("sleep 2");

    if (await isProcessRunning(ssh)) {
      // Force kill
      await ssh.execCommand('pkill -9 -f "openclaw" 2>/dev/null || true');
      await ssh.execCommand('pkill -9 -f "open-claw" 2>/dev/null || true');
      await ssh.execCommand("sleep 1");

      if (await isProcessRunning(ssh)) {
        throw new Error(
          "Failed to stop OpenClaw — process may be managed by a supervisor that auto-restarts it"
        );
      }
    }

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

export async function restartOpenClaw(creds: VPSCredentials) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);

    if (runtime === "docker") {
      const result = await ssh.execCommand("docker restart openclaw");
      if (result.stderr && !result.stderr.includes("openclaw")) {
        throw new Error(result.stderr);
      }
      return { success: true };
    }

    // Try systemd restart
    const serviceName = await findSystemdService(ssh);
    if (serviceName) {
      await ssh.execCommand(`systemctl restart ${serviceName}`);
      await ssh.execCommand("sleep 2");

      const check = await ssh.execCommand(
        `systemctl is-active ${serviceName} 2>/dev/null`
      );
      if (check.stdout.trim() === "active") {
        return { success: true };
      }
      throw new Error(`Failed to restart service ${serviceName}`);
    }

    // No systemd — manual stop + start
    if (await isProcessRunning(ssh)) {
      await ssh.execCommand('pkill -f "openclaw" 2>/dev/null || true');
      await ssh.execCommand('pkill -f "open-claw" 2>/dev/null || true');
      await ssh.execCommand("sleep 2");

      if (await isProcessRunning(ssh)) {
        await ssh.execCommand('pkill -9 -f "openclaw" 2>/dev/null || true');
        await ssh.execCommand('pkill -9 -f "open-claw" 2>/dev/null || true');
        await ssh.execCommand("sleep 1");
      }
    }

    const whichResult = await ssh.execCommand(
      "which openclaw 2>/dev/null || which open-claw 2>/dev/null"
    );
    const binary = whichResult.stdout.trim();
    if (!binary) {
      throw new Error("OpenClaw binary not found on the server");
    }

    const result = await ssh.execCommand(
      `nohup ${binary} > /var/log/openclaw.log 2>&1 & echo $!`
    );
    if (!result.stdout.trim()) {
      throw new Error("Failed to restart OpenClaw process");
    }

    await ssh.execCommand("sleep 2");
    if (!(await isProcessRunning(ssh))) {
      throw new Error("OpenClaw process exited immediately after restart");
    }

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

// Find the OpenClaw data directory on the VPS
async function findDataDir(
  ssh: NodeSSH,
  runtime: "docker" | "native"
): Promise<string> {
  if (runtime === "docker") {
    return "/data";
  }

  // Check common data directory locations
  const candidates = [
    "/opt/openclaw/data",
    "/var/lib/openclaw/data",
    "/var/lib/openclaw",
    "/opt/openclaw",
  ];

  for (const dir of candidates) {
    const check = await ssh.execCommand(`test -d ${dir} && echo exists`);
    if (check.stdout.trim() === "exists") {
      return dir;
    }
  }

  // Check if openclaw home directory has a data dir
  const homeResult = await ssh.execCommand(
    'eval echo ~$(ps aux | grep -iE "(openclaw|open-claw)" | grep -v grep | head -1 | awk \'{print $1}\') 2>/dev/null'
  );
  const homeDir = homeResult.stdout.trim();
  if (homeDir && homeDir !== "~") {
    const check = await ssh.execCommand(
      `test -d ${homeDir}/data && echo exists`
    );
    if (check.stdout.trim() === "exists") {
      return `${homeDir}/data`;
    }
  }

  // Default: create at /opt/openclaw/data
  await ssh.execCommand("mkdir -p /opt/openclaw/data");
  return "/opt/openclaw/data";
}

// Sanitize agent name for use as directory name
function sanitizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function deployAgent(
  creds: VPSCredentials,
  agentName: string,
  configFiles: Record<string, string>
) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);
    const dataDir = await findDataDir(ssh, runtime);
    const safeName = sanitizeAgentName(agentName);
    const agentDir = `${dataDir}/agents/${safeName}`;

    if (runtime === "docker") {
      // Create agent directory inside container
      await ssh.execCommand(
        `docker exec openclaw mkdir -p ${agentDir}`
      );

      // Write each config file
      for (const [filename, content] of Object.entries(configFiles)) {
        const safeContent = content.replace(/'/g, "'\\''");
        await ssh.execCommand(
          `docker exec openclaw sh -c 'cat > ${agentDir}/${filename} << '"'"'AGENTEOF'"'"'\n${safeContent}\nAGENTEOF'`
        );
      }

      // Restart to pick up new agent
      await ssh.execCommand("docker restart openclaw");
    } else {
      // Native: create directory and write files directly
      await ssh.execCommand(`mkdir -p ${agentDir}`);

      for (const [filename, content] of Object.entries(configFiles)) {
        const safeContent = content.replace(/'/g, "'\\''");
        await ssh.execCommand(
          `cat > ${agentDir}/${filename} << 'AGENTEOF'\n${safeContent}\nAGENTEOF`
        );
      }

      // Restart OpenClaw
      const serviceName = await findSystemdService(ssh);
      if (serviceName) {
        await ssh.execCommand(`systemctl restart ${serviceName}`);
      }
    }

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

export async function undeployAgent(
  creds: VPSCredentials,
  agentName: string
) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);
    const dataDir = await findDataDir(ssh, runtime);
    const safeName = sanitizeAgentName(agentName);
    const agentDir = `${dataDir}/agents/${safeName}`;

    if (runtime === "docker") {
      await ssh.execCommand(
        `docker exec openclaw rm -rf ${agentDir}`
      );
      await ssh.execCommand("docker restart openclaw");
    } else {
      await ssh.execCommand(`rm -rf ${agentDir}`);

      const serviceName = await findSystemdService(ssh);
      if (serviceName) {
        await ssh.execCommand(`systemctl restart ${serviceName}`);
      }
    }

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

// Map UI channel type to OpenClaw config key
const CHANNEL_CONFIG_KEY: Record<string, string> = {
  whatsapp: "whatsapp",
  telegram: "telegram",
  discord: "discord",
  slack: "slack",
  signal: "signal",
  teams: "msteams",
  webchat: "webchat",
};

// Map UI credential field names to OpenClaw config field names
const CREDENTIAL_FIELD_MAP: Record<string, Record<string, string>> = {
  telegram: { bot_token: "botToken" },
  discord: { bot_token: "token" },
  slack: { bot_token: "botToken", app_token: "appToken" },
  teams: { app_id: "appId", app_password: "appPassword", tenant_id: "tenantId" },
};

// Find the OpenClaw config file path
async function findConfigPath(
  ssh: NodeSSH,
  runtime: "docker" | "native"
): Promise<string> {
  if (runtime === "docker") {
    // Docker: HOME is /home/node
    return "/home/node/.openclaw/openclaw.json";
  }

  // Native: find the user running openclaw
  const userResult = await ssh.execCommand(
    'ps aux | grep -iE "(openclaw|open-claw)" | grep -v grep | head -1 | awk \'{print $1}\''
  );
  const procUser = userResult.stdout.trim() || "root";
  const homeResult = await ssh.execCommand(`eval echo ~${procUser}`);
  const home = homeResult.stdout.trim() || "/root";
  return `${home}/.openclaw/openclaw.json`;
}

// Read and parse the OpenClaw config
async function readOpenClawConfig(
  ssh: NodeSSH,
  runtime: "docker" | "native"
): Promise<Record<string, any>> {
  const configPath = await findConfigPath(ssh, runtime);

  let raw: string;
  if (runtime === "docker") {
    const result = await ssh.execCommand(
      `docker exec openclaw cat ${configPath} 2>/dev/null`
    );
    raw = result.stdout.trim();
  } else {
    const result = await ssh.execCommand(`cat ${configPath} 2>/dev/null`);
    raw = result.stdout.trim();
  }

  if (!raw) return {};

  // Strip single-line comments (// ...) and trailing commas for JSON5 compat
  const cleaned = raw
    .replace(/\/\/.*$/gm, "")
    .replace(/,\s*([\]}])/g, "$1");

  try {
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

// Write the OpenClaw config back (hot-reloads automatically, no restart needed)
async function writeOpenClawConfig(
  ssh: NodeSSH,
  runtime: "docker" | "native",
  config: Record<string, any>
) {
  const configPath = await findConfigPath(ssh, runtime);
  const configStr = JSON.stringify(config, null, 2);
  const safeContent = configStr.replace(/'/g, "'\\''");

  if (runtime === "docker") {
    // Ensure directory exists
    const dir = configPath.substring(0, configPath.lastIndexOf("/"));
    await ssh.execCommand(`docker exec openclaw mkdir -p ${dir}`);
    await ssh.execCommand(
      `docker exec openclaw sh -c 'cat > ${configPath} << '"'"'OCEOF'"'"'\n${safeContent}\nOCEOF'`
    );
  } else {
    const dir = configPath.substring(0, configPath.lastIndexOf("/"));
    await ssh.execCommand(`mkdir -p ${dir}`);
    await ssh.execCommand(
      `cat > ${configPath} << 'OCEOF'\n${safeContent}\nOCEOF`
    );
  }
}

export async function configureChannel(
  creds: VPSCredentials,
  channelType: string,
  credentials: Record<string, string>
) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);
    const config = await readOpenClawConfig(ssh, runtime);

    // Ensure channels section exists
    if (!config.channels) config.channels = {};

    const configKey = CHANNEL_CONFIG_KEY[channelType] || channelType;
    const fieldMap = CREDENTIAL_FIELD_MAP[channelType] || {};

    // Build channel config with mapped field names
    const channelConfig: Record<string, any> = {
      ...(config.channels[configKey] || {}),
      enabled: true,
      dmPolicy: "open",
      allowFrom: ["*"],
    };

    // Map UI credential fields to OpenClaw config fields
    for (const [uiField, value] of Object.entries(credentials)) {
      const mappedField = fieldMap[uiField] || uiField;
      channelConfig[mappedField] = value;
    }

    // Slack-specific: set socket mode
    if (channelType === "slack") {
      channelConfig.mode = "socket";
    }

    config.channels[configKey] = channelConfig;
    await writeOpenClawConfig(ssh, runtime, config);

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

export async function removeChannel(
  creds: VPSCredentials,
  channelType: string
) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);
    const config = await readOpenClawConfig(ssh, runtime);

    if (!config.channels) return { success: true };

    const configKey = CHANNEL_CONFIG_KEY[channelType] || channelType;

    if (config.channels[configKey]) {
      config.channels[configKey].enabled = false;
      await writeOpenClawConfig(ssh, runtime, config);
    }

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

export async function enableDashboardEmbedding(
  creds: VPSCredentials,
  allowedOrigins: string[] = ["https://app.clawhq.tech"]
) {
  const ssh = await connect(creds);
  try {
    // Check if Nginx is installed
    const nginxCheck = await ssh.execCommand("which nginx 2>/dev/null");
    if (!nginxCheck.stdout.trim()) {
      throw new Error("Nginx is not installed on this server");
    }

    // Find the OpenClaw Nginx config
    const configPaths = [
      "/etc/nginx/sites-available/openclaw",
      "/etc/nginx/sites-available/default",
    ];

    let configPath = "";
    for (const path of configPaths) {
      const check = await ssh.execCommand(`test -f ${path} && echo exists`);
      if (check.stdout.trim() === "exists") {
        configPath = path;
        break;
      }
    }

    if (!configPath) {
      throw new Error("Nginx config for OpenClaw not found");
    }

    // Check if headers are already configured
    const configContent = await ssh.execCommand(`cat ${configPath}`);
    if (configContent.stdout.includes("proxy_hide_header X-Frame-Options")) {
      return { success: true, alreadyConfigured: true };
    }

    // Build the frame-ancestors value
    const origins = ["'self'", ...allowedOrigins].join(" ");

    // Add iframe headers after proxy_pass line
    await ssh.execCommand(
      `sed -i '/proxy_pass /a\\        proxy_hide_header X-Frame-Options;\\n        proxy_hide_header Content-Security-Policy;\\n        add_header Content-Security-Policy "frame-ancestors ${origins}";' ${configPath}`
    );

    // Test and reload Nginx
    const testResult = await ssh.execCommand("nginx -t 2>&1");
    if (!testResult.stderr?.includes("syntax is ok")) {
      throw new Error("Nginx config test failed after modification");
    }

    await ssh.execCommand("systemctl reload nginx");

    return { success: true, alreadyConfigured: false };
  } finally {
    ssh.dispose();
  }
}

export async function enableChatEndpoint(creds: VPSCredentials) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);
    const config = await readOpenClawConfig(ssh, runtime);

    // Enable the chat completions HTTP endpoint
    if (!config.gateway) config.gateway = {};
    if (!config.gateway.http) config.gateway.http = {};
    if (!config.gateway.http.endpoints) config.gateway.http.endpoints = {};
    if (!config.gateway.http.endpoints.chatCompletions) {
      config.gateway.http.endpoints.chatCompletions = {};
    }
    config.gateway.http.endpoints.chatCompletions.enabled = true;

    await writeOpenClawConfig(ssh, runtime, config);

    // Restart gateway to pick up changes
    await ssh.execCommand(
      "systemctl restart openclaw-gateway 2>/dev/null; sleep 3"
    );

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

export async function getOpenClawToken(creds: VPSCredentials): Promise<string> {
  const ssh = await connect(creds);
  try {
    // Method 1: Try the openclaw CLI
    const result = await ssh.execCommand(
      'export PATH="/usr/local/bin:/usr/bin:/root/.local/bin:$PATH" && openclaw config get gateway.auth.token 2>/dev/null'
    );
    const cliToken = result.stdout.trim();
    if (cliToken && !cliToken.includes("error") && !cliToken.includes("not found")) {
      return cliToken;
    }

    // Method 2: Read token from config JSON file directly
    const configPaths = [
      "/root/.openclaw/openclaw.json",
      "/home/node/.openclaw/openclaw.json",
      "/opt/openclaw/openclaw.json",
    ];

    for (const path of configPaths) {
      const readResult = await ssh.execCommand(`cat ${path} 2>/dev/null`);
      const raw = readResult.stdout.trim();
      if (!raw) continue;

      try {
        const cleaned = raw.replace(/\/\/.*$/gm, "").replace(/,\s*([\]}])/g, "$1");
        const config = JSON.parse(cleaned);
        const token = config?.gateway?.auth?.token || config?.gateway?.controlUi?.token;
        if (token) return token;
      } catch {
        continue;
      }
    }

    // Method 3: Check systemd service for config path hints
    const journalResult = await ssh.execCommand(
      'journalctl -u openclaw-gateway --no-pager -n 50 2>/dev/null | grep -i "token\\|auth" | head -5'
    );
    throw new Error("Could not find auth token in any config location");
  } finally {
    ssh.dispose();
  }
}

export async function getOpenClawLogs(
  creds: VPSCredentials,
  lines: number = 100
) {
  const ssh = await connect(creds);
  try {
    const runtime = await detectRuntime(ssh);

    if (runtime === "docker") {
      const result = await ssh.execCommand(
        `docker logs openclaw --tail ${lines} 2>&1`
      );
      return result.stdout || result.stderr || "No logs available";
    }

    // For systemd services, journalctl is the primary log source
    const serviceName = await findSystemdService(ssh);
    if (serviceName) {
      const result = await ssh.execCommand(
        `journalctl -u ${serviceName} --no-pager -n ${lines} 2>/dev/null`
      );
      const logs = result.stdout.trim();
      if (logs && logs !== "-- No entries --") {
        return logs;
      }
    }

    // Fallback: check common log file locations
    const logPaths = [
      "/var/log/openclaw/openclaw.log",
      "/opt/openclaw/logs/openclaw.log",
      "/var/log/openclaw.log",
    ];

    for (const logPath of logPaths) {
      const result = await ssh.execCommand(
        `test -s ${logPath} && tail -n ${lines} ${logPath} 2>/dev/null`
      );
      const logs = result.stdout.trim();
      if (logs) {
        return logs;
      }
    }

    // Last resort: grep syslog
    const syslog = await ssh.execCommand(
      `grep -iE "(openclaw|open-claw)" /var/log/syslog 2>/dev/null | tail -n ${lines}`
    );
    if (syslog.stdout.trim()) {
      return syslog.stdout.trim();
    }

    return "No logs available";
  } finally {
    ssh.dispose();
  }
}

// Update the HTTP Basic Auth password on the VPS nginx
export async function updateDashboardPassword(
  creds: VPSCredentials,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const ssh = await connect(creds);
  try {
    // Install apache2-utils if not present (for htpasswd command)
    await ssh.execCommand(
      "command -v htpasswd >/dev/null || apt-get install -y apache2-utils 2>/dev/null"
    );

    // Update htpasswd file (-cb = create file + batch mode)
    const result = await ssh.execCommand(
      `htpasswd -cb /etc/nginx/.htpasswd '${username.replace(/'/g, "'\\''")}' '${password.replace(/'/g, "'\\''")}'`
    );

    if (result.code !== null && result.code !== 0) {
      return { success: false, error: result.stderr?.trim() || "Failed to update htpasswd" };
    }

    // Reload nginx to pick up changes
    await ssh.execCommand("nginx -t 2>&1 && systemctl reload nginx");

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

// Enable HTTP Basic Auth on nginx for existing VPS that were deployed before auth feature
export async function enableBasicAuth(
  creds: VPSCredentials,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const ssh = await connect(creds);
  try {
    // Install apache2-utils if needed
    await ssh.execCommand(
      "command -v htpasswd >/dev/null || apt-get install -y apache2-utils 2>/dev/null"
    );

    // Find nginx config
    const configPaths = [
      "/etc/nginx/sites-available/openclaw",
      "/etc/nginx/sites-available/default",
    ];

    let configPath = "";
    for (const path of configPaths) {
      const check = await ssh.execCommand(`test -f ${path} && echo exists`);
      if (check.stdout.trim() === "exists") {
        configPath = path;
        break;
      }
    }

    if (!configPath) {
      return { success: false, error: "Nginx config not found" };
    }

    // Check if auth_basic is already configured
    const configContent = await ssh.execCommand(`cat ${configPath}`);
    if (configContent.stdout.includes("auth_basic")) {
      // Already has auth — just update htpasswd
      const htResult = await ssh.execCommand(
        `htpasswd -cb /etc/nginx/.htpasswd '${username.replace(/'/g, "'\\''")}' '${password.replace(/'/g, "'\\''")}'`
      );
      if (htResult.code !== null && htResult.code !== 0) {
        return { success: false, error: htResult.stderr?.trim() || "Failed to update htpasswd" };
      }
      await ssh.execCommand("nginx -t 2>&1 && systemctl reload nginx");
      return { success: true };
    }

    // Add auth_basic directives after proxy_pass line
    await ssh.execCommand(
      `sed -i '/proxy_pass /a\\        auth_basic "Dashboard";\\n        auth_basic_user_file /etc/nginx/.htpasswd;' ${configPath}`
    );

    // Create htpasswd file
    const htResult = await ssh.execCommand(
      `htpasswd -cb /etc/nginx/.htpasswd '${username.replace(/'/g, "'\\''")}' '${password.replace(/'/g, "'\\''")}'`
    );
    if (htResult.code !== null && htResult.code !== 0) {
      return { success: false, error: htResult.stderr?.trim() || "Failed to create htpasswd" };
    }

    // Test and reload nginx
    const testResult = await ssh.execCommand("nginx -t 2>&1");
    if (testResult.stderr && !testResult.stderr.includes("syntax is ok")) {
      // Rollback: remove auth_basic lines
      await ssh.execCommand(
        `sed -i '/auth_basic/d' ${configPath}`
      );
      return { success: false, error: "Nginx config test failed after adding auth" };
    }

    await ssh.execCommand("systemctl reload nginx");
    return { success: true };
  } finally {
    ssh.dispose();
  }
}

// OpenClaw provider config mapping
// providerKey = name used in openclaw.json models.providers section
// api = the API protocol OpenClaw uses to talk to the provider
const PROVIDER_OPENCLAW_CONFIG: Record<string, { providerKey: string; api: string }> = {
  ollama:     { providerKey: "model-clawhq",  api: "openai-completions" },
  anthropic:  { providerKey: "anthropic",     api: "anthropic" },
  openai:     { providerKey: "openai",        api: "openai" },
  google:     { providerKey: "google",        api: "google" },
  groq:       { providerKey: "groq",          api: "openai-completions" },
  mistral:    { providerKey: "mistral",       api: "openai-completions" },
  deepseek:   { providerKey: "deepseek",      api: "openai-completions" },
  openrouter: { providerKey: "openrouter",    api: "openai-completions" },
};

// Configure API keys on VPS by writing the complete openclaw.json
// Based on the verified working manual setup
export async function configureApiKeys(
  creds: VPSCredentials,
  keys: { provider: string; apiKey: string; baseUrl?: string }[],
  gatewayInfo: {
    hostname: string;
    email: string;
    appUrl: string;
    modelName?: string;
    contextLimit?: number;
  }
): Promise<{ success: boolean; error?: string; debug?: string }> {
  const ssh = await connect(creds);
  try {
    const debugLines: string[] = [];

    // 1. Read current openclaw.json to preserve gateway section
    const readResult = await ssh.execCommand("cat /root/.openclaw/openclaw.json 2>/dev/null");
    let existingConfig: Record<string, any> = {};
    if (readResult.stdout?.trim()) {
      try {
        const cleaned = readResult.stdout
          .replace(/\/\/.*$/gm, "")
          .replace(/,\s*([\]}])/g, "$1");
        existingConfig = JSON.parse(cleaned);
      } catch {
        existingConfig = {};
      }
    }

    // 2. Preserve or rebuild gateway section
    const gateway = existingConfig.gateway || {
      mode: "local",
      bind: "loopback",
      trustedProxies: ["127.0.0.1", "::1"],
      auth: {
        mode: "trusted-proxy",
        trustedProxy: { userHeader: "x-forwarded-user" },
      },
      controlUi: {
        allowedOrigins: [
          `https://${gatewayInfo.hostname}`,
          `http://${gatewayInfo.hostname}`,
          gatewayInfo.appUrl,
        ],
        dangerouslyDisableDeviceAuth: true,
        allowInsecureAuth: true,
      },
    };

    // Ensure chat completions endpoint is always enabled
    if (!gateway.http) gateway.http = {};
    if (!gateway.http.endpoints) gateway.http.endpoints = {};
    if (!gateway.http.endpoints.chatCompletions) gateway.http.endpoints.chatCompletions = {};
    gateway.http.endpoints.chatCompletions.enabled = true;

    // 3. Build models.providers from API keys
    const providers: Record<string, any> = {};
    let primaryModel = "";

    for (const key of keys) {
      const ocConfig = PROVIDER_OPENCLAW_CONFIG[key.provider] || {
        providerKey: key.provider,
        api: "openai-completions",
      };

      const providerEntry: any = {
        apiKey: key.apiKey,
        api: ocConfig.api,
      };

      if (key.baseUrl) {
        providerEntry.baseUrl = key.baseUrl.trim();
      }

      // Add model definition
      const modelId = gatewayInfo.modelName || "default";
      providerEntry.models = [
        {
          id: modelId,
          name: modelId,
          reasoning: false,
          input: ["text", "image"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: gatewayInfo.contextLimit || 128000,
          maxTokens: 32000,
        },
      ];

      providers[ocConfig.providerKey] = providerEntry;

      if (!primaryModel) {
        primaryModel = `${ocConfig.providerKey}/${modelId}`;
      }
    }

    // 4. Build the complete config (matching verified working format)
    const fullConfig: Record<string, any> = {
      gateway,
      models: { providers },
      agents: {
        defaults: {
          model: { primary: primaryModel },
        },
      },
    };

    debugLines.push(`Model: ${primaryModel}`);
    debugLines.push(`Providers: ${Object.keys(providers).join(", ")}`);

    // 5. Write via base64 (safe for all characters)
    const configContent = JSON.stringify(fullConfig, null, 2);
    const configB64 = Buffer.from(configContent).toString("base64");
    const writeResult = await ssh.execCommand(
      [
        "mkdir -p /root/.openclaw && chmod 700 /root/.openclaw",
        `echo '${configB64}' | base64 -d > /root/.openclaw/openclaw.json`,
        "chmod 600 /root/.openclaw/openclaw.json",
      ].join(" && ")
    );

    if (writeResult.code !== null && writeResult.code !== 0) {
      return { success: false, error: writeResult.stderr?.trim() || "Failed to write config" };
    }

    // 6. Verify written config
    const verifyResult = await ssh.execCommand("cat /root/.openclaw/openclaw.json");
    debugLines.push(verifyResult.stdout?.trim() || "");

    // 7. Restart gateway
    const restartResult = await ssh.execCommand(
      "systemctl restart openclaw-gateway && sleep 5 && systemctl is-active openclaw-gateway 2>/dev/null || echo 'restart-failed'"
    );
    const restartStatus = restartResult.stdout?.trim() || "unknown";
    debugLines.push(`Gateway: ${restartStatus}`);

    return { success: true, debug: debugLines.join("\n") };
  } finally {
    ssh.dispose();
  }
}

// Enable auto-restart health check on existing VPS
export async function enableAutoRestart(
  creds: VPSCredentials
): Promise<{ success: boolean; error?: string }> {
  const ssh = await connect(creds);
  try {
    // 1. Upgrade systemd service to Restart=always
    const upgradeCmd = [
      "sed -i 's/Restart=on-failure/Restart=always/' /etc/systemd/system/openclaw-gateway.service 2>/dev/null || true",
      // Add StartLimitIntervalSec if not present
      "grep -q StartLimitIntervalSec /etc/systemd/system/openclaw-gateway.service || sed -i '/\\[Service\\]/a StartLimitIntervalSec=300\\nStartLimitBurst=5' /etc/systemd/system/openclaw-gateway.service",
    ].join(" && ");
    await ssh.execCommand(upgradeCmd);

    // 2. Write health check script
    const script = `#!/bin/bash
if ! curl -sf --max-time 5 http://127.0.0.1:18789/ > /dev/null 2>&1; then
  echo "[health-check] Gateway unresponsive, restarting..."
  systemctl restart openclaw-gateway
fi`;
    const scriptB64 = Buffer.from(script).toString("base64");
    await ssh.execCommand(
      `echo '${scriptB64}' | base64 -d > /usr/local/bin/openclaw-health-check.sh && chmod +x /usr/local/bin/openclaw-health-check.sh`
    );

    // 3. Write systemd timer + service
    const timerService = `[Unit]
Description=OpenClaw Gateway Health Check

[Service]
Type=oneshot
ExecStart=/usr/local/bin/openclaw-health-check.sh`;

    const timer = `[Unit]
Description=Run OpenClaw health check every 2 minutes

[Timer]
OnBootSec=60
OnUnitActiveSec=120

[Install]
WantedBy=timers.target`;

    const svcB64 = Buffer.from(timerService).toString("base64");
    const timerB64 = Buffer.from(timer).toString("base64");

    await ssh.execCommand(
      [
        `echo '${svcB64}' | base64 -d > /etc/systemd/system/openclaw-health-check.service`,
        `echo '${timerB64}' | base64 -d > /etc/systemd/system/openclaw-health-check.timer`,
        "systemctl daemon-reload",
        "systemctl enable --now openclaw-health-check.timer",
      ].join(" && ")
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  } finally {
    ssh.dispose();
  }
}
