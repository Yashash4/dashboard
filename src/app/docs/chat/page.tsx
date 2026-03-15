import Link from "next/link";

export default function DocsChatPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Chat</h1>
      <p className="text-muted-foreground text-lg">
        The Chat interface is your direct line to every deployed agent. Use it to test agent
        behavior, hold full conversations, and evaluate responses in real time — all from
        within the ClawHQ dashboard.
      </p>

      <h2>Streaming Responses</h2>
      <p>
        Chat uses real-time streaming to display agent responses as they are generated.
        Instead of waiting for the entire response to complete, you see tokens appear
        one by one, giving you immediate feedback on both the content and speed of the
        agent&apos;s reply.
      </p>
      <p>
        Streaming provides two key benefits: it reduces the perceived wait time for long
        responses, and it lets you evaluate whether the agent is heading in the right
        direction early in the response. If the response is off-track, you can interrupt
        by sending a new message.
      </p>
      <p>
        While the agent is generating a response, an animated typing indicator appears in
        the chat window. The indicator shows three pulsing dots, mirroring the familiar
        pattern used in messaging applications. This visual cue confirms that the agent is
        actively processing your message.
      </p>

      <h2>Conversation History</h2>
      <p>
        All conversations are automatically persisted and survive page refreshes, browser
        restarts, and session changes. Your full conversation history is available in the
        sidebar, organized by date with the most recent conversations at the top.
      </p>
      <p>
        You can search through past conversations using the search bar in the sidebar. Search
        matches against message content, so you can find specific exchanges by searching for
        keywords that appeared in either your messages or the agent&apos;s responses.
      </p>
      <p>
        Clicking on a past conversation loads it into the main chat view, where you can
        continue the conversation from where you left off or simply review the exchange.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          Use conversation history to track how your agents handle different types of queries
          over time. This is especially useful when evaluating the impact of model switches
          or agent configuration changes.
        </p>
      </div>

      <h2>Agent Selector Sidebar</h2>
      <p>
        The left sidebar lists all deployed <Link href="/docs/agents" className="text-primary hover:underline">agents</Link> on
        your VPS. Each entry shows the agent&apos;s name and a colored status dot indicating its
        current health:
      </p>
      <ul>
        <li><strong>Green dot</strong> — Agent is healthy and ready to receive messages.</li>
        <li><strong>Yellow dot</strong> — Agent is in a degraded state but still operational.</li>
        <li><strong>Red dot</strong> — Agent has encountered an error and may not respond.</li>
        <li><strong>Gray dot</strong> — Agent status is unknown (VPS may be unreachable).</li>
      </ul>
      <p>
        Click on any agent in the sidebar to switch the active conversation to that agent.
        Each agent maintains its own separate conversation thread, so switching agents does
        not affect your conversation history with other agents.
      </p>

      <h2>File and Image Support</h2>
      <p>
        The chat input supports file and image uploads. Click the attachment icon next to the
        message input or drag and drop a file directly into the chat window. Supported file
        types include:
      </p>
      <ul>
        <li><strong>Images</strong> — PNG, JPG, GIF, and WebP. Images are displayed inline in the chat and can be analyzed by agents using models with vision capabilities.</li>
        <li><strong>Documents</strong> — PDF, TXT, and common document formats. The file content is extracted and provided to the agent as context.</li>
        <li><strong>Code files</strong> — Any plain text file with a recognized extension. The content is formatted with syntax highlighting in the chat display.</li>
      </ul>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-amber-400 mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          Image analysis requires a model with vision capabilities. If your current model does
          not support vision, image uploads will be accepted but the agent will not be able to
          interpret the image content. Check the{" "}
          <Link href="/docs/models" className="text-primary hover:underline">AI Models</Link> page
          to confirm your model&apos;s capabilities.
        </p>
      </div>

      <h2>Code Blocks</h2>
      <p>
        When an agent includes code in its response, the code is rendered in a dedicated code
        block with full syntax highlighting. Code blocks support all major programming languages
        and are automatically detected based on the language identifier in the agent&apos;s
        markdown response.
      </p>
      <p>
        Each code block includes a one-click copy button in the top-right corner. Clicking it
        copies the entire code snippet to your clipboard without including any surrounding
        text or formatting. A brief confirmation tooltip (&quot;Copied!&quot;) appears after a
        successful copy.
      </p>

      <h2>Message Actions</h2>
      <p>
        Hovering over any message in the chat reveals a set of action buttons. The available
        actions depend on whether the message is yours or the agent&apos;s:
      </p>
      <ul>
        <li><strong>Copy text</strong> — Copies the full message content to your clipboard. Available on both user and agent messages.</li>
        <li><strong>Retry message</strong> — Available on agent responses. Discards the current response and asks the agent to regenerate it. Useful when a response is unsatisfactory or incomplete.</li>
        <li><strong>Edit and resend</strong> — Available on your own messages. Opens the message in the input field for editing. After modifying the text, press Enter to send the updated message and receive a new response.</li>
      </ul>
      <p>
        The retry action sends the exact same user message again, which may produce a
        different response depending on the model&apos;s temperature setting. Edit and resend
        lets you refine your prompt to get a more targeted answer.
      </p>

      <h2>Mobile-Responsive Layout</h2>
      <p>
        The chat interface is fully responsive and optimized for mobile devices. On smaller
        screens, the agent selector sidebar collapses into a hamburger menu accessible from
        the top-left corner. Tapping the menu icon slides the sidebar into view as an overlay,
        and selecting an agent automatically closes it to maximize the chat area.
      </p>
      <p>
        The message input area remains fixed at the bottom of the screen on mobile, with the
        conversation scrolling above it. The attachment button and send button are sized for
        comfortable touch interaction.
      </p>

      <h2>Read Receipts</h2>
      <p>
        Each message you send displays a read receipt indicator beneath it. The indicator
        shows two states:
      </p>
      <ul>
        <li><strong>Sent</strong> — A single checkmark indicating your message has been delivered to the agent.</li>
        <li><strong>Read</strong> — Double checkmarks indicating the agent has received and is processing your message.</li>
      </ul>
      <p>
        Read receipts provide confirmation that your message was successfully transmitted to
        the agent, which is particularly useful when network conditions are uncertain.
      </p>

      <h2>Sound Toggle</h2>
      <p>
        A sound toggle button in the chat header lets you enable or disable audio notifications
        for new messages. When enabled, a subtle notification sound plays each time the agent
        sends a new response. This is useful when you are multitasking and want to be alerted
        when the agent has finished generating its reply.
      </p>
      <p>
        The sound preference is saved to your browser and persists across sessions. The
        default state is off.
      </p>

      <h2>Export Conversations</h2>
      <p>
        You can export any conversation from the chat interface for record-keeping, sharing,
        or analysis. Click the export button in the chat header to download the current
        conversation. Export options include:
      </p>
      <ul>
        <li><strong>Plain text (.txt)</strong> — A simple text file with messages labeled by sender and timestamp.</li>
        <li><strong>Markdown (.md)</strong> — A formatted markdown document preserving code blocks, lists, and other formatting from agent responses.</li>
        <li><strong>JSON (.json)</strong> — A structured data file containing all message metadata, useful for programmatic analysis.</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          Use JSON exports to analyze agent performance programmatically. The JSON format
          includes timestamps, response times, and token counts for each message, making it
          ideal for building custom analytics.
        </p>
      </div>

      <h2>Markdown Rendering</h2>
      <p>
        Agent responses are rendered with full markdown support. This includes:
      </p>
      <ul>
        <li>Headings, bold, italic, and strikethrough text.</li>
        <li>Ordered and unordered lists with proper nesting.</li>
        <li>Inline code and fenced code blocks with syntax highlighting.</li>
        <li>Tables with header rows and alignment.</li>
        <li>Blockquotes for cited or referenced content.</li>
        <li>Hyperlinks that open in a new tab.</li>
      </ul>
      <p>
        Markdown rendering ensures that agent responses are easy to read and visually
        structured, especially when the agent produces long-form content such as reports,
        documentation, or multi-step instructions.
      </p>

      <h2>Related Documentation</h2>
      <ul>
        <li><Link href="/docs/agents" className="text-primary hover:underline">Agents</Link> — Deploy agents and use the quick test feature.</li>
        <li><Link href="/docs/store" className="text-primary hover:underline">Agent Store</Link> — Find new agents to chat with.</li>
        <li><Link href="/docs/models" className="text-primary hover:underline">AI Models</Link> — Switch models to change response quality and speed.</li>
        <li><Link href="/docs/vps" className="text-primary hover:underline">VPS Management</Link> — Ensure your VPS is running for chat to function.</li>
        <li><Link href="/docs/dashboard" className="text-primary hover:underline">Dashboard Overview</Link> — View conversation metrics on the dashboard.</li>
      </ul>
    </article>
  );
}
