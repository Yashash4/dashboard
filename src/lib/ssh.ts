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
    const [cpuResult, memResult, uptimeResult, diskResult] = await Promise.all([
      ssh.execCommand("top -bn1 | grep 'Cpu(s)' | head -1"),
      ssh.execCommand("free -m | grep Mem"),
      ssh.execCommand("cat /proc/uptime"),
      ssh.execCommand("df -BG / | tail -1"),
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

    return {
      cpu_percent: cpuPercent,
      ram_used_mb: ramUsedMb,
      ram_total_mb: ramTotalMb,
      disk_used_gb: diskUsedGb,
      disk_total_gb: diskTotalGb,
      uptime_seconds: uptimeSeconds,
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
