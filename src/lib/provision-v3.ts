import { NodeSSH } from "node-ssh";

export interface ProvisionConfig {
  ip: string;
  sshUser: string;
  sshPassword: string;
  sshPort?: number;
  hostname: string;
  email: string;
  appUrl: string;
  dashboardUsername?: string;
  dashboardPassword?: string;
}

export interface ProvisionStep {
  step: number;
  label: string;
  status: "pending" | "running" | "done" | "error";
  output?: string;
}

export type OnProgress = (step: ProvisionStep) => void;

// Steps 2-11 (steps 0-1 handled in route.ts: DNS + Firewall)
const STEPS = [
  "Test SSH",                  // step 2 (index 0)
  "Prepare system",            // step 3
  "Install Docker",            // step 4
  "Pull OpenClaw image",       // step 5
  "Write gateway config",      // step 6
  "Start container",           // step 7
  "Generate SSL certificate",  // step 8
  "Install Nginx",             // step 9
  "Configure Nginx",           // step 10
  "Verify",                    // step 11
];

async function runStep(
  ssh: NodeSSH,
  stepNum: number,
  cmd: string,
  onProgress: OnProgress
): Promise<string> {
  const label = STEPS[stepNum - 2];
  console.log(`[Provision] Step ${stepNum}: ${label}...`);
  onProgress({ step: stepNum, label, status: "running" });

  // Prepend comprehensive PATH — SSH exec sessions have minimal PATH
  // that often misses /usr/sbin (nginx), /usr/local/bin, etc.
  const fullCmd = `export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH" && ${cmd}`;
  const result = await ssh.execCommand(fullCmd);

  if (result.code !== null && result.code !== 0) {
    const errMsg =
      result.stderr?.trim() || result.stdout?.trim() || "Command failed";
    console.error(`[Provision] ✗ Step ${stepNum} FAILED: ${errMsg}`);
    if (result.stderr) console.error(`[Provision]   stderr: ${result.stderr.trim()}`);
    if (result.stdout) console.error(`[Provision]   stdout: ${result.stdout.trim()}`);
    onProgress({ step: stepNum, label, status: "error", output: errMsg });
    throw new Error(`Step ${stepNum} (${label}) failed: ${errMsg}`);
  }

  // Combine stdout + stderr for full visibility
  const stdout = result.stdout?.trim() || "";
  const stderr = result.stderr?.trim() || "";
  const output = stdout || stderr;
  const lastLine = output.split("\n").pop() || "";
  console.log(`[Provision] ✓ Step ${stepNum}: ${label} — ${lastLine}`);
  if (stderr) console.log(`[Provision]   (stderr): ${stderr.split("\n").pop()}`);
  onProgress({ step: stepNum, label, status: "done", output });
  return output;
}

