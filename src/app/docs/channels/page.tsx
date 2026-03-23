import Link from "next/link";

export default function DocsChannelsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Channels</h1>
      <p className="text-muted-foreground text-lg">
        Channels allow your AI agents to communicate with users across multiple
        messaging platforms simultaneously. ClawHQ supports seven channels, five
        of which can be configured entirely through self-service setup, while two
        require administrator assistance.
      </p>

      <h2>Supported Channels</h2>
      <p>
        ClawHQ integrates with the following messaging platforms. Each channel
        operates independently, meaning you can connect as many or as few as your
        workflow requires.
      </p>

      <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Channel</th>
            <th>Setup Type</th>
            <th>Connection Method</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Telegram</td><td>Self-service</td><td>Bot token</td></tr>
          <tr><td>Discord</td><td>Self-service</td><td>Bot token</td></tr>
          <tr><td>Slack</td><td>Self-service</td><td>Bot OAuth token</td></tr>
          <tr><td>Microsoft Teams</td><td>Self-service</td><td>App ID + password + tenant ID</td></tr>
          <tr><td>Webchat</td><td>Self-service</td><td>Auto-configured</td></tr>
          <tr><td>WhatsApp</td><td>Admin-assisted</td><td>QR code pairing</td></tr>
          <tr><td>Signal</td><td>Admin-assisted</td><td>Phone number registration</td></tr>
        </tbody>
      </table>
      </div>

      <h2>Self-Service Channel Setup</h2>
      <p>
        The five self-service channels can be connected directly from the{" "}
        <Link href="/docs/channels" className="text-[var(--accent)] hover:underline">Channels</Link>{" "}
        page in your dashboard. Click <strong>Connect Channel</strong>, select
        the platform, and follow the instructions below.
      </p>

      <h3>Telegram</h3>
      <ol>
        <li>Open Telegram and search for <strong>@BotFather</strong>.</li>
        <li>Send the <code>/newbot</code> command and follow the prompts to name your bot.</li>
        <li>BotFather will provide an API token. Copy it.</li>
        <li>Return to ClawHQ, select Telegram, and paste the token into the <strong>Bot Token</strong> field.</li>
        <li>Click <strong>Connect</strong>. ClawHQ will verify the token by calling the Telegram <code>getMe</code> endpoint.</li>
      </ol>

      <div className="not-prose border-l-2 border-emerald-500 bg-emerald-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--text-primary)]">Tip:</strong>{" "}
          You can customise your Telegram bot&apos;s profile picture and description
          directly through BotFather using the <code>/setuserpic</code> and{" "}
          <code>/setdescription</code> commands.
        </div>
      </div>

      <h3>Discord</h3>
      <ol>
        <li>Go to the <strong>Discord Developer Portal</strong> at <code>discord.com/developers</code> and create a new application.</li>
        <li>Navigate to the <strong>Bot</strong> section and click <strong>Add Bot</strong>.</li>
        <li>Copy the bot token from the Bot page.</li>
        <li>Under <strong>Privileged Gateway Intents</strong>, enable <strong>Message Content Intent</strong>.</li>
        <li>Generate an invite link under <strong>OAuth2 &gt; URL Generator</strong> with the <code>bot</code> scope and <code>Send Messages</code> / <code>Read Message History</code> permissions.</li>
        <li>Invite the bot to your server using the generated URL.</li>
        <li>In ClawHQ, select Discord and paste the bot token. ClawHQ verifies the connection by calling <code>users/@me</code>.</li>
      </ol>

      <h3>Slack</h3>
      <ol>
        <li>Visit <code>api.slack.com</code> and click <strong>Create New App</strong>. Choose <strong>From scratch</strong>.</li>
        <li>Under <strong>OAuth &amp; Permissions</strong>, add the following bot token scopes: <code>chat:write</code>, <code>channels:history</code>, <code>channels:read</code>, and <code>app_mentions:read</code>.</li>
        <li>Install the app to your workspace and copy the <strong>Bot User OAuth Token</strong> (starts with <code>xoxb-</code>).</li>
        <li>In ClawHQ, select Slack and paste the bot token. ClawHQ verifies it by calling <code>auth.test</code>.</li>
        <li>Invite the bot to any channels where it should respond using <code>/invite @YourBot</code>.</li>
      </ol>

      <h3>Microsoft Teams</h3>
      <ol>
        <li>Register a new application in the <strong>Azure Portal</strong>.</li>
        <li>Note the <strong>Application (client) ID</strong> and <strong>Directory (tenant) ID</strong>.</li>
        <li>Under <strong>Certificates &amp; secrets</strong>, create a new client secret and copy the value.</li>
        <li>Enable the <strong>Microsoft Teams</strong> channel in the Bot Framework registration.</li>
        <li>In ClawHQ, select Microsoft Teams and enter the App ID, client secret, and Tenant ID.</li>
      </ol>

      <h3>Webchat</h3>
      <p>
        Webchat is the simplest channel to set up. It is automatically configured
        when your ClawHQ instance is provisioned. Navigate to{" "}
        <strong>Channels &gt; Webchat</strong> to find your embed script, which
        you can paste into any website&apos;s HTML to display a chat widget. ClawHQ
        verifies the webchat connection by performing a gateway health check.
      </p>

      <h2>Admin-Assisted Channels</h2>
      <p>
        WhatsApp and Signal require additional verification steps that must be
        coordinated with the ClawHQ support team.
      </p>

      <h3>WhatsApp</h3>
      <p>
        WhatsApp can be connected by scanning a QR code displayed directly in the
        ClawHQ dashboard. Navigate to <strong>Channels &gt; WhatsApp</strong> and
        a pairing QR code will appear. Scan it with your WhatsApp app to link
        your number. If you encounter issues, you can request admin-assisted
        setup through the{" "}
        <Link href="/docs/support" className="text-[var(--accent)] hover:underline">support system</Link>.
      </p>

      <h3>Signal</h3>
      <p>
        Signal requires a dedicated phone number to be registered with the Signal
        service. Because this process involves phone number verification and
        cannot be completed entirely within the dashboard, please{" "}
        <Link href="/docs/support" className="text-[var(--accent)] hover:underline">contact support</Link>{" "}
        to arrange Signal channel setup.
      </p>

      <h2>Connection Test</h2>
      <p>
        Every channel includes a <strong>Test Connection</strong> button that
        performs a real API verification against the platform. This is not a
        simple ping; ClawHQ calls the platform&apos;s own identity endpoint to
        confirm the credentials are valid and the bot is reachable.
      </p>
      <ul>
        <li><strong>Telegram</strong> &mdash; Calls <code>getMe</code> to verify the bot token and retrieve the bot&apos;s username.</li>
        <li><strong>Discord</strong> &mdash; Calls <code>users/@me</code> to confirm the bot token and fetch the bot&apos;s identity.</li>
        <li><strong>Slack</strong> &mdash; Calls <code>auth.test</code> to validate the OAuth token and confirm workspace access.</li>
        <li><strong>Webchat</strong> &mdash; Performs a gateway health check to ensure the chat endpoint is responsive.</li>
        <li><strong>Teams / WhatsApp / Signal</strong> &mdash; Validates the stored credentials and confirms the service is active.</li>
      </ul>

      <h2>Channel Status History</h2>
      <p>
        Each channel maintains a timeline of events including connections,
        disconnections, health check results, and configuration changes. You can
        view this history by clicking the <strong>Status History</strong> button
        on any channel card. The timeline displays events in reverse
        chronological order with timestamps and event details. ClawHQ also
        calculates an <strong>uptime percentage</strong> for each channel based
        on the ratio of healthy time to total elapsed time since the channel was
        first connected.
      </p>

      <h2>Per-Channel Agent Routing</h2>
      <p>
        By default, every channel routes incoming messages to any available agent
        (the <strong>Any Agent</strong> setting). You can override this by
        selecting a specific agent from the dropdown on each channel card. This
        is useful when you want different agents to handle different platforms
        &mdash; for example, a sales-focused agent on your website webchat and a
        technical support agent on Discord.
      </p>
      <p>
        Agent routing can be changed at any time without disconnecting the
        channel. See the{" "}
        <Link href="/docs/agents" className="text-[var(--accent)] hover:underline">Agents documentation</Link>{" "}
        for more on configuring agent behaviour.
      </p>

      <h2>Reconnect</h2>
      <p>
        If a channel becomes disconnected due to a token expiration, network
        issue, or platform outage, you do not need to re-enter credentials.
        Click the <strong>Reconnect</strong> button on the disconnected channel
        card. ClawHQ will attempt to re-establish the connection using the
        previously saved credentials. If the credentials have been revoked or
        changed on the platform side, you will be prompted to enter new ones.
      </p>

      <h2>Channel Message Preview</h2>
      <p>
        Each connected channel card includes an expandable{" "}
        <strong>Recent Messages</strong> section. Click the expand arrow to see
        the last five messages received on that channel, including the sender
        name, message content, and timestamp. This provides a quick way to
        verify that your bot is receiving and processing messages without
        navigating to the full{" "}
        <Link href="/docs/chat" className="text-[var(--accent)] hover:underline">Chat</Link> view.
      </p>

      <h2>Channel Ordering &amp; Priority</h2>
      <p>
        You can drag and drop channel cards to reorder them. The first channel
        in the list receives a <strong>Primary</strong> badge, indicating it is
        your main communication channel. Channel ordering is a visual
        organisational tool and does not affect message routing or processing
        priority.
      </p>

      <h2>Channel Branding</h2>
      <p>
        For the <strong>Webchat</strong> channel, you can customise the display
        name and avatar that appear in the chat widget. Navigate to the channel
        settings and update the <strong>Display Name</strong> and{" "}
        <strong>Avatar</strong> fields. For other platforms (Telegram, Discord,
        Slack, Teams), branding is controlled through the respective platform&apos;s
        bot settings. ClawHQ provides instructions for each platform in the
        channel configuration panel.
      </p>

      <div className="not-prose border-l-2 border-amber-500 bg-amber-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--warning)]">Warning:</strong>{" "}
          Disconnecting a channel will stop all message processing for that
          platform immediately. Any in-flight messages may be lost. If you need
          to temporarily pause a channel, consider removing the agent assignment
          instead.
        </div>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/agents" className="text-[var(--accent)] hover:underline">Configure agents</Link> to handle incoming channel messages.</li>
        <li><Link href="/docs/chat" className="text-[var(--accent)] hover:underline">View conversations</Link> across all connected channels.</li>
        <li><Link href="/docs/vps" className="text-[var(--accent)] hover:underline">Monitor channel health</Link> from the VPS management page.</li>
        <li><Link href="/docs/support" className="text-[var(--accent)] hover:underline">Contact support</Link> for WhatsApp or Signal setup assistance.</li>
      </ul>
    </article>
  );
}
