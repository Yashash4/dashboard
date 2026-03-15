/**
 * Generates a bash install script that sets up the ClawHQ Data API
 * on a user's VPS. Called during provisioning.
 */

import * as fs from "fs";
import * as path from "path";

export function getBundle(authToken: string): string {
  const srcDir = path.join(__dirname, "vps-data-api");

  // Read all service files
  const files: Record<string, string> = {};
  const fileList = [
    "package.json",
    "server.js",
    "db.js",
    "auth.js",
    "routes/events.js",
    "routes/sessions.js",
    "routes/activities.js",
    "routes/audit-log.js",
    "routes/analytics.js",
    "routes/kb.js",
    "routes/deliveries.js",
  ];

  for (const f of fileList) {
    const filePath = path.join(srcDir, f);
    if (fs.existsSync(filePath)) {
      files[f] = Buffer.from(fs.readFileSync(filePath, "utf-8")).toString(
        "base64"
      );
    }
  }

  const systemdService = Buffer.from(
    [
      "[Unit]",
      "Description=ClawHQ Data API",
      "After=network.target",
      "",
      "[Service]",
      "Type=simple",
      "User=root",
      "WorkingDirectory=/opt/clawhq-data-api",
      "ExecStart=/usr/bin/node server.js",
      "Restart=always",
      "RestartSec=5",
      `Environment=PORT=5556`,
      `Environment=DB_PATH=/opt/clawhq-data-api/data.db`,
      `EnvironmentFile=/opt/clawhq-data-api/.env`,
      "",
      "[Install]",
      "WantedBy=multi-user.target",
    ].join("\n")
  ).toString("base64");

  // Build install script
  const lines = [
    "#!/bin/bash",
    "set -e",
    'export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"',
    "mkdir -p /opt/clawhq-data-api/routes",
  ];

  // Write each file
  for (const [filePath, b64] of Object.entries(files)) {
    lines.push(`echo '${b64}' | base64 -d > /opt/clawhq-data-api/${filePath}`);
  }

  // Write systemd service
  lines.push(
    `echo '${systemdService}' | base64 -d > /etc/systemd/system/clawhq-data-api.service`
  );

  // Write .env file with token (FIX-20: not in systemd cleartext)
  lines.push(
    `echo 'AUTH_TOKEN=${authToken}' > /opt/clawhq-data-api/.env`,
    "chmod 600 /opt/clawhq-data-api/.env"
  );

  // Install dependencies and start
  lines.push(
    "cd /opt/clawhq-data-api",
    "npm install --production 2>&1 | tail -3",
    "systemctl daemon-reload",
    "systemctl enable clawhq-data-api",
    "systemctl restart clawhq-data-api",
    "sleep 3",
    `curl -sf -H 'Authorization: Bearer ${authToken}' http://127.0.0.1:5556/health > /dev/null && echo 'Data API running' || echo 'Data API starting...'`
  );

  return lines.join("\n");
}