export async function provisionVPS(
  config: ProvisionConfig,
  onProgress: OnProgress
): Promise<{ success: boolean; error?: string }> {
  let ssh: NodeSSH | null = null;

  try {
    console.log("[Provision] === PROVISION V4 (Docker) ===");
    // Step 2: Test SSH
    console.log(`[Provision] Starting provisioning for ${config.hostname} (${config.ip})`);
    onProgress({ step: 2, label: STEPS[0], status: "running" });
    ssh = new NodeSSH();
    await ssh.connect({
      host: config.ip,
      username: config.sshUser,
      password: config.sshPassword,
      port: config.sshPort || 22,
      readyTimeout: 15000,
    });
    const whoami = await ssh.execCommand("whoami");
    console.log(`[Provision] ✓ Step 2: Test SSH — Connected as ${whoami.stdout.trim()}`);
    onProgress({
      step: 2,
      label: STEPS[0],
      status: "done",
      output: `Connected as ${whoami.stdout.trim()}`,
    });

    // Step 3: Prepare system — kill stale apt/dpkg locks, update package list
    await runStep(
      ssh,
      3,
      [
        "pkill -f 'apt|dpkg' 2>/dev/null || true",
        "rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock",
        "dpkg --configure -a 2>/dev/null || true",
        "export DEBIAN_FRONTEND=noninteractive",
        "apt-get update -qq",
        "echo 'System ready'",
      ].join(" && "),
      onProgress
    );

    // Step 4: Install Docker Engine
    await runStep(
      ssh,
      4,
      [
        "export DEBIAN_FRONTEND=noninteractive",
        // Check if Docker is already installed
        "if command -v docker >/dev/null 2>&1; then echo 'Docker already installed'; docker --version; else " +
          "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && " +
          "sh /tmp/get-docker.sh && " +
          "rm -f /tmp/get-docker.sh; fi",
        "systemctl enable docker",
        "systemctl start docker",
        "docker --version",
      ].join(" && "),
      onProgress
    );

    // Step 5: Pull OpenClaw Docker image
    await runStep(
      ssh,
      5,
      [
        "docker pull openclaw/openclaw:latest",
        "docker images openclaw/openclaw --format '{{.Repository}}:{{.Tag}} ({{.Size}})'",
      ].join(" && "),
      onProgress
    );

    // Step 6: Write gateway config to host volume path
    // CRITICAL: bind must be "0.0.0.0" for Docker (not "loopback")
    // Security: -p 127.0.0.1:18789:18789 ensures port only exposed on host localhost
    const gatewayConfig = JSON.stringify(
      {
        gateway: {
          mode: "local",
          bind: "0.0.0.0",
          trustedProxies: ["127.0.0.1", "::1"],
          auth: {
            mode: "trusted-proxy",
            trustedProxy: {
              userHeader: "x-forwarded-user",
            },
          },
          http: {
            endpoints: {
              chatCompletions: { enabled: true },
            },
          },
          controlUi: {
            allowedOrigins: [
              `https://${config.hostname}`,
              `http://${config.hostname}`,
              config.appUrl,
            ],
            dangerouslyDisableDeviceAuth: true,
            allowInsecureAuth: true,
          },
        },
      },
      null,
      2
    );
    const configB64 = Buffer.from(gatewayConfig).toString("base64");

    await runStep(
      ssh,
      6,
      [
        "mkdir -p /opt/openclaw/config /opt/openclaw/data",
        "chmod 700 /opt/openclaw",
        `echo '${configB64}' | base64 -d > /opt/openclaw/config/openclaw.json`,
        "chmod 600 /opt/openclaw/config/openclaw.json",
        "echo 'Config written to /opt/openclaw/config/openclaw.json'",
      ].join(" && "),
      onProgress
    );

    // Step 7: Start OpenClaw container
    // Remove any existing container first (idempotent)
    await runStep(
      ssh,
      7,
      [
        "docker rm -f openclaw 2>/dev/null || true",
        "docker run -d " +
          "--name openclaw " +
          "--restart=always " +
          "-p 127.0.0.1:18789:18789 " +
          "-v /opt/openclaw/config:/home/node/.openclaw " +
          "-v /opt/openclaw/data:/data " +
          "openclaw/openclaw:latest",
        "sleep 5",
        // Verify container is running
        "docker inspect openclaw --format '{{.State.Status}}' | grep -q running && echo 'Container running'",
        // Wait for gateway to respond (up to 30s)
        '(for i in $(seq 1 15); do curl -sf http://127.0.0.1:18789/ > /dev/null && echo "Gateway running on port 18789" && exit 0; sleep 2; done; echo "Gateway not responding"; exit 1)',
      ].join(" && "),
      onProgress
    );

    // Step 8: Generate self-signed SSL certificate (for Cloudflare Full mode)
    await runStep(
      ssh,
      8,
      [
        `openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/ssl/private/${config.hostname}.key -out /etc/ssl/certs/${config.hostname}.crt -subj '/CN=${config.hostname}'`,
        "echo 'SSL certificate generated'",
      ].join(" && "),
      onProgress
    );

    // Step 9: Install Nginx — use a script to avoid cross-step PATH/env issues
    const nginxInstallScript = [
      "#!/bin/bash",
      "set -e",
      "export DEBIAN_FRONTEND=noninteractive",
      "export NEEDRESTART_MODE=a",
      "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH",
      "",
      "# Kill needrestart/debconf locks",
      "pkill -9 -f needrestart 2>/dev/null || true",
      "pkill -9 -f 'perl.*needrestart' 2>/dev/null || true",
      "rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock 2>/dev/null || true",
      "dpkg --configure -a 2>/dev/null || true",
      "while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 2; done",
      "",
      "# Clean install nginx",
      "apt-get purge -y nginx nginx-common nginx-core nginx-full 2>/dev/null || true",
      "apt-get update -qq",
      "apt-get install -y nginx apache2-utils",
      "",
      "# Verify",
      'echo "PATH=$PATH"',
      'echo "which nginx: $(which nginx 2>&1)"',
      'echo "dpkg: $(dpkg -l nginx 2>&1 | grep nginx | head -1)"',
      "ls -la /usr/sbin/nginx 2>&1 || echo '/usr/sbin/nginx not found'",
      "nginx -v 2>&1",
    ].join("\n");
    const installB64 = Buffer.from(nginxInstallScript).toString("base64");

    await runStep(
      ssh,
      9,
      `echo '${installB64}' | base64 -d > /tmp/install-nginx.sh && chmod +x /tmp/install-nginx.sh && bash /tmp/install-nginx.sh`,
      onProgress
    );

    // Step 10: Configure Nginx — write config via base64 and apply
    const authDirectives = config.dashboardUsername && config.dashboardPassword
      ? [
          '        auth_basic "OpenClaw Dashboard";',
          "        auth_basic_user_file /etc/nginx/.htpasswd;",
          "",
        ]
      : [];

    const nginxConf = [
      "server {",
      "    listen 80;",
      "    listen 443 ssl;",
      `    server_name ${config.hostname};`,
      "",
      `    ssl_certificate /etc/ssl/certs/${config.hostname}.crt;`,
      `    ssl_certificate_key /etc/ssl/private/${config.hostname}.key;`,
      "",
      "    location / {",
      ...authDirectives,
      "        proxy_pass http://127.0.0.1:18789;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Upgrade $http_upgrade;",
      '        proxy_set_header Connection "upgrade";',
      "        proxy_set_header Host $host;",
      "        proxy_set_header X-Real-IP $remote_addr;",
      "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
      "        proxy_set_header X-Forwarded-Proto $scheme;",
      `        proxy_set_header X-Forwarded-User "${config.email}";`,
      "        proxy_read_timeout 86400;",
      "        proxy_send_timeout 86400;",
      "    }",
      "}",
    ].join("\n");
    const nginxConfB64 = Buffer.from(nginxConf).toString("base64");

    // Build htpasswd creation command if credentials provided
    const htpasswdCmd = config.dashboardUsername && config.dashboardPassword
      ? `htpasswd -cb /etc/nginx/.htpasswd '${config.dashboardUsername.replace(/'/g, "'\\''")}' '${config.dashboardPassword.replace(/'/g, "'\\''")}'`
      : "echo 'No auth credentials — skipping htpasswd'";

    const nginxConfigScript = [
      "#!/bin/bash",
      "set -e",
      "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH",
      "mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled",
      htpasswdCmd,
      `echo '${nginxConfB64}' | base64 -d > /etc/nginx/sites-available/${config.hostname}`,
      `ln -sf /etc/nginx/sites-available/${config.hostname} /etc/nginx/sites-enabled/`,
      "rm -f /etc/nginx/sites-enabled/default",
      "nginx -t 2>&1",
      "systemctl restart nginx",
      "echo 'Nginx configured'",
    ].join("\n");
    const configScriptB64 = Buffer.from(nginxConfigScript).toString("base64");

    await runStep(
      ssh,
      10,
      `echo '${configScriptB64}' | base64 -d > /tmp/config-nginx.sh && chmod +x /tmp/config-nginx.sh && bash /tmp/config-nginx.sh`,
      onProgress
    );

    // Step 11: Verify — test gateway + nginx locally
    await runStep(
      ssh,
      11,
      [
        "curl -sf http://127.0.0.1:18789/ > /dev/null",
        `curl -sfk https://127.0.0.1/ -H 'Host: ${config.hostname}' > /dev/null`,
        `echo 'Verified: https://${config.hostname} is ready'`,
      ].join(" && "),
      onProgress
    );

    console.log(`[Provision] ✓ COMPLETE — ${config.hostname} provisioned successfully`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Provision] ✗ FAILED — ${err.message}`);
    return { success: false, error: err.message || "Provisioning failed" };
  } finally {
    if (ssh) {
      ssh.dispose();
    }
  }
}
