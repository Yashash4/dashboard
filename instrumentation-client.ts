import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only track important errors — 5K/month free tier limit
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  beforeSend(event) {
    // Skip non-important errors to conserve quota
    const message = event.exception?.values?.[0]?.value || "";

    // Skip network/fetch errors (user offline, etc.)
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return null;
    }

    // Skip ResizeObserver errors (browser noise)
    if (message.includes("ResizeObserver")) {
      return null;
    }

    // Skip cancelled navigation
    if (message.includes("NEXT_NOT_FOUND") || message.includes("NEXT_REDIRECT")) {
      return null;
    }

    // Skip hydration errors
    if (message.includes("Hydration") || message.includes("hydrat")) {
      return null;
    }

    return event;
  },
});
