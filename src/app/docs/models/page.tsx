import Link from "next/link";

export default function DocsAIModelsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>AI Models</h1>
      <p className="text-muted-foreground text-lg">
        ClawHQ gives you access to a curated selection of bundled AI models. Choose the model
        that best fits your use case, compare capabilities side by side, and switch models
        with a single click.
      </p>

      <h2>Current Model Display</h2>
      <p>
        The top of the AI Models page shows your currently active model in a prominent card.
        The card displays:
      </p>
      <ul>
        <li><strong>Model name</strong> — The human-readable name of the active model.</li>
        <li><strong>Context window</strong> — The maximum number of tokens the model can process in a single conversation turn (e.g., 8K, 32K, 128K tokens).</li>
        <li><strong>Performance badge</strong> — A visual indicator showing whether the model is categorized as <em>Fast</em>, <em>Balanced</em>, or <em>Powerful</em>.</li>
      </ul>
      <p>
        The current model is the one that all deployed <Link href="/docs/agents" className="text-primary hover:underline">agents</Link> use
        to generate responses. Switching the model changes the underlying AI for every agent
        on your instance simultaneously.
      </p>

      <h2>Available Models</h2>
      <p>
        Below the current model, the page displays a grid of all available models as
        individual cards. Each model card includes:
      </p>
      <ul>
        <li>The model name and a brief description of its strengths.</li>
        <li>The context window size.</li>
        <li>A performance badge (Fast, Balanced, or Powerful).</li>
        <li>A &quot;Switch to this model&quot; button (or &quot;Active&quot; if it is already the current model).</li>
      </ul>
      <p>
        Models are sorted by capability tier, with the most powerful models listed first. Each
        card is color-coded by its performance category to make scanning the list faster.
      </p>

      <h2>Model Comparison</h2>
      <p>
        The model comparison feature lets you evaluate two or more models side by side before
        making a switch. Select the models you want to compare and the comparison view displays
        them in adjacent columns with the following attributes:
      </p>
      <ul>
        <li><strong>Capabilities</strong> — Checkmarks indicating support for chat, analysis, code generation, vision, creative writing, and fast inference.</li>
        <li><strong>Strengths</strong> — A short text summary of what the model excels at.</li>
        <li><strong>Speed rating</strong> — A relative indicator (1-5 scale) of how quickly the model generates responses.</li>
        <li><strong>Context window</strong> — The token limit for the model.</li>
      </ul>
      <p>
        The comparison table highlights differences between the selected models, making it
        straightforward to identify which model offers the best fit for your workload.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          If your agents primarily handle customer support conversations, a model with strong
          chat capabilities and a fast speed rating will deliver the best experience. For complex
          research or analysis tasks, prioritize a model with a larger context window and the
          Powerful badge.
        </p>
      </div>

      <h2>Model Switches</h2>
      <p>
        Starter plan users can perform up to 5 model switches per calendar month. The current
        count of switches used is displayed on the page alongside a progress indicator. Pro
        and Ultra plan users have unlimited model switches.
      </p>
      <p>
        Each switch counts as one use regardless of whether you switch to a new model or
        revert to a previous one. The counter resets on the first day of each billing cycle.
      </p>

      <div className="not-prose bg-[color-mix(in_srgb,var(--warning),transparent_95%)] border border-[color-mix(in_srgb,var(--warning),transparent_80%)] rounded-lg p-4 my-6">
        <p className="font-semibold text-[var(--warning)] mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          Switching models restarts the OpenClaw Gateway on your VPS, which causes a brief
          interruption (typically under 10 seconds). Plan switches during low-traffic periods.
        </p>
      </div>

      <h2>Switch Confirmation</h2>
      <p>
        When you click &quot;Switch to this model,&quot; a confirmation dialog appears before the change
        is applied. The dialog provides a direct comparison between your current model and the
        model you are switching to, showing:
      </p>
      <ul>
        <li>Both model names side by side.</li>
        <li>Context window comparison (e.g., &quot;8K → 128K&quot;).</li>
        <li>Performance badge comparison (e.g., &quot;Fast → Powerful&quot;).</li>
        <li>A note about the expected downtime during the switch.</li>
        <li>For Starter users, the remaining switch count after this action.</li>
      </ul>
      <p>
        You must explicitly confirm the switch by clicking the &quot;Confirm Switch&quot; button. The
        process typically completes within 30 seconds, during which a progress indicator is
        displayed.
      </p>

      <h2>Model Recommendation Engine</h2>
      <p>
        Not sure which model to choose? The recommendation engine analyzes your use case and
        suggests the best model for your needs. Click the &quot;Get Recommendation&quot; button and
        answer a few quick questions:
      </p>
      <ul>
        <li>What is the primary purpose of your agents? (Customer support, research, content creation, code assistance, general purpose)</li>
        <li>How important is response speed vs. response quality?</li>
        <li>Do your conversations tend to be short exchanges or long, multi-turn discussions?</li>
        <li>Do you need vision or image analysis capabilities?</li>
      </ul>
      <p>
        Based on your answers, the engine highlights the recommended model with a brief
        explanation of why it is the best match. You can then switch to the recommended model
        directly from the results view.
      </p>

      <h2>Model Detail Dialog</h2>
      <p>
        Clicking on any model card opens a detail dialog with the full specification sheet
        for that model. The dialog includes:
      </p>
      <ul>
        <li>Complete model name and version identifier.</li>
        <li>Detailed capability list with descriptions of each supported feature.</li>
        <li>Context window size with an explanation of what it means in practice.</li>
        <li>Speed benchmarks relative to other available models.</li>
        <li>Ideal use cases and scenarios where the model excels.</li>
        <li>Known limitations or trade-offs compared to other models.</li>
      </ul>

      <h2>Performance Badges</h2>
      <p>
        Every model in ClawHQ is assigned one of three performance badges to help you quickly
        assess its characteristics:
      </p>
      <ul>
        <li><strong>Fast</strong> — Optimized for low-latency responses. Ideal for real-time customer support and high-volume chat applications where speed is the priority.</li>
        <li><strong>Balanced</strong> — A middle ground between speed and capability. Suitable for most general-purpose workloads including customer service, content generation, and light analysis.</li>
        <li><strong>Powerful</strong> — The highest capability tier. Best for complex reasoning, code generation, long-document analysis, and tasks that require the deepest understanding.</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          You can test how a model performs with your specific agents before committing to a
          switch. Deploy a test agent, switch models, and run a few conversations through the{" "}
          <Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> interface
          to evaluate the quality and speed of responses.
        </p>
      </div>

      <h2>Related Documentation</h2>
      <ul>
        <li><Link href="/docs/dashboard" className="text-primary hover:underline">Dashboard Overview</Link> — See your model status at a glance.</li>
        <li><Link href="/docs/agents" className="text-primary hover:underline">Agents</Link> — Understand how agents use the active model.</li>
        <li><Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> — Test model performance in real-time conversations.</li>
        <li><Link href="/docs/vps" className="text-primary hover:underline">VPS Management</Link> — Monitor VPS impact during model switches.</li>
      </ul>
    </article>
  );
}
