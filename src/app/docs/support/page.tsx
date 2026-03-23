import Link from "next/link";

export default function DocsSupportPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Support</h1>
      <p className="text-muted-foreground text-lg">
        ClawHQ includes a built-in support ticket system so you can get help
        directly from your dashboard. Every ticket is tracked with a unique
        reference number, status timeline, and full conversation history.
      </p>

      <h2>Creating a Ticket</h2>
      <p>
        To create a new support ticket, navigate to{" "}
        <strong>Support &gt; New Ticket</strong> in your dashboard. Fill in the
        following fields:
      </p>
      <ul>
        <li><strong>Subject</strong> &mdash; A brief summary of your issue or request.</li>
        <li><strong>Description</strong> &mdash; A detailed explanation. Include any error messages, steps to reproduce, or relevant context.</li>
        <li>
          <strong>Priority</strong> &mdash; Select one of: <code>Low</code>,{" "}
          <code>Medium</code>, <code>High</code>, or <code>Urgent</code>.
          Priority affects how quickly your ticket is reviewed.
        </li>
        <li>
          <strong>Category</strong> &mdash; Choose the category that best fits
          your request: <code>Billing</code>, <code>Technical</code>,{" "}
          <code>Feature Request</code>, <code>Account</code>, or{" "}
          <code>Other</code>.
        </li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary">Tip</p>
        <p className="text-sm text-muted-foreground mt-1">
          Choosing the correct category helps route your ticket to the right team
          member. Billing questions go to the finance team, while technical
          issues go to the engineering team.
        </p>
      </div>

      <h2>Ticket Reference Numbers</h2>
      <p>
        Every ticket is assigned a unique reference number in the format{" "}
        <code>CLW-001</code>, <code>CLW-002</code>, and so on. These numbers
        auto-increment and are unique across your account. Use the reference
        number when communicating about a ticket via other channels so the
        support team can locate it quickly.
      </p>

      <h2>File Attachments</h2>
      <p>
        You can attach files to both new tickets and replies. Attachments help
        the support team understand your issue faster, especially for visual bugs
        or error logs.
      </p>
      <table>
        <thead>
          <tr>
            <th>Constraint</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Maximum files per message</td><td>5</td></tr>
          <tr><td>Maximum file size</td><td>10 MB each</td></tr>
          <tr><td>Supported image formats</td><td>PNG, JPG, GIF, WebP</td></tr>
          <tr><td>Supported document formats</td><td>PDF, TXT, CSV</td></tr>
        </tbody>
      </table>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-amber-400">Warning</p>
        <p className="text-sm text-muted-foreground mt-1">
          Files that exceed the size limit or use an unsupported format will be
          rejected. Compress large files or convert them to a supported format
          before uploading.
        </p>
      </div>

      <h2>Rich Text Formatting</h2>
      <p>
        Ticket descriptions and replies support rich text formatting. You can
        use bold, italic, code blocks, bulleted lists, and numbered lists to
        structure your messages clearly. The editor toolbar provides buttons for
        each formatting option, or you can use standard keyboard shortcuts.
      </p>

      <h2>Ticket Status Lifecycle</h2>
      <p>
        Every ticket progresses through a defined set of statuses. The status
        timeline is visible on the ticket detail page, showing exactly when each
        transition occurred.
      </p>
      <ol>
        <li>
          <strong>Created</strong> &mdash; The ticket has been submitted and is
          awaiting review by the support team.
        </li>
        <li>
          <strong>In Progress</strong> &mdash; A support team member is actively
          working on your ticket.
        </li>
        <li>
          <strong>Resolved</strong> &mdash; The support team has provided a
          solution or completed the request.
        </li>
        <li>
          <strong>Auto-Closed</strong> &mdash; If a resolved ticket receives no
          further replies within 48 hours, it is automatically closed.
        </li>
      </ol>
      <p>
        Each status transition is recorded with a timestamp in the ticket&apos;s
        status timeline, giving you a complete audit trail of how your request
        was handled.
      </p>

      <h2>Reopening Tickets</h2>
      <p>
        If a resolved ticket did not fully address your issue, you can reopen it
        by clicking the <strong>Reopen</strong> button on the ticket detail page.
        Reopening a ticket moves it back to <strong>In Progress</strong> status
        and notifies the support team. You can only reopen tickets that are in
        the <strong>Resolved</strong> state; auto-closed tickets must be
        reopened by creating a new ticket and referencing the original reference
        number.
      </p>

      <h2>Satisfaction Rating</h2>
      <p>
        After a ticket is resolved, you will be prompted to rate your support
        experience on a scale of 1 to 5 stars. Your feedback is anonymous to
        individual agents but is used in aggregate to improve support quality.
        Rating is optional but appreciated.
      </p>

      <h2>Searching Tickets</h2>
      <p>
        The ticket list page includes a search bar that filters tickets by
        keyword. The search checks ticket subjects, descriptions, and reply
        content. You can also filter by status (open, resolved, closed) and
        category to narrow results further.
      </p>

      <h2>Estimated Response Times</h2>
      <p>
        Response times vary by plan tier. These are target first-response times
        and represent the time until a support team member begins reviewing your
        ticket.
      </p>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Target First Response</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Starter</td><td>24 hours</td></tr>
          <tr><td>Pro</td><td>12 hours</td></tr>
          <tr><td>Ultra</td><td>4 hours</td></tr>
          <tr><td>Enterprise</td><td>1 hour (SLA-backed)</td></tr>
        </tbody>
      </table>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary">Tip</p>
        <p className="text-sm text-muted-foreground mt-1">
          Enterprise plans include a formal SLA with guaranteed response times.
          If a response is not received within the SLA window, automatic
          escalation procedures are triggered. See{" "}
          <Link href="/docs/billing" className="text-primary hover:underline">Billing</Link>{" "}
          for plan details.
        </p>
      </div>

      <h2>Email Notifications</h2>
      <p>
        You will receive email notifications whenever a support team member
        replies to your ticket. Notifications are sent to the email address
        associated with your ClawHQ account. You can manage notification
        preferences from your{" "}
        <Link href="/docs/account" className="text-primary hover:underline">Account Settings</Link>.
      </p>

      <h2>Auto-Deletion Policy</h2>
      <p>
        Resolved tickets are automatically deleted 48 hours after resolution if
        no further activity occurs. If you need to preserve a ticket&apos;s
        contents, reopen it before the 48-hour window expires or copy the
        relevant information to your own records. This policy helps keep the
        ticket system clean and focused on active issues.
      </p>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-amber-400">Warning</p>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-deleted tickets cannot be recovered. Make sure to save any
          important information from resolved tickets before the 48-hour
          deletion window closes.
        </p>
      </div>

      <h2>Best Practices</h2>
      <ul>
        <li>Include screenshots or error logs as attachments when reporting technical issues.</li>
        <li>Use the correct category and priority to ensure fast routing.</li>
        <li>Reference specific pages, agents, or channels by name to help the support team reproduce issues.</li>
        <li>Check the <Link href="/docs/faq" className="text-primary hover:underline">FAQ</Link> before opening a ticket &mdash; your question may already be answered.</li>
        <li>Reply to existing tickets rather than creating duplicates for the same issue.</li>
      </ul>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/account" className="text-primary hover:underline">Manage notification preferences</Link> for ticket replies.</li>
        <li><Link href="/docs/billing" className="text-primary hover:underline">Compare plans</Link> to understand response time differences.</li>
        <li><Link href="/docs/faq" className="text-primary hover:underline">Search the FAQ</Link> for self-service answers.</li>
      </ul>
    </article>
  );
}
