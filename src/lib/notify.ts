import { createAdminClient } from "@/lib/supabase-admin";

export async function createNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    href?: string;
  }
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("user_notifications").insert({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href || null,
  });
}
