import { NodeSSH } from "node-ssh";

export interface ProvisionConfig {
  ip: string;
  sshUser: string;
  sshPassword: string;
  sshPort?: number;
  hostname: string;
  email: string;
  appUrl: string;
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
  onProgress({ step: stepNum, label, status: "running" });

  // Prepend comprehensive PATH — SSH exec sessions have minimal PATH
  // that often misses /usr/sbin (nginx), /usr/local/bin (openclaw), etc.
  const fullCmd = `export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH" && ${cmd}`;
  const result = await ssh.execCommand(fullCmd);

  if (result.code !== null && result.code !== 0) {
    const errMsg =
      result.stderr?.trim() || result.stdout?.trim() || "Command failed";
    onProgress({ step: stepNum, label, status: "error", output: errMsg });
    throw new Error(`Step ${stepNum} (${label}) failed: ${errMsg}`);
  }

  const output = result.stdout?.trim() || "";
  onProgress({ step: stepNum, label, status: "done", output });
  return output;
}

export async function provisionVPS(
  config: ProvisionConfig,
  onProgress: OnProgress
): Promise<{ success: boolean; error?: string }> {
  let ssh: NodeSSH | null = null;

  try {
    // Step 2: Test SSH
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
Restart=on-failure
RestartSec=5
Environment=HOME=/root
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
WorkingDirectory=/root

[Install]
WantedBy=multi-user.target`;

    await runStep(
      ssh,
      6,
      `cat > /etc/systemd/system/openclaw-gateway.service << 'SVCEOF'\n${serviceFile}\nSVCEOF\nsystemctl daemon-reload && systemctl enable openclaw-gateway && echo 'Service created and enabled'`,
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

    // Step 9: Install Nginx
    // Kill needrestart + debconf locks aggressively (they silently break apt on Ubuntu 24.04)
    await runStep(
      ssh,
      9,
      [
        "export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a",
        "pkill -9 -f needrestart 2>/dev/null || true",
        "pkill -9 -f 'perl.*needrestart' 2>/dev/null || true",
        "rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock /var/cache/debconf/config.dat 2>/dev/null || true",
        "dpkg --configure -a 2>/dev/null || true",
        "while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 2; done",
        "apt-get purge -y nginx nginx-common nginx-core nginx-full 2>/dev/null || true",
        "apt-get update -qq",
        "apt-get install -y -o Dpkg::Options::='--force-confdef' -o Dpkg::Options::='--force-confold' nginx",
        "echo \"nginx binary: $(which nginx 2>&1)\"",
        "nginx -v 2>&1",
      ].join(" && "),
      onProgress
    );

    // Step 10: Configure Nginx — matches working manual setup
    // Port 80+443 SSL, WebSocket upgrade, X-Forwarded-User for trusted-proxy auth
    // Write config using base64 to avoid heredoc/shell escaping issues
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
    const nginxB64 = Buffer.from(nginxConf).toString("base64");

    await runStep(
      ssh,
      10,
      [
        "mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled",
        `echo '${nginxB64}' | base64 -d > /etc/nginx/sites-available/${config.hostname}`,
        `ln -sf /etc/nginx/sites-available/${config.hostname} /etc/nginx/sites-enabled/`,
        "rm -f /etc/nginx/sites-enabled/default",
        "nginx -t 2>&1",
        "systemctl restart nginx",
        "echo 'Nginx configured'",
      ].join(" && "),
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

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Provisioning failed" };
  } finally {
    if (ssh) {
      ssh.dispose();
    }
  }
}
