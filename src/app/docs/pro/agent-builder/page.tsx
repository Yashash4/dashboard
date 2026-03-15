import Link from "next/link";

export default function DocsAgentBuilderPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Agent Builder{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The Agent Builder lets you create, configure, and deploy custom AI agents without writing
        configuration files by hand. Choose between AI-assisted generation or a manual form, then
        preview the generated files and deploy directly to your VPS.
      </p>

      <h2>Two Creation Modes</h2>

      <p>
        The Agent Builder offers two distinct workflows for creating agents. Use whichever fits
        your style — the end result is the same set of configuration files deployed to your VPS.
      </p>

      <h3>AI-Assisted Mode</h3>

      <p>
        Describe the agent you want in natural language, and the AI generates the full
        configuration for you. For example:
      </p>

      <blockquote>
        &quot;Create a customer support agent that specializes in billing questions. It should be
        friendly and professional, use the support-bot emoji, and have access to coding and
        browser tools. Route it to the web-chat and Slack channels.&quot;
      </blockquote>

      <p>
        The AI parses your description and generates all configuration files: the agent name,
        personality definition (SOUL.md), identity settings, tool selections, model assignment,
        and channel routing. You can review and edit every generated field before deploying.
      </p>

      <p>
        AI-assisted mode is ideal when you know what you want but do not want to fill out every
        form field manually. It is also a great starting point — generate the baseline, then
        fine-tune individual settings in the form editor.
      </p>

      <h3>Manual Form Mode</h3>

      <p>
        The manual form gives you direct control over every configuration option through a
        structured, section-by-section interface. Each section corresponds to a part of the
        agent&apos;s configuration.
      </p>

      <h2>Configuration Sections</h2>

      <h3>Agent Name</h3>

      <p>
        The agent name is used as the directory name on your VPS, so it must be filesystem-safe.
        Use lowercase letters, numbers, and hyphens only. Spaces and special characters are not
        allowed. Examples: <code>support-bot</code>, <code>sales-assistant</code>,{" "}
        <code>billing-helper-v2</code>.
      </p>

      <h3>Personality / SOUL.md</h3>

      <p>
        The personality section defines how your agent communicates. This content becomes the
        agent&apos;s <code>SOUL.md</code> file — the core identity document that shapes every
        response the agent generates.
      </p>

      <p>
        Write in the second person, describing how the agent should behave:
      </p>

      <blockquote>
        &quot;You are a friendly, knowledgeable support specialist for Acme Corp. You answer
        billing questions clearly and concisely. When you do not know the answer, you say so
        honestly and offer to escalate to a human agent.&quot;
      </blockquote>

      <p>
        The large textarea supports multi-paragraph definitions. For teams that want a starting
        point, click the <strong>AI Generate</strong> button to have the system draft a
        personality based on the agent name and any context you have provided.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> A well-written SOUL.md is the single most
        impactful configuration for agent quality. Spend time defining the tone, boundaries, and
        domain expertise clearly. Vague personalities produce vague responses.
      </div>

      <h3>Identity</h3>

      <p>
        Identity settings control how the agent presents itself in conversations:
      </p>

      <ul>
        <li><strong>Display Name</strong> — The human-readable name shown to users in chat interfaces (e.g., &quot;Acme Support&quot;)</li>
        <li><strong>Theme</strong> — A color theme applied to the agent&apos;s chat widget</li>
        <li><strong>Emoji</strong> — An emoji displayed alongside the agent&apos;s name in the dashboard and chat headers</li>
      </ul>

      <h3>Tools</h3>

      <p>
        Select which tool categories your agent has access to. Tools are organized into checkbox
        groups:
      </p>

      <ul>
        <li><strong>Coding</strong> — Code execution, file reading/writing, terminal access</li>
        <li><strong>Browser</strong> — Web browsing, URL fetching, screenshot capture</li>
        <li><strong>Memory</strong> — Persistent memory across conversations, note-taking</li>
        <li><strong>Session</strong> — Session management, context tracking, conversation history</li>
        <li><strong>Subagent</strong> — Ability to delegate tasks to other deployed agents</li>
      </ul>

      <p>
        Enable only the tools your agent needs. An agent that answers FAQ questions does not need
        coding tools. A developer assistant probably needs coding and browser tools but not
        subagent delegation.
      </p>

      <h3>Model</h3>

      <p>
        Assign a primary model and an optional fallback model to your agent:
      </p>

      <ul>
        <li><strong>Primary Model</strong> — The model used for all requests by default. Select from the models available on your instance.</li>
        <li><strong>Fallback Model</strong> — Used automatically if the primary model is unavailable or returns an error. This ensures your agent remains responsive even during model provider outages.</li>
      </ul>

      <p>
        Both fields are dropdown selectors populated with the models configured on your VPS. If
        you are unsure which model to choose, use the{" "}
        <Link href="/docs/pro/model-playground">Model Playground</Link> to compare outputs
        before deciding.
      </p>

      <h3>User Context / USER.md</h3>

      <p>
        An optional <code>USER.md</code> file that provides additional context about the end
        users who will interact with this agent. For example, you might specify:
      </p>

      <blockquote>
        &quot;Users are small business owners who are not technical. Avoid jargon. Explain
        concepts in simple terms. Most users are in the US Eastern timezone.&quot;
      </blockquote>

      <p>
        USER.md helps the model tailor its communication style to your audience without cluttering
        the SOUL.md with user-specific details.
      </p>

      <h3>Channel Routing</h3>

      <p>
        Select which channels this agent should be available on. This is a multi-select field
        listing all channels connected to your instance. An agent can be routed to one, several,
        or all channels.
      </p>

      <p>
        Channel routing determines where users can reach the agent. An agent routed only to
        Slack will not appear in your web chat widget, and vice versa. You can change routing
        after deployment without redeploying the agent.
      </p>

      <h2>Preview Generated Files</h2>

      <p>
        Before deploying, review the configuration files that will be written to your VPS. The
        preview panel displays each file in a tabbed interface:
      </p>

      <ul>
        <li><code>SOUL.md</code> — The personality definition</li>
        <li><code>USER.md</code> — The user context (if provided)</li>
        <li><code>agent.json</code> — Tool configuration, model assignment, and identity settings</li>
        <li><code>routing.json</code> — Channel routing configuration</li>
      </ul>

      <p>
        Each tab shows the exact file content that will be deployed. You can edit the preview
        content directly if you need to make last-minute adjustments.
      </p>

      <h2>Auto-Save Draft</h2>

      <p>
        The Agent Builder automatically saves your work as a draft as you fill out the form.
        If you close the browser or navigate away, your in-progress configuration is preserved.
        Return to the Agent Builder and your draft is restored exactly where you left off.
      </p>

      <p>
        Drafts are saved per-agent-name. You can have multiple drafts for different agents
        simultaneously.
      </p>

      <h2>Deploy to VPS</h2>

      <p>
        When you are satisfied with the configuration, click <strong>Deploy</strong> to push the
        agent to your VPS. The deployment process writes the configuration files to the correct
        directory and registers the agent with your OpenClaw instance. The agent becomes available
        on its routed channels within seconds.
      </p>

      <p>
        Deployment status is shown in real time. If any step fails, the error is displayed with
        actionable details. You can fix the issue and retry without losing your configuration.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">After deployment:</strong> Monitor your agent&apos;s
        performance with the{" "}
        <Link href="/docs/pro/analytics" className="text-primary underline">Analytics</Link>{" "}
        module and review its logs in the{" "}
        <Link href="/docs/pro/logs" className="text-primary underline">Logs Explorer</Link>.
      </div>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/model-playground">Model Playground</Link> — Compare models before assigning them to agents</li>
        <li><Link href="/docs/pro/knowledge-base">Knowledge Base</Link> — Give your agents domain-specific knowledge</li>
        <li><Link href="/docs/pro/analytics">Analytics</Link> — Track agent performance after deployment</li>
      </ul>
    </article>
  );
}
