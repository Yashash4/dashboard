import Link from "next/link";

export default function DocsVPSManagementPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>VPS Management</h1>
      <p className="text-muted-foreground text-lg">
        Your dedicated VPS is the backbone of your ClawHQ deployment. This page covers
        everything you need to know about controlling, monitoring, and maintaining your server.
      </p>

      <h2>Start, Stop, and Restart Controls</h2>
      <p>
        The VPS control panel provides three primary actions for managing your server&apos;s
        lifecycle:
      </p>
      <ul>
        <li><strong>Start</strong> — Powers on your VPS and brings all services online. All deployed agents and connected channels resume operation automatically.</li>
        <li><strong>Stop</strong> — Gracefully shuts down your VPS. All active conversations are terminated, agents go offline, and channels disconnect. Use this only when you need to take your instance fully offline.</li>
        <li><strong>Restart</strong> — Performs a graceful stop followed by an immediate start. This is useful for applying configuration changes or clearing transient issues.</li>
      </ul>
      <p>
        Each action displays a confirmation dialog before executing. The current VPS state
        is shown as a colored badge: <strong>Running</strong> (green),{" "}
        <strong>Stopped</strong> (red), or <strong>Restarting</strong> (yellow).
      </p>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-amber-400 mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          Stopping your VPS will immediately interrupt all active conversations. End users
          connected via channels will receive no response until the VPS is started again.
        </p>
      </div>

      <h2>Hostname and IP Display</h2>
      <p>
        The top of the VPS page displays your instance&apos;s hostname (e.g.,{" "}
        <code>yourname.clawhq.tech</code>) and its public IP address. You can click either
        value to copy it to your clipboard. The hostname is the primary URL used to access
        your OpenClaw dashboard and API endpoints.
      </p>

      <h2>Custom Domain Management</h2>
      <p>
        ClawHQ allows you to connect up to three custom domains to your VPS. This lets your
        end users interact with your agents through a branded URL instead of the default
        <code>.clawhq.tech</code> subdomain.
      </p>
      <p>The process for adding a custom domain is as follows:</p>
      <ol>
        <li><strong>Add Domain</strong> — Enter your custom domain name (e.g., <code>ai.yourcompany.com</code>) in the domain management panel.</li>
        <li><strong>Configure DNS</strong> — ClawHQ displays the DNS records you need to create at your domain registrar. Typically, this is a CNAME record pointing to your <code>.clawhq.tech</code> hostname, or an A record pointing to your VPS IP address.</li>
        <li><strong>Verify DNS</strong> — Click the &quot;Verify&quot; button to confirm that DNS propagation has completed and the records resolve correctly.</li>
        <li><strong>SSL Provisioning</strong> — Once DNS is verified, ClawHQ automatically provisions an SSL certificate for your custom domain. This process takes approximately 1-2 minutes.</li>
      </ol>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          DNS propagation can take anywhere from a few minutes to 48 hours depending on your
          registrar and DNS provider. If verification fails, wait 15 minutes and try again.
        </p>
      </div>

      <h2>SSL Certificate Management</h2>
      <p>
        Every ClawHQ VPS comes with automatic SSL certificate management. The SSL panel
        displays the following information for each active certificate:
      </p>
      <ul>
        <li><strong>Certificate validity</strong> — Whether the certificate is currently valid and trusted.</li>
        <li><strong>Expiry countdown</strong> — The number of days remaining until the certificate expires.</li>
        <li><strong>Auto-renew status</strong> — Indicates whether automatic renewal is enabled (on by default).</li>
        <li><strong>Manual renew</strong> — A button to trigger an immediate certificate renewal if needed.</li>
      </ul>
      <p>
        Certificates are renewed automatically 30 days before expiration. If auto-renewal
        fails for any reason, you will receive a notification and can trigger a manual
        renewal from this panel.
      </p>

      <h2>Service Status Panel</h2>
      <p>
        The service status panel monitors four core services running on your VPS. Each
        service displays its current status, uptime duration, and a restart button for
        individual service recovery:
      </p>
      <ul>
        <li><strong>OpenClaw Gateway (port 18789)</strong> — The core AI gateway that routes conversations to your deployed agents. This is the most critical service.</li>
        <li><strong>Web Server (port 443)</strong> — The HTTPS server that handles incoming web traffic, API requests, and the OpenClaw dashboard interface.</li>
        <li><strong>ClawHQ Embeddings (port 5555)</strong> — The embeddings service used by the <Link href="/docs/agents" className="text-primary hover:underline">knowledge base</Link> for semantic search and document retrieval.</li>
        <li><strong>ClawHQ Data API (port 5556)</strong> — The internal data API that powers analytics, logging, and inter-service communication.</li>
      </ul>
      <p>
        Service status is checked every 60 seconds. A green dot indicates the service is
        running, yellow indicates it is starting or restarting, and red indicates it is down
        or unresponsive.
      </p>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-amber-400 mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          Restarting the OpenClaw Gateway will temporarily disconnect all active conversations.
          Only restart individual services if you are troubleshooting a specific issue. For
          general maintenance, use the full VPS restart instead.
        </p>
      </div>

      <h2>Scheduled Restart</h2>
      <p>
        You can configure automatic scheduled restarts to keep your VPS running smoothly.
        Scheduled restarts help clear accumulated memory usage and ensure all services are
        in a clean state.
      </p>
      <p>Configuration options include:</p>
      <ul>
        <li><strong>Frequency</strong> — Weekly restarts on a day of your choosing.</li>
        <li><strong>Restart scope</strong> — Choose between an OpenClaw-only restart (restarts just the gateway and agent services) or a full VPS reboot (restarts the entire server including the operating system).</li>
        <li><strong>Day and time</strong> — Select the day of the week and time of day (in your local timezone) for the restart to occur. Choose a low-traffic window to minimize disruption.</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          An OpenClaw-only restart is faster (under 10 seconds of downtime) and sufficient for
          most maintenance needs. Reserve the full reboot option for situations where you suspect
          an OS-level issue.
        </p>
      </div>

      <h2>Resource Display Card</h2>
      <p>
        The resource card shows a summary of your VPS hardware allocation and current usage
        across four dimensions:
      </p>
      <ul>
        <li><strong>CPU</strong> — Number of virtual cores allocated and current utilization percentage.</li>
        <li><strong>RAM</strong> — Total memory allocated and current usage in GB.</li>
        <li><strong>Storage</strong> — Total disk space and current usage in GB.</li>
        <li><strong>Bandwidth</strong> — Monthly bandwidth allocation and usage to date.</li>
      </ul>

      <h2>Monitoring Dashboard</h2>
      <p>
        The monitoring dashboard provides a detailed, real-time view of your VPS performance
        through four gauge cards:
      </p>
      <ul>
        <li><strong>CPU %</strong> — Current processor utilization across all cores.</li>
        <li><strong>RAM %</strong> — Current memory consumption as a percentage of total available RAM.</li>
        <li><strong>Disk %</strong> — Storage utilization as a percentage of total disk capacity.</li>
        <li><strong>Network</strong> — Current inbound and outbound network throughput.</li>
      </ul>
      <p>
        Each gauge card uses color-coded thresholds: <strong>green</strong> for 0-69% (normal),{" "}
        <strong>yellow</strong> for 70-89% (elevated), and <strong>red</strong> for 90-100%
        (critical). Historical data is available as time-series charts with 1-hour, 6-hour,
        24-hour, and 7-day views.
      </p>

      <h2>Logs Viewer</h2>
      <p>
        The integrated logs viewer streams real-time output from your VPS services. You can
        filter logs by service (Gateway, Web Server, Embeddings, Data API), by severity level
        (info, warning, error), and search for specific text patterns. Logs are retained for
        7 days and can be exported as plain text files.
      </p>

      <h2>Dashboard Password Management</h2>
      <p>
        Your OpenClaw dashboard is protected by HTTP basic authentication. The password
        management section lets you view your current dashboard username and change your
        dashboard password. Password changes take effect immediately — you will need to
        re-authenticate on your next visit to the OpenClaw dashboard.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          The dashboard password is separate from your ClawHQ account password. Changing one
          does not affect the other. Use a strong, unique password for each.
        </p>
      </div>

      <h2>Related Documentation</h2>
      <ul>
        <li><Link href="/docs/dashboard" className="text-primary hover:underline">Dashboard Overview</Link> — Return to the main dashboard documentation.</li>
        <li><Link href="/docs/agents" className="text-primary hover:underline">Agents</Link> — Deploy and manage agents on your VPS.</li>
        <li><Link href="/docs/models" className="text-primary hover:underline">AI Models</Link> — Configure the AI model running on your VPS.</li>
        <li><Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> — Test your deployment through the built-in chat interface.</li>
      </ul>
    </article>
  );
}
