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
  "Install embedding service", // step 11
  "Install Data API",          // step 12
  "Verify",                    // step 13
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
  // that often misses /usr/sbin (nginx), /usr/local/bin, etc.
  const fullCmd = `export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH" && ${cmd}`;
  const result = await ssh.execCommand(fullCmd);

  if (result.code !== null && result.code !== 0) {
    const errMsg =
      result.stderr?.trim() || result.stdout?.trim() || "Command failed";
    onProgress({ step: stepNum, label, status: "error", output: errMsg });
    throw new Error(`Step ${stepNum} (${label}) failed: ${errMsg}`);
  }

  // Combine stdout + stderr for full visibility
  const stdout = result.stdout?.trim() || "";
  const stderr = result.stderr?.trim() || "";
  const output = stdout || stderr;
  const lastLine = output.split("\n").pop() || "";
  onProgress({ step: stepNum, label, status: "done", output });
  return output;
}

// ADMIN_CRIT_02: Strict subdomain/hostname validation to prevent command injection
function validateHostname(hostname: string): boolean {
  // Only allow alphanumeric, hyphens, and dots (for subdomains like user.clawhq.tech)
  // No leading/trailing hyphens, no consecutive dots, max 253 chars
  return /^(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(?<!-)$/.test(hostname) && hostname.length <= 253;
}

// Shell-safe: escape single quotes for shell arguments
function shellEscape(value: string): string {
  return value.replace(/'/g, "'\\''");
}

export async function provisionVPS(
  config: ProvisionConfig,
  onProgress: OnProgress
): Promise<{ success: boolean; error?: string; gatewayToken?: string; dataApiToken?: string }> {
  let ssh: NodeSSH | null = null;

  try {
    // ADMIN_CRIT_02: Validate hostname before interpolating into shell commands
    if (!validateHostname(config.hostname)) {
      return { success: false, error: `Invalid hostname: ${config.hostname}. Only alphanumeric characters, hyphens, and dots allowed.` };
    }
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
        "docker pull ghcr.io/openclaw/openclaw:latest",
        "docker images openclaw/openclaw --format '{{.Repository}}:{{.Tag}} ({{.Size}})'",
      ].join(" && "),
      onProgress
    );

    // Step 6: Write gateway config to host volume path
    // bind=loopback — safe because we use --network=host (container shares host network)
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
    const configB64 = Buffer.from(gatewayConfig).toString("base64");

    await runStep(
      ssh,
      6,
      [
        "mkdir -p /opt/openclaw/config",
        "chmod 700 /opt/openclaw",
        `echo '${configB64}' | base64 -d > /opt/openclaw/config/openclaw.json`,
        "chmod 600 /opt/openclaw/config/openclaw.json",
        "chown -R 1000:1000 /opt/openclaw",
        "echo 'Config written to /opt/openclaw/config/openclaw.json'",
      ].join(" && "),
      onProgress
    );

    // Step 7: Start OpenClaw container
    // Default CMD (node openclaw.mjs gateway --allow-unconfigured) is correct — do NOT override
    {
      const label = STEPS[7 - 2];
      onProgress({ step: 7, label, status: "running" });

      // Remove old container
      await ssh.execCommand("docker rm -f openclaw 2>/dev/null || true");

      // Start container — host networking so nginx (127.0.0.1) is trusted by gateway
      // No -p port mapping needed with --network=host
      const runCmd = [
        "docker run -d --init",
        "--name openclaw",
        "--restart=unless-stopped",
        "--network=host",
        "-v /opt/openclaw/config:/home/node/.openclaw",
        "ghcr.io/openclaw/openclaw:latest",
      ].join(" ");
      await ssh.execCommand(
        `export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH" && ${runCmd}`
      );

      // Gateway needs ~30s to fully start
      await ssh.execCommand("sleep 30");

      // Check container state
      const inspect = await ssh.execCommand(
        'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
      );
      const state = inspect.stdout?.trim();

      if (state !== "running") {
        const logs = await ssh.execCommand("docker logs openclaw --tail 40 2>&1");
        const logOutput = logs.stdout?.trim() || logs.stderr?.trim() || "no logs";
        const errMsg = `Container state: ${state || "not found"}. Logs:\n${logOutput}`;
        onProgress({ step: 7, label, status: "error", output: errMsg });
        throw new Error(`Step 7 (${label}) failed: ${errMsg}`);
      }

      // Wait for gateway to respond (up to 30s more)
      const healthCheck = await ssh.execCommand(
        '(for i in $(seq 1 15); do curl -sf http://127.0.0.1:18789/ > /dev/null && echo "Gateway running on port 18789" && exit 0; sleep 2; done; docker logs openclaw --tail 20 2>&1; echo "Gateway not responding"; exit 1)'
      );
      if (healthCheck.code !== null && healthCheck.code !== 0) {
        const errMsg = healthCheck.stdout?.trim() || healthCheck.stderr?.trim() || "Gateway not responding";
        onProgress({ step: 7, label, status: "error", output: errMsg });
        throw new Error(`Step 7 (${label}) failed: ${errMsg}`);
      }

      onProgress({ step: 7, label, status: "done", output: healthCheck.stdout?.trim() });
    }

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

    // Step 10: Configure Nginx — Basic Auth for direct access, cookie bypass for iframe
    // The embed key (dashboard password) lets ClawHQ set a cookie to bypass Basic Auth
    const embedKey = config.dashboardPassword || "";

    // Map config goes in http context (conf.d/) — checks query param + cookie
    const mapConf = [
      `map $arg__key $claw_embed_param {`,
      `    "${embedKey}" 1;`,
      `    default 0;`,
      `}`,
      `map $cookie__claw $claw_embed_cookie {`,
      `    "${embedKey}" 1;`,
      `    default 0;`,
      `}`,
      `map "$claw_embed_param:$claw_embed_cookie" $claw_auth_realm {`,
      `    "~1" "off";`,
      `    default "OpenClaw Dashboard";`,
      `}`,
    ].join("\n");

    // Server config — Basic Auth with cookie bypass + auth endpoint
    const nginxConf = [
      "server {",
      "    listen 80;",
      "    listen 443 ssl;",
      `    server_name ${config.hostname};`,
      "",
      `    ssl_certificate /etc/ssl/certs/${config.hostname}.crt;`,
      `    ssl_certificate_key /etc/ssl/private/${config.hostname}.key;`,
      "",
      "    # Auth endpoint — sets embed cookie (no Basic Auth here)",
      "    location = /_claw_auth {",
      "        if ($request_method = 'OPTIONS') {",
      "            add_header 'Access-Control-Allow-Origin' $http_origin always;",
      "            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;",
      "            add_header 'Access-Control-Allow-Credentials' 'true' always;",
      "            add_header 'Access-Control-Max-Age' '86400' always;",
      "            return 204;",
      "        }",
      "        if ($claw_embed_param != '1') {",
      "            return 403;",
      "        }",
      `        add_header 'Set-Cookie' '_claw=${embedKey}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=None; Partitioned' always;`,
      "        add_header 'Access-Control-Allow-Origin' $http_origin always;",
      "        add_header 'Access-Control-Allow-Credentials' 'true' always;",
      "        add_header 'Content-Type' 'text/plain' always;",
      "        return 200 'ok';",
      "    }",
      "",
      "    location / {",
      "        auth_basic $claw_auth_realm;",
      "        auth_basic_user_file /etc/nginx/.htpasswd;",
      "",
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

    const mapConfB64 = Buffer.from(mapConf).toString("base64");
    const nginxConfB64 = Buffer.from(nginxConf).toString("base64");

    // Build htpasswd for Basic Auth
    // ADMIN_MED_04: Sanitize username and password for shell via shellEscape
    const htpasswdCmd = config.dashboardUsername && config.dashboardPassword
      ? `htpasswd -cb /etc/nginx/.htpasswd '${shellEscape(config.dashboardUsername)}' '${shellEscape(config.dashboardPassword)}'`
      : "echo 'No auth credentials — skipping htpasswd'";

    const nginxConfigScript = [
      "#!/bin/bash",
      "set -e",
      "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH",
      "mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/conf.d",
      htpasswdCmd,
      `echo '${mapConfB64}' | base64 -d > /etc/nginx/conf.d/claw-embed.conf`,
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

    // Step 11: Install embedding service for KB RAG
    const embeddingServerJs = [
      'const http = require("http");',
      'let pipeline = null;',
      'async function loadModel() {',
      '  const { pipeline: p } = await import("@xenova/transformers");',
      '  pipeline = await p("feature-extraction", "Xenova/all-MiniLM-L6-v2");',
      '  console.log("Embedding model loaded");',
      '}',
      'const server = http.createServer(async (req, res) => {',
      '  if (req.method === "POST" && req.url === "/embed") {',
      '    let body = "";',
      '    req.on("data", c => body += c);',
      '    req.on("end", async () => {',
      '      try {',
      '        const { texts } = JSON.parse(body);',
      '        if (!Array.isArray(texts)) { res.writeHead(400); res.end("texts must be array"); return; }',
      '        const vectors = [];',
      '        for (const t of texts) {',
      '          const out = await pipeline(t, { pooling: "mean", normalize: true });',
      '          vectors.push(Array.from(out.data));',
      '        }',
      '        res.writeHead(200, { "Content-Type": "application/json" });',
      '        res.end(JSON.stringify({ vectors }));',
      '      } catch (e) { res.writeHead(500); res.end(e.message); }',
      '    });',
      '  } else if (req.method === "GET" && req.url === "/health") {',
      '    res.writeHead(200); res.end("ok");',
      '  } else { res.writeHead(404); res.end("not found"); }',
      '});',
      'loadModel().then(() => server.listen(5555, "127.0.0.1", () => console.log("Embedding service on 127.0.0.1:5555")));',
    ].join("\n");
    const embeddingServerB64 = Buffer.from(embeddingServerJs).toString("base64");

    const embeddingServiceFile = [
      "[Unit]",
      "Description=ClawHQ Embedding Service",
      "After=network.target",
      "",
      "[Service]",
      "Type=simple",
      "User=root",
      "WorkingDirectory=/opt/clawhq-embeddings",
      "ExecStart=/usr/bin/node server.js",
      "Restart=always",
      "RestartSec=5",
      "Environment=NODE_ENV=production",
      "",
      "[Install]",
      "WantedBy=multi-user.target",
    ].join("\n");
    const serviceFileB64 = Buffer.from(embeddingServiceFile).toString("base64");

    const embeddingInstallScript = [
      "#!/bin/bash",
      "set -e",
      "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH",
      "mkdir -p /opt/clawhq-embeddings",
      `echo '${embeddingServerB64}' | base64 -d > /opt/clawhq-embeddings/server.js`,
      "cd /opt/clawhq-embeddings",
      "if [ ! -f package.json ]; then npm init -y > /dev/null 2>&1; fi",
      "npm install @xenova/transformers --save 2>&1 | tail -3",
      `echo '${serviceFileB64}' | base64 -d > /etc/systemd/system/clawhq-embeddings.service`,
      "systemctl daemon-reload",
      "systemctl enable clawhq-embeddings",
      "systemctl restart clawhq-embeddings",
      "sleep 5",
      // Don't fail if model is still downloading — it takes time on first run
      "curl -sf http://127.0.0.1:5555/health > /dev/null 2>&1 && echo 'Embedding service running' || echo 'Embedding service starting (model downloading)'",
    ].join("\n");
    const embeddingScriptB64 = Buffer.from(embeddingInstallScript).toString("base64");

    await runStep(
      ssh,
      11,
      `echo '${embeddingScriptB64}' | base64 -d > /tmp/install-embeddings.sh && chmod +x /tmp/install-embeddings.sh && bash /tmp/install-embeddings.sh`,
      onProgress
    );

    // Step 12: Install Data API (SQLite + Express on port 5556)
    const dataApiToken = require("crypto").randomBytes(32).toString("hex");
    const dataApiFiles = require("./vps-data-api-bundle").getBundle(dataApiToken);
    const dataApiBundleB64 = Buffer.from(dataApiFiles).toString("base64");

    await runStep(
      ssh,
      12,
      `echo '${dataApiBundleB64}' | base64 -d > /tmp/install-data-api.sh && chmod +x /tmp/install-data-api.sh && bash /tmp/install-data-api.sh`,
      onProgress
    );

    // Step 13: Verify — test gateway, nginx (Basic Auth), and embed cookie bypass
    await runStep(
      ssh,
      13,
      [
        "curl -sf http://127.0.0.1:18789/ > /dev/null",
        config.dashboardUsername && config.dashboardPassword
          ? `curl -sfk -u '${config.dashboardUsername}:${config.dashboardPassword}' https://127.0.0.1/ -H 'Host: ${config.hostname}' > /dev/null`
          : `curl -sfk https://127.0.0.1/ -H 'Host: ${config.hostname}' > /dev/null`,
        `curl -sfk --cookie '_claw=${config.dashboardPassword}' https://127.0.0.1/ -H 'Host: ${config.hostname}' > /dev/null`,
        `echo 'Verified: https://${config.hostname} is ready'`,
      ].join(" && "),
      onProgress
    );

    return { success: true, dataApiToken };
  } catch (err: any) {
    return { success: false, error: err.message || "Provisioning failed" };
  } finally {
    if (ssh) {
      ssh.dispose();
    }
  }
}
