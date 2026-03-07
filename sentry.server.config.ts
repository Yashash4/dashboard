import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only track important errors — 5K/month free tier limit
  tracesSampleRate: 0,

  beforeSend(event) {
    const message = event.exception?.values?.[0]?.value || "";

    // Skip Next.js internal redirects/not-found
    if (message.includes("NEXT_NOT_FOUND") || message.includes("NEXT_REDIRECT")) {
      return null;
    }

    return event;
  },
});
