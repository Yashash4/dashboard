import WebhooksDocs from "@/components/docs/webhooks-docs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhooks API Documentation | ClawHQ",
  description:
    "Complete Webhooks API reference for ClawHQ. Learn how to receive real-time event notifications with HMAC-signed webhooks for agent deployments, messages, and VPS status changes.",
  openGraph: {
    title: "Webhooks API Documentation | ClawHQ",
    description:
      "Real-time event notifications with HMAC-signed webhooks for your AI agents.",
    type: "website",
  },
};

export default function WebhooksDocsPage() {
  return <WebhooksDocs />;
}
