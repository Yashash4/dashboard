import Link from "next/link";

export default function DocsAccountSettingsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Account Settings</h1>
      <p className="text-muted-foreground text-lg">
        The Account Settings page lets you manage your profile, security,
        notifications, timezone, and data. All changes are saved immediately
        unless otherwise noted.
      </p>

      <h2>Profile Avatar</h2>
      <p>
        Your avatar appears in the sidebar, in chat conversations, and on your
        account profile. You have two options for setting your avatar:
      </p>
      <ul>
        <li>
          <strong>Upload an image</strong> &mdash; Upload a PNG, JPG, GIF, or
          WebP file up to 2 MB in size. The image is automatically resized to
          200x200 pixels to ensure consistent display across the dashboard.
        </li>
        <li>
          <strong>Select an emoji</strong> &mdash; Choose from a set of emoji
          icons if you prefer not to upload a photo. The emoji is displayed at
          the same size as uploaded avatars.
        </li>
      </ul>
      <p>
        To change your avatar, click on your current avatar image on the Account
        Settings page and select <strong>Upload Image</strong> or{" "}
        <strong>Choose Emoji</strong>.
      </p>

      <div className="not-prose border-l-2 border-emerald-500 bg-emerald-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--text-primary)]">Tip:</strong>{" "}
          Use a square image for best results. Non-square images will be
          center-cropped to fit the 200x200 pixel frame.
        </div>
      </div>

      <h2>Profile Information</h2>
      <p>
        Update your display name and email address from the profile section. Your
        display name is shown in the sidebar and in support ticket conversations.
        Changing your email address will require re-verification via a
        confirmation link sent to the new address.
      </p>

      <h2>Notification Preferences</h2>
      <p>
        ClawHQ sends notifications for important events across your account. You
        can toggle each notification type independently, and choose whether to
        receive them via email, in-app notifications, or both.
      </p>
      <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Event Type</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ticket replies</td>
            <td>A support team member replied to one of your tickets</td>
            <td>Email + In-app</td>
          </tr>
          <tr>
            <td>Agent errors</td>
            <td>An AI agent encountered an error while processing a message</td>
            <td>In-app only</td>
          </tr>
          <tr>
            <td>VPS status changes</td>
            <td>Your VPS went offline, restarted, or changed state</td>
            <td>Email + In-app</td>
          </tr>
          <tr>
            <td>Channel disconnects</td>
            <td>A connected channel lost its connection to the platform</td>
            <td>Email + In-app</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p>
        Toggle notifications by clicking the <strong>Email</strong> and{" "}
        <strong>In-app</strong> switches next to each event type. Changes take
        effect immediately.
      </p>

      <div className="not-prose border-l-2 border-emerald-500 bg-emerald-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--text-primary)]">Tip:</strong>{" "}
          Even if you disable email notifications, critical alerts (such as
          billing failures or account security events) will always be sent to
          your registered email address.
        </div>
      </div>

      <h2>Security</h2>
      <p>
        The Security section provides tools to manage your account&apos;s
        authentication and access.
      </p>

      <h3>Change Password</h3>
      <p>
        To update your password, fill in all three fields:
      </p>
      <ol>
        <li><strong>Current Password</strong> &mdash; Your existing password for verification.</li>
        <li><strong>New Password</strong> &mdash; Must be at least 8 characters. Use a mix of uppercase, lowercase, numbers, and symbols for maximum security.</li>
        <li><strong>Confirm New Password</strong> &mdash; Re-enter the new password to prevent typos.</li>
      </ol>
      <p>
        Click <strong>Update Password</strong> to save. You will remain logged in
        after changing your password, but all other active sessions will be
        invalidated.
      </p>

      <h3>Session Information</h3>
      <p>
        The security section displays your current session details including the
        browser, operating system, and IP address. You can also see your{" "}
        <strong>last login timestamp</strong>, which shows the date and time of
        your most recent authentication. Review this regularly to detect any
        unauthorized access to your account.
      </p>

      <div className="not-prose border-l-2 border-amber-500 bg-amber-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--warning)]">Warning:</strong>{" "}
          If you notice a login from an unfamiliar location or device, change
          your password immediately and{" "}
          <Link href="/docs/support" className="text-[var(--accent)] hover:underline">contact support</Link>{" "}
          to report the incident.
        </div>
      </div>

      <h2>Timezone Setting</h2>
      <p>
        Your timezone setting affects how all timestamps are displayed across
        the entire dashboard, including chat messages, ticket history, audit
        logs, analytics charts, and billing dates. Select your timezone from the
        dropdown menu. ClawHQ supports all standard IANA timezones (for example,{" "}
        <code>America/New_York</code>, <code>Europe/London</code>,{" "}
        <code>Asia/Kolkata</code>).
      </p>
      <p>
        The default timezone is <code>UTC</code>. Changing your timezone does not
        affect the underlying data &mdash; it only changes how timestamps are
        rendered in the user interface.
      </p>

      <h2>Data Export</h2>
      <p>
        You can download a complete copy of all your account data at any time.
        Click <strong>Export Data</strong> in the Account Settings page to
        generate a JSON bundle containing:
      </p>
      <ul>
        <li>Your profile information (name, email, preferences).</li>
        <li>All support tickets and their replies.</li>
        <li>Agent configurations and deployment settings.</li>
        <li>Channel connection records.</li>
        <li>Chat conversation history.</li>
        <li>Knowledge base documents and metadata.</li>
        <li>Webhook configurations.</li>
        <li>Audit log entries.</li>
      </ul>
      <p>
        The export is generated as a single <code>.json</code> file and
        downloaded to your browser. Large accounts may take a few moments to
        compile. You will see a progress indicator while the export is being
        prepared.
      </p>

      <div className="not-prose border-l-2 border-emerald-500 bg-emerald-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--text-primary)]">Tip:</strong>{" "}
          Use the data export feature to create periodic backups of your
          configuration. This is especially useful before making significant
          changes to your agent or channel setup.
        </div>
      </div>

      <h2>Danger Zone</h2>
      <p>
        The Danger Zone section at the bottom of the Account Settings page
        contains destructive actions that cannot be undone.
      </p>

      <h3>Delete Account</h3>
      <p>
        Deleting your account permanently removes all data associated with your
        ClawHQ account, including:
      </p>
      <ul>
        <li>Your user profile and preferences.</li>
        <li>All deployed agents and their configurations.</li>
        <li>Connected channels and their message history.</li>
        <li>Knowledge base documents.</li>
        <li>Support tickets.</li>
        <li>Your VPS instance and all data stored on it.</li>
        <li>Billing records and payment history.</li>
      </ul>
      <p>
        To delete your account, you must type your account email address into a
        confirmation field. This prevents accidental deletion. After typing the
        confirmation, click <strong>Delete Account</strong>. The deletion process
        begins immediately and cannot be cancelled once started.
      </p>

      <div className="not-prose border-l-2 border-amber-500 bg-amber-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--warning)]">Warning:</strong>{" "}
          Account deletion is permanent and irreversible. All data, including
          your VPS instance, will be destroyed. Export your data before deleting
          if you need to retain any information. If you have an active
          subscription, it will be cancelled and no refund will be issued for the
          remaining billing period.
        </div>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/billing" className="text-[var(--accent)] hover:underline">Manage your subscription</Link> and view payment history.</li>
        <li><Link href="/docs/support" className="text-[var(--accent)] hover:underline">Open a support ticket</Link> if you need account assistance.</li>
        <li><Link href="/docs/channels" className="text-[var(--accent)] hover:underline">Configure channels</Link> to connect your agents to messaging platforms.</li>
        <li><Link href="/docs/vps" className="text-[var(--accent)] hover:underline">Monitor your VPS</Link> for status and performance details.</li>
      </ul>
    </article>
  );
}
