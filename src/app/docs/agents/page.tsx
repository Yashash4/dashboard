import Link from "next/link";

export default function DocsAgentsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Agents</h1>
      <p className="text-muted-foreground text-lg">
        Agents are the core of your ClawHQ deployment. Each agent is a specialized AI persona
        configured to handle specific tasks — from customer support to content creation.
        This page covers how to deploy, monitor, test, and manage your agents.
      </p>

      <h2>Agent Cards</h2>
      <p>
        The agents page displays each agent as an individual card in a responsive grid layout.
        Every agent card shows:
      </p>
      <ul>
        <li><strong>Agent name</strong> and a short description of its purpose.</li>
        <li><strong>Category</strong> — The type of agent (Support, Sales, Research, Content, Data, Manager, Reviewer).</li>
        <li><strong>Deployment status</strong> — A clear badge indicating whether the agent is <em>Deployed</em> (green) or <em>Not Deployed</em> (gray).</li>
        <li><strong>Deploy/Undeploy button</strong> — A single-click action to change the agent&apos;s deployment state.</li>
      </ul>
      <p>
        Deployed agents are actively running on your <Link href="/docs/vps" className="text-primary hover:underline">VPS</Link> and
        ready to handle conversations. Not-deployed agents exist in your library but are not
        consuming resources or processing messages.
      </p>

      <h2>Agent Health Status</h2>
      <p>
        Each deployed agent is continuously monitored for health. The health indicator appears
        as a colored dot on the agent card with one of four possible states:
      </p>
      <ul>
        <li><strong>Healthy (green)</strong> — The agent directory exists on the VPS, the gateway is responding, and the agent successfully responds to ping requests.</li>
        <li><strong>Degraded (yellow)</strong> — The agent is partially functional. For example, the directory exists and the gateway responds, but the agent is slow to respond to pings.</li>
        <li><strong>Error (red)</strong> — The agent has failed one or more health checks. Common causes include a missing agent directory, gateway errors, or the agent process crashing.</li>
        <li><strong>Unknown (gray)</strong> — Health status cannot be determined, typically because the VPS is stopped or unreachable.</li>
      </ul>
      <p>
        Health checks are performed via SSH to your VPS. The system verifies three things in
        sequence: that the agent&apos;s directory exists on disk, that the OpenClaw Gateway is
        responding on port 18789, and that the specific agent responds to a lightweight ping
        message.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          If an agent shows an &quot;Error&quot; status, try undeploying and redeploying it. This
          recreates the agent directory and re-registers it with the gateway. If the issue
          persists, check the VPS logs for error details.
        </p>
      </div>

      <h2>Quick Test Dialog</h2>
      <p>
        You can test any deployed agent directly from the agents page without navigating to
        the <Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> interface.
        Click the &quot;Test&quot; button on an agent card to open the quick test dialog.
      </p>
      <p>
        The quick test dialog provides a lightweight chat window where you can send up to 5
        test messages to the agent and see its responses in real time. This is useful for:
      </p>
      <ul>
        <li>Verifying that a newly deployed agent is responding correctly.</li>
        <li>Spot-checking an agent&apos;s behavior after configuration changes.</li>
        <li>Testing specific prompts or edge cases without starting a full conversation.</li>
      </ul>
      <p>
        Test conversations are not saved to your conversation history and do not count toward
        any usage metrics.
      </p>

      <h2>Agent Configuration View</h2>
      <p>
        Each agent&apos;s configuration is accessible through a tabbed interface on the agent
        detail panel. The configuration is organized into four tabs:
      </p>
      <ul>
        <li><strong>SOUL.md</strong> — The agent&apos;s personality definition, including its tone, style, and behavioral guidelines.</li>
        <li><strong>identity.md</strong> — The agent&apos;s identity information, such as its name, role description, and greeting messages.</li>
        <li><strong>TOOLS.md</strong> — The list of tools and capabilities available to the agent, such as web search, file reading, or API calls.</li>
        <li><strong>config.json</strong> — Technical configuration parameters including temperature, max tokens, and other model-specific settings.</li>
      </ul>
      <p>
        For Starter plan users, the configuration view is read-only. You can inspect how each
        agent is configured but cannot modify the files directly. Pro and Ultra plan users
        have full editing capabilities through the Agent Builder, which provides a guided
        interface for modifying agent configurations.
      </p>

      <div className="not-prose bg-[color-mix(in_srgb,var(--warning),transparent_95%)] border border-[color-mix(in_srgb,var(--warning),transparent_80%)] rounded-lg p-4 my-6">
        <p className="font-semibold text-[var(--warning)] mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          Modifying an agent&apos;s configuration files directly can change its behavior in
          unexpected ways. Always test the agent after making changes using the quick test
          dialog or the Chat interface.
        </p>
      </div>

      <h2>Per-Agent Statistics</h2>
      <p>
        Each agent card displays a statistics line with three key metrics, calculated over
        the trailing 7-day period:
      </p>
      <ul>
        <li><strong>Messages (7d)</strong> — The total number of messages the agent has processed in the last 7 days.</li>
        <li><strong>Avg Response Time</strong> — The average time in seconds between receiving a message and delivering the complete response.</li>
        <li><strong>Last Active</strong> — A relative timestamp showing when the agent last processed a message (e.g., &quot;2 hours ago&quot;, &quot;3 days ago&quot;).</li>
      </ul>
      <p>
        These metrics help you quickly identify which agents are actively handling traffic and
        how well they are performing. An agent with a high message count but increasing response
        times may benefit from a <Link href="/docs/models" className="text-primary hover:underline">model switch</Link> to
        a faster model.
      </p>

      <h2>Agent Logs</h2>
      <p>
        The agent logs panel shows the last 10 message exchanges for each agent. Each log
        entry includes:
      </p>
      <ul>
        <li>The incoming user message.</li>
        <li>The agent&apos;s response.</li>
        <li>The response time for that exchange.</li>
        <li>The timestamp of the conversation.</li>
        <li>The channel through which the message was received (WhatsApp, Telegram, web, API, etc.).</li>
      </ul>
      <p>
        Logs are useful for debugging agent behavior and understanding how agents respond to
        real user queries. For a complete conversation history, use the{" "}
        <Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> page.
      </p>

      <h2>Bulk Actions</h2>
      <p>
        The bulk actions dropdown at the top of the agents page lets you perform operations
        on multiple agents simultaneously:
      </p>
      <ul>
        <li><strong>Deploy All Undeployed</strong> — Deploys every agent in your library that is not currently deployed. Useful when setting up a new instance or recovering from a full reset.</li>
        <li><strong>Undeploy All</strong> — Removes all agents from active deployment. The agent configurations are preserved in your library.</li>
        <li><strong>Restart All</strong> — Restarts every deployed agent without changing their deployment state. This is equivalent to undeploying and redeploying each agent.</li>
      </ul>
      <p>
        Bulk actions execute sequentially to avoid overloading your VPS. A progress indicator
        shows how many agents have been processed out of the total.
      </p>

      <h2>Sorting and Filtering</h2>
      <p>
        The agents page includes controls for organizing your agent list:
      </p>
      <ul>
        <li><strong>Filter by status</strong> — Show all agents, only deployed agents, or only undeployed agents.</li>
        <li><strong>Filter by category</strong> — Narrow the list to a specific agent category (Support, Sales, Research, etc.).</li>
        <li><strong>Filter by activity</strong> — Show only agents that have been active in the last 24 hours, 7 days, or 30 days.</li>
        <li><strong>Sort options</strong> — Sort by name, deployment status, message count, response time, or last active timestamp.</li>
      </ul>

      <h2>Grouping by Category</h2>
      <p>
        When you have many agents, you can enable category grouping to organize the agent
        grid into labeled sections. Each section has a header showing the category name and
        the count of agents in that category (e.g., &quot;Support (3)&quot;, &quot;Research (2)&quot;).
      </p>
      <p>
        Category groups are collapsible, allowing you to focus on a specific type of agent
        while hiding the rest. Your grouping preference is saved and persists across sessions.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          Combine filtering and grouping for the most efficient workflow. For example, filter
          by &quot;Deployed&quot; status and group by category to see exactly which agent types are
          currently active on your VPS.
        </p>
      </div>

      <h2>Related Documentation</h2>
      <ul>
        <li><Link href="/docs/store" className="text-primary hover:underline">Agent Store</Link> — Browse and install new agents.</li>
        <li><Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> — Have full conversations with your deployed agents.</li>
        <li><Link href="/docs/models" className="text-primary hover:underline">AI Models</Link> — Change the AI model powering your agents.</li>
        <li><Link href="/docs/vps" className="text-primary hover:underline">VPS Management</Link> — Monitor the server running your agents.</li>
        <li><Link href="/docs/dashboard" className="text-primary hover:underline">Dashboard Overview</Link> — See agent metrics on the main dashboard.</li>
      </ul>
    </article>
  );
}
