import Link from "next/link";

export default function DocsAuditLogPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Audit Log{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The Audit Log provides a tamper-proof record of every administrative action taken on your
        ClawHQ instance. With hash chain verification, SIEM integration, flexible export, and
        full-text search, the Audit Log meets the needs of compliance-driven organizations and
        security-conscious teams alike.
      </p>

      <h2>What Gets Logged</h2>

      <p>
        Every significant action on your instance is recorded as an audit log entry. Each entry
        captures the action type, the user who performed it, a timestamp, relevant metadata, and
        a cryptographic hash linking it to the previous entry.
      </p>

      <p>
        Entries are organized into eight categories:
      </p>

      <ul>
        <li><strong>auth</strong> — Login attempts (successful and failed), session creation, password changes</li>
        <li><strong>vps</strong> — VPS start, stop, restart, configuration changes</li>
        <li><strong>agent</strong> — Agent deployment, undeployment, configuration updates</li>
        <li><strong>model</strong> — Model provider changes, model switching, API key configuration</li>
        <li><strong>api_key</strong> — API key creation, revocation, rate limit changes</li>
        <li><strong>account</strong> — Profile updates, email changes, plan upgrades</li>
        <li><strong>knowledge_base</strong> — Document uploads, deletions, reindexing, connector changes</li>
        <li><strong>webhook</strong> — Webhook creation, deletion, configuration changes, circuit breaker events</li>
      </ul>

      <h2>Hash Chain Verification</h2>

      <p>
        The Audit Log uses a cryptographic hash chain to ensure tamper-proofing. Each log entry
        contains a SHA-256 hash computed from the entry&apos;s content combined with the hash of
        the previous entry. This creates an unbroken chain where modifying or deleting any entry
        would break the chain and be immediately detectable.
      </p>

      <p>
        The verification process works as follows:
      </p>

      <ol>
        <li>The first entry in the log is hashed with a known seed value</li>
        <li>Each subsequent entry computes its hash as: <code>SHA-256(entry_data + previous_hash)</code></li>
        <li>To verify the chain, re-compute each hash sequentially and confirm it matches the stored hash</li>
        <li>If any hash does not match, the chain is broken at that point, indicating tampering</li>
      </ol>

      <p>
        You can trigger a chain verification at any time from the Audit Log page. The verifier
        walks the entire chain and reports whether all hashes are valid or where a break was
        detected.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Why hash chains matter:</strong> Traditional logs can be
        edited or deleted without detection. A hash chain makes any modification mathematically
        provable. This is essential for compliance frameworks that require log integrity
        guarantees (SOC 2, HIPAA, GDPR audit trails).
      </div>

      <h2>SIEM Streaming</h2>

      <p>
        Stream your audit log entries in real time to external Security Information and Event
        Management (SIEM) platforms. ClawHQ supports four streaming destinations:
      </p>

      <ul>
        <li>
          <strong>Datadog</strong> — Entries are shipped as structured logs to your Datadog Log
          Management instance. Configure with your Datadog API key and site URL. Entries include
          all metadata fields and are tagged with the <code>source:clawhq</code> tag for easy
          filtering.
        </li>
        <li>
          <strong>Splunk</strong> — Entries are forwarded to your Splunk HTTP Event Collector
          (HEC) endpoint. Configure with your HEC token and endpoint URL. Events are sent in
          Splunk&apos;s native JSON format.
        </li>
        <li>
          <strong>HTTP Endpoint</strong> — Send entries to any custom HTTP endpoint. Each entry
          is POSTed as a JSON payload. Use this for custom SIEM solutions, data lakes, or
          internal logging infrastructure.
        </li>
        <li>
          <strong>AWS S3</strong> — Batch audit log entries and ship them to an S3 bucket as
          JSON files. Configure with your bucket name, region, and access credentials. Files are
          organized by date for easy retrieval.
        </li>
      </ul>

      <p>
        Multiple SIEM destinations can be active simultaneously. Each destination receives every
        audit log entry independently, so you can stream to both Datadog for real-time alerting
        and S3 for long-term archival.
      </p>

      <h2>Search and Filtering</h2>

      <p>
        The Audit Log includes full-text search with debounced input. Type a search query and
        results update as you type (with a short debounce delay to avoid excessive queries). Search
        matches against action descriptions, user emails, IP addresses, and metadata fields.
      </p>

      <p>
        Filter by category using the category dropdown. Select one or more of the eight categories
        (auth, vps, agent, model, api_key, account, knowledge_base, webhook) to narrow the view
        to specific types of actions.
      </p>

      <p>
        Results are paginated for performance. Navigate through pages to review historical entries,
        or combine search with category filters to find specific events quickly.
      </p>

      <h2>Export</h2>

      <p>
        Export your audit log data in two formats:
      </p>

      <ul>
        <li>
          <strong>CSV</strong> — Spreadsheet-friendly format with one row per entry. Columns
          include timestamp, category, action, user, IP address, and metadata. Suitable for
          importing into Excel, Google Sheets, or business intelligence tools.
        </li>
        <li>
          <strong>JSON</strong> — Machine-readable format preserving the full entry structure
          including nested metadata objects. Suitable for programmatic analysis, archival, or
          importing into other systems.
        </li>
      </ul>

      <p>
        Both export formats support two modes:
      </p>

      <ul>
        <li><strong>Full export</strong> — Download the entire audit log history</li>
        <li><strong>Filtered export</strong> — Download only the entries matching your current search and category filters</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> For compliance audits, use the filtered
        export to generate focused reports. For example, export only &quot;auth&quot; category
        entries for the past quarter to produce a login activity report.
      </div>

      <h2>Retention Settings</h2>

      <p>
        Configure how long audit log entries are retained. The retention period is specified in
        days. Entries older than the retention period are automatically purged during the nightly
        cleanup cycle.
      </p>

      <p>
        Before entries are purged, they can be exported or streamed to an external SIEM for
        long-term storage. This allows you to keep the in-dashboard audit log focused on recent
        activity while maintaining a complete archive externally.
      </p>

      <p>
        If your compliance requirements mandate indefinite retention, set the retention period
        to the maximum allowed value and configure S3 streaming for permanent archival.
      </p>

      <h2>Audit Log Entry Structure</h2>

      <p>
        Each audit log entry contains the following fields:
      </p>

      <pre><code>{`{
  "id": "aud_abc123",
  "timestamp": "2026-03-16T14:30:00Z",
  "category": "agent",
  "action": "agent.deployed",
  "user_email": "admin@company.com",
  "ip_address": "203.0.113.42",
  "metadata": {
    "agent_name": "support-bot",
    "deployment_method": "dashboard"
  },
  "hash": "a1b2c3d4...",
  "previous_hash": "e5f6g7h8..."
}`}</code></pre>

      <p>
        The <code>hash</code> and <code>previous_hash</code> fields form the chain. The
        <code>metadata</code> object varies by action type and contains action-specific details.
      </p>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/logs">Logs Explorer</Link> — Operational logs from your OpenClaw instance</li>
        <li><Link href="/docs/pro/api">API Access</Link> — API key events are tracked in the audit log</li>
        <li><Link href="/docs/pro/webhooks">Webhooks</Link> — Webhook changes are tracked in the audit log</li>
      </ul>
    </article>
  );
}
