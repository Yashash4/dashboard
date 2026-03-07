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
  "Test SSH",                // step 2 (index 0)
  "Prepare system",          // step 3
  "Install OpenClaw",        // step 4
  "Write gateway config",    // step 5
  "Create systemd service",  // step 6
  "Start gateway",           // step 7
  "Generate SSL certificate",// step 8
  "Install Nginx",           // step 9
  "Configure Nginx",         // step 10
  "Verify",                  // step 11
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
  // that often misses /usr/sbin (nginx), /usr/local/bin (openclaw), etc.
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
    // Version marker — if you don't see this in logs, dev server needs restart
    console.log("[Provision] === PROVISION V3 (PATH fix + robust nginx) ===");
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

    // Step 4: Install OpenClaw
    await runStep(
      ssh,
      4,
      [
        "rm -f /usr/local/bin/openclaw /usr/bin/openclaw",
        "(curl -fsSL https://openclaw.ai/install.sh | bash) 2>&1 || true",
        'export PATH="$(npm config get prefix 2>/dev/null)/bin:$HOME/.local/bin:$HOME/.openclaw/bin:$PATH"',
        "OPENCLAW_PATH=$(command -v openclaw 2>/dev/null)",
        'if [ -z "$OPENCLAW_PATH" ]; then npm install -g openclaw@latest 2>&1; export PATH="$(npm config get prefix 2>/dev/null)/bin:$PATH"; OPENCLAW_PATH=$(command -v openclaw 2>/dev/null); fi',
        'if [ -z "$OPENCLAW_PATH" ]; then echo "openclaw binary not found after install"; exit 1; fi',
        'REAL_PATH=$(readlink -f "$OPENCLAW_PATH" 2>/dev/null || echo "$OPENCLAW_PATH")',
        'ln -sf "$REAL_PATH" /usr/bin/openclaw',
        "/usr/bin/openclaw --version",
      ].join(" ; "),
      onProgress
    );

    // Step 5: Write gateway config — matches working manual setup exactly
    const gatewayConfig = JSON.stringify(
      {
        gateway: {
          mode: "local",
          bind: "loopback",
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
    await runStep(
      ssh,
      5,
      `mkdir -p /root/.openclaw && chmod 700 /root/.openclaw && cat > /root/.openclaw/openclaw.json << 'OCEOF'\n${gatewayConfig}\nOCEOF\necho 'Config written'`,
      onProgress
    );

    // Step 6: Create systemd service — matches working manual setup
    const serviceFile = `[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/openclaw gateway run
Restart=always
RestartSec=5
StartLimitIntervalSec=300
StartLimitBurst=5
Environment=HOME=/root
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
WorkingDirectory=/root

[Install]
WantedBy=multi-user.target`;

    // Health check timer — restarts gateway if HTTP endpoint is unresponsive
    const healthCheckScript = `#!/bin/bash
if ! curl -sf --max-time 5 http://127.0.0.1:18789/ > /dev/null 2>&1; then
  echo "[health-check] Gateway unresponsive, restarting..."
  systemctl restart openclaw-gateway
fi`;

    const healthCheckService = `[Unit]
Description=OpenClaw Gateway Health Check

[Service]
Type=oneshot
ExecStart=/usr/local/bin/openclaw-health-check.sh`;

    const healthCheckTimer = `[Unit]
Description=Run OpenClaw health check every 2 minutes

[Timer]
OnBootSec=60
OnUnitActiveSec=120

[Install]
WantedBy=timers.target`;

    await runStep(
      ssh,
      6,
      [
        `cat > /etc/systemd/system/openclaw-gateway.service << 'SVCEOF'\n${serviceFile}\nSVCEOF`,
        `cat > /usr/local/bin/openclaw-health-check.sh << 'HCEOF'\n${healthCheckScript}\nHCEOF`,
        "chmod +x /usr/local/bin/openclaw-health-check.sh",
        `cat > /etc/systemd/system/openclaw-health-check.service << 'HCSEOF'\n${healthCheckService}\nHCSEOF`,
        `cat > /etc/systemd/system/openclaw-health-check.timer << 'HCTEOF'\n${healthCheckTimer}\nHCTEOF`,
        "systemctl daemon-reload",
        "systemctl enable openclaw-gateway openclaw-health-check.timer",
        "systemctl start openclaw-health-check.timer",
        "echo 'Service + health check created and enabled'",
      ].join(" && "),
      onProgress
    );

    // Step 7: Start gateway and verify it's listening
    await runStep(
      ssh,
      7,
      [
        "systemctl restart openclaw-gateway",
        "sleep 3",
        "systemctl is-active openclaw-gateway",
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
    // Write a bash script to the VPS, then execute it
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
      "echo \"PATH=$PATH\"",
      "echo \"which nginx: $(which nginx 2>&1)\"",
      "echo \"dpkg: $(dpkg -l nginx 2>&1 | grep nginx | head -1)\"",
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
    // Include HTTP Basic Auth if credentials are provided
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
    const configB64 = Buffer.from(nginxConfigScript).toString("base64");

    await runStep(
      ssh,
      10,
      `echo '${configB64}' | base64 -d > /tmp/config-nginx.sh && chmod +x /tmp/config-nginx.sh && bash /tmp/config-nginx.sh`,
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
