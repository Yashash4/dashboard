"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface OpenClawEmbedProps {
  dashboardUrl: string;
  embedKey: string;
}

export function OpenClawEmbed({ dashboardUrl, embedKey }: OpenClawEmbedProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!embedKey) {
      // No embed key -- just load the iframe directly
      setReady(true);
      return;
    }

    // MED_34: AbortController to prevent state update on unmounted component
    const controller = new AbortController();

    const authUrl = `${dashboardUrl}/_claw_auth?_key=${encodeURIComponent(embedKey)}`;

    fetch(authUrl, { credentials: "include", signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setReady(true);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          // Network error -- still try the iframe
          setReady(true);
        }
      });

    return () => {
      controller.abort();
    };
  }, [dashboardUrl, embedKey]);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <iframe
      src={dashboardUrl}
      className="flex-1 w-full border-0"
      allow="clipboard-read; clipboard-write; storage-access"
      title="OpenClaw Dashboard"
    />
  );
}
