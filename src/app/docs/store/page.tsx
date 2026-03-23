import Link from "next/link";

export default function DocsAgentStorePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Agent Store</h1>
      <p className="text-muted-foreground text-lg">
        The Agent Store is your marketplace for pre-built AI agents. Browse a curated catalog
        of ready-to-deploy agents, compare their capabilities, read user reviews, and add
        them to your instance with a single click.
      </p>

      <h2>Browsing the Store</h2>
      <p>
        The store presents agents in a card-based grid layout. Each agent card displays:
      </p>
      <ul>
        <li><strong>Agent name</strong> — The name of the agent (e.g., &quot;Support Bot&quot;, &quot;Research Bot&quot;).</li>
        <li><strong>Description</strong> — A concise summary of what the agent does and its primary use case.</li>
        <li><strong>Category</strong> — A label indicating the agent&apos;s specialization area.</li>
        <li><strong>Price</strong> — The cost to add the agent to your library. Agents marked with a &quot;Free — Limited Time&quot; badge can be added at no additional cost.</li>
        <li><strong>Rating</strong> — The average user rating displayed as 1-5 stars.</li>
      </ul>
      <p>
        Cards are designed for quick scanning. The most relevant information — name, category,
        and rating — is visible at a glance, with the full description available on hover or
        by clicking into the agent detail page.
      </p>

      <h2>Agent Detail Page</h2>
      <p>
        Clicking on any agent card navigates to its dedicated detail page at{" "}
        <code>/store/[id]</code>. The detail page provides comprehensive information about
        the agent:
      </p>
      <ul>
        <li><strong>Full description</strong> — An in-depth explanation of the agent&apos;s purpose, behavior, and personality.</li>
        <li><strong>Capabilities list</strong> — A structured list of everything the agent can do, such as answering FAQs, handling refunds, generating reports, or performing web searches.</li>
        <li><strong>Tools used</strong> — The specific tools and integrations the agent relies on (e.g., knowledge base search, web browsing, API calls).</li>
        <li><strong>Setup guide</strong> — Step-by-step instructions for deploying and configuring the agent after adding it to your library.</li>
        <li><strong>User reviews</strong> — Ratings and written feedback from other ClawHQ users.</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          Always read the setup guide before deploying a new agent. Some agents require specific
          channel configurations or knowledge base content to function optimally.
        </p>
      </div>

      <h2>Search and Autocomplete</h2>
      <p>
        The search bar at the top of the store supports real-time autocomplete. As you type,
        matching agents appear in a dropdown below the search field, showing the agent name,
        category, and rating. Press Enter to search or click a suggestion to navigate directly
        to that agent&apos;s detail page.
      </p>
      <p>
        Search matches against agent names, descriptions, categories, and capability keywords.
        For example, searching &quot;refund&quot; will surface the Support Bot because its capabilities
        include handling refund requests.
      </p>

      <h2>Category Filter Tabs</h2>
      <p>
        The store includes category filter tabs that let you narrow the displayed agents by
        type. The available categories are:
      </p>
      <ul>
        <li><strong>All</strong> — Shows every agent in the store.</li>
        <li><strong>Support</strong> — Agents designed for customer service, FAQ handling, and ticket management.</li>
        <li><strong>Sales</strong> — Agents focused on product recommendations, upselling, and lead qualification.</li>
        <li><strong>Research</strong> — Agents that perform information lookup, summarization, and data gathering.</li>
        <li><strong>Content</strong> — Agents for writing, editing, and content creation tasks.</li>
        <li><strong>Data</strong> — Agents specialized in data analysis, reporting, and insights generation.</li>
        <li><strong>Manager</strong> — Agents for task coordination, project management, and workflow orchestration.</li>
        <li><strong>Reviewer</strong> — Agents that review code, content, or documents and provide structured feedback.</li>
      </ul>
      <p>
        The active category tab is visually highlighted. Clicking a tab immediately filters
        the grid to show only agents in that category. The agent count for each category is
        displayed in the tab label.
      </p>

      <h2>Agent Comparison</h2>
      <p>
        When deciding between similar agents, the comparison feature lets you evaluate two
        agents side by side. Select the agents you want to compare using the checkbox on each
        card, then click the &quot;Compare&quot; button that appears in the toolbar.
      </p>
      <p>The comparison view displays:</p>
      <ul>
        <li>Both agent names and descriptions in adjacent columns.</li>
        <li>A row-by-row capability comparison showing which features each agent supports.</li>
        <li>The tools each agent uses, highlighting differences.</li>
        <li>User ratings and review counts for both agents.</li>
        <li>Price comparison (if applicable).</li>
      </ul>
      <p>
        This is particularly useful when choosing between agents in the same category. For
        example, you might compare two Support-category agents to determine which one better
        matches your specific customer service needs.
      </p>

      <h2>User Reviews and Ratings</h2>
      <p>
        Every agent in the store has a reviews section where ClawHQ users can share their
        experience. Reviews include:
      </p>
      <ul>
        <li><strong>Star rating</strong> — A 1-5 star score reflecting the reviewer&apos;s overall satisfaction.</li>
        <li><strong>Written feedback</strong> — A text review describing what the reviewer liked, disliked, or found noteworthy about the agent.</li>
        <li><strong>Date</strong> — When the review was submitted.</li>
      </ul>
      <p>
        The aggregate rating (displayed on the agent card) is the average of all submitted
        star ratings. You can sort reviews by most recent, highest rated, or lowest rated
        to get a balanced perspective.
      </p>

      <div className="not-prose bg-[color-mix(in_srgb,var(--warning),transparent_95%)] border border-[color-mix(in_srgb,var(--warning),transparent_80%)] rounded-lg p-4 my-6">
        <p className="font-semibold text-[var(--warning)] mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          You can only submit a review for an agent that you have deployed and used. Reviews
          cannot be edited after submission, so take a moment to thoroughly test the agent
          before leaving your feedback.
        </p>
      </div>

      <h2>Free Agents</h2>
      <p>
        Agents marked with the &quot;Free — Limited Time&quot; badge can be added to your library at
        no additional cost. These agents are fully functional and receive the same updates as
        paid agents. The free badge indicates a promotional offer that may be revised in the
        future.
      </p>

      <h2>Pre-Built Agents</h2>
      <p>
        The following agents are available in the ClawHQ Agent Store:
      </p>
      <ul>
        <li><strong>Support Bot</strong> — A customer service agent that handles common inquiries, processes refund requests, manages FAQ responses, and escalates complex issues to human operators when needed.</li>
        <li><strong>Research Bot</strong> — An information lookup agent that searches the web, summarizes findings, compiles reports, and answers factual questions with cited sources.</li>
        <li><strong>Writer Bot</strong> — A content creation agent that drafts blog posts, marketing copy, email templates, social media content, and other written material in your brand&apos;s voice.</li>
        <li><strong>Data Bot</strong> — A data analysis agent that interprets datasets, generates visualizations, identifies trends, and produces actionable insights from structured data.</li>
        <li><strong>Sales Bot</strong> — A product recommendation agent that qualifies leads, suggests relevant products or services, handles objections, and guides prospects through the sales funnel.</li>
        <li><strong>Reviewer Bot</strong> — A code and content review agent that analyzes submissions for quality, correctness, style consistency, and best practices, providing structured feedback.</li>
        <li><strong>Manager Bot</strong> — A task coordination agent that tracks project progress, assigns tasks, sends reminders, and provides status summaries across team workflows.</li>
      </ul>

      <h2>Related Agents Suggestions</h2>
      <p>
        At the bottom of each agent&apos;s detail page, a &quot;Related Agents&quot; section displays
        agents that complement or share similarities with the one you are viewing. Suggestions
        are based on category overlap, shared capabilities, and what other users have deployed
        alongside the current agent.
      </p>
      <p>
        For example, viewing the Support Bot detail page may suggest the Sales Bot (for
        upselling during support conversations) and the Writer Bot (for drafting response
        templates).
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          After adding an agent from the store, navigate to the{" "}
          <Link href="/docs/agents" className="text-primary hover:underline">Agents</Link> page
          to deploy it to your VPS. Agents added from the store are not automatically deployed.
        </p>
      </div>

      <h2>Related Documentation</h2>
      <ul>
        <li><Link href="/docs/agents" className="text-primary hover:underline">Agents</Link> — Deploy and manage agents after adding them from the store.</li>
        <li><Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> — Test your newly added agents in real-time conversations.</li>
        <li><Link href="/docs/models" className="text-primary hover:underline">AI Models</Link> — Choose the right model to power your agents.</li>
        <li><Link href="/docs/dashboard" className="text-primary hover:underline">Dashboard Overview</Link> — Monitor agent activity from the main dashboard.</li>
      </ul>
    </article>
  );
}
