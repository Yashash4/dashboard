import { createAdminClient } from "@/lib/supabase-admin";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email notification.
 *
 * Currently a no-op placeholder. When a real email provider is configured
 * (e.g. Resend, SendGrid, AWS SES), replace the implementation below.
 *
 * The function checks user notification preferences before sending.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // TODO: Replace with real email provider
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: "ClawHQ <noreply@clawhq.tech>", ...payload });

  // For now, just log the intent (no console.log in prod — this is a placeholder)
  void payload;
  return false;
}

/**
 * Check if a user has email notifications enabled for a specific type.
 */
export async function shouldSendEmail(
  userId: string,
  notificationType: string
): Promise<{ enabled: boolean; email: string | null }> {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("email, notification_preferences")
    .eq("id", userId)
    .single();

  if (!user?.email) return { enabled: false, email: null };

  const prefs = (user.notification_preferences as Record<string, any>) || {};
  const typeKey = `email_${notificationType}`;

  // Default: email notifications are enabled
  const enabled = prefs[typeKey] !== false;

  return { enabled, email: user.email };
}

/**
 * Send a ticket reply email notification to a user.
 */
export async function notifyTicketReply(
  userId: string,
  ticketId: string,
  ticketSubject: string,
  replyPreview: string
): Promise<void> {
  const { enabled, email } = await shouldSendEmail(userId, "ticket_replies");
  if (!enabled || !email) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.clawhq.tech";

  await sendEmail({
    to: email,
    subject: `[ClawHQ] New reply on: ${ticketSubject}`,
    text: `You have a new reply on your support ticket "${ticketSubject}".\n\n${replyPreview}\n\nView the full thread: ${appUrl}/support/${ticketId}`,
    html: `
      <div style="font-family: monospace; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fff; font-size: 14px;">New reply on your ticket</h2>
        <p style="color: #999; font-size: 13px;">${ticketSubject}</p>
        <div style="background: #191919; border: 1px solid #201e18; padding: 16px; margin: 16px 0;">
          <p style="color: #ccc; font-size: 13px; margin: 0;">${replyPreview}</p>
        </div>
        <a href="${appUrl}/support/${ticketId}" style="color: #6b8f5e; font-size: 13px;">View full thread →</a>
        <hr style="border: 1px solid #201e18; margin: 24px 0;" />
        <p style="color: #666; font-size: 11px;">
          You received this because you have email notifications enabled.
          <a href="${appUrl}/account" style="color: #666;">Manage preferences</a>
        </p>
      </div>
    `,
  });
}
