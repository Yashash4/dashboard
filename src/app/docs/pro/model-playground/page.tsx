import Link from "next/link";

export default function DocsModelPlaygroundPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Model Playground{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The Model Playground lets you compare two models side by side in real time. Type a prompt
        once, see both responses simultaneously with streaming, and make informed decisions about
        which model to use for each agent.
      </p>

      <h2>Side-by-Side Comparison</h2>

      <p>
        The playground uses a CSS grid two-panel layout. Each panel represents one model, and
        both panels respond to the same prompt at the same time. This eliminates the guesswork
        of switching between models — you see exactly how each model handles the same input,
        making differences in tone, accuracy, verbosity, and speed immediately apparent.
      </p>

      <p>
        The two panels are rendered side by side on desktop and stacked vertically on mobile,
        ensuring a usable experience on any screen size.
      </p>

      <h2>Panel Layout</h2>

      <p>
        Each panel contains three elements:
      </p>

      <ul>
        <li>
          <strong>Model Selector Dropdown</strong> — Choose any model available on your VPS
          instance. The dropdown is populated dynamically with your configured models. Select a
          different model for each panel to compare them, or select the same model with different
          temperature settings to see how randomness affects output.
        </li>
        <li>
          <strong>Response Area</strong> — The model&apos;s response appears here as it streams
          in. Responses are rendered with full Markdown support including headings, code blocks,
          lists, bold/italic text, and links. The response area scrolls automatically as new
          content arrives during streaming.
        </li>
        <li>
          <strong>Response Time Badge</strong> — A small badge displayed after the response
          completes, showing the total time from prompt submission to final token. This gives you
          an objective latency measurement for each model, helping you balance quality against
          speed.
        </li>
      </ul>

      <h2>Shared Prompt</h2>

      <p>
        The prompt textarea sits at the bottom of the playground, below both panels. When you
        submit a prompt, it is sent to both selected models simultaneously. This shared-prompt
        design ensures a fair comparison — both models receive the exact same input at the exact
        same time.
      </p>

      <p>
        The prompt field supports multi-line input for complex queries. You can paste code
        snippets, multi-paragraph questions, or structured prompts with instructions and examples.
      </p>

      <h2>Streaming Responses</h2>

      <p>
        Both models stream their responses in real time using Server-Sent Events (SSE). You see
        tokens appear in each panel as they are generated, giving you a live view of how each
        model constructs its answer. Streaming makes the comparison more informative than waiting
        for complete responses — you can observe differences in how each model structures its
        thinking and output.
      </p>

      <p>
        If one model finishes before the other, its response time badge appears immediately while
        the other model continues streaming. This makes speed differences visually obvious.
      </p>

      <h2>Advanced Settings</h2>

      <p>
        Fine-tune each model&apos;s behavior with advanced parameters:
      </p>

      <h3>Temperature</h3>

      <p>
        Adjustable from <strong>0 to 2</strong> using a slider. Temperature controls the
        randomness of the model&apos;s output:
      </p>

      <ul>
        <li><strong>0</strong> — Deterministic. The model always picks the most likely next token. Best for factual queries and consistent outputs.</li>
        <li><strong>0.5 - 0.7</strong> — Balanced. Good default for conversational agents. Responses are natural without being unpredictable.</li>
        <li><strong>1.0</strong> — Standard randomness. The model samples from the full probability distribution.</li>
        <li><strong>1.5 - 2.0</strong> — High creativity. Useful for brainstorming, creative writing, or exploring diverse responses. May produce less coherent output.</li>
      </ul>

      <p>
        Temperature is set per-panel, so you can compare the same model at temperature 0.3 versus
        1.2 to see how randomness affects its answers for your specific use case.
      </p>

      <h3>Max Response Length</h3>

      <p>
        Set a maximum token limit for each model&apos;s response. This is useful for comparing
        how models handle length constraints — some models produce concise answers naturally,
        while others need a length cap to avoid verbose output.
      </p>

      <p>
        Adjusting the max response length also helps you estimate costs and latency for
        production usage. A shorter max length means faster responses and lower token consumption.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> When comparing models for a specific agent,
        use prompts that represent real conversations your users will have. Generic test prompts
        like &quot;tell me a joke&quot; do not reveal how models perform on your actual domain.
        Use questions from your support tickets or Knowledge Base queries instead.
      </div>

      <h2>Save Comparisons</h2>

      <p>
        Save any comparison for later review by clicking the save button after both responses
        complete. A saved comparison captures:
      </p>

      <ul>
        <li>The prompt text</li>
        <li>Both model selections</li>
        <li>Both complete responses</li>
        <li>Response times for each model</li>
        <li>Temperature and max length settings</li>
        <li>Timestamp of the comparison</li>
      </ul>

      <p>
        Saved comparisons are stored in your account and accessible from the comparison history
        view. Use them to build a reference library of model behavior across different prompt
        types, or share them with your team to discuss which model fits best for each agent.
      </p>

      <h2>Comparison History</h2>

      <p>
        The history view lists all your saved comparisons in reverse chronological order. Each
        entry shows the prompt preview, the two models compared, and their response times. Click
        any entry to expand it and view the full prompt and responses.
      </p>

      <p>
        Use comparison history to track how your model preferences evolve over time, or to revisit
        past comparisons when onboarding a new team member who needs to understand why a specific
        model was chosen for an agent.
      </p>

      <h2>Practical Use Cases</h2>

      <ul>
        <li>
          <strong>Model selection for new agents</strong> — Before assigning a model in the{" "}
          <Link href="/docs/pro/agent-builder">Agent Builder</Link>, test candidates in the
          playground with domain-specific prompts.
        </li>
        <li>
          <strong>Temperature tuning</strong> — Compare the same model at different temperatures
          to find the optimal balance between creativity and consistency for your use case.
        </li>
        <li>
          <strong>Regression testing</strong> — When a model provider releases an update, re-run
          your saved prompts to verify that response quality has not degraded.
        </li>
        <li>
          <strong>Cost optimization</strong> — Compare a larger, more expensive model against a
          smaller, faster one. If the smaller model produces acceptable quality for your use case,
          you save on per-token costs.
        </li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Workflow suggestion:</strong> Start in the playground to
        identify your preferred model, then go to the{" "}
        <Link href="/docs/pro/agent-builder" className="text-primary underline">Agent Builder</Link>{" "}
        to create an agent with that model. After deployment, use{" "}
        <Link href="/docs/pro/analytics" className="text-primary underline">Analytics</Link> to
        validate that real-world performance matches your playground results.
      </div>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/agent-builder">Agent Builder</Link> — Create agents with your chosen model</li>
        <li><Link href="/docs/pro/api">API Access</Link> — Use models programmatically via the API</li>
        <li><Link href="/docs/pro/analytics">Analytics</Link> — Track model performance in production</li>
      </ul>
    </article>
  );
}
