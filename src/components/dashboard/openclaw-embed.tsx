"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface OpenClawEmbedProps {
  dashboardUrl: string;
  embedKey: string;
}

export function OpenClawEmbed({ dashboardUrl, embedKey }: OpenClawEmbedProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!embedKey) {
      // No embed key — just load the iframe directly
      setReady(true);
      return;
    }

    // Pre-authenticate by calling the auth endpoint to set a cookie
    // The cookie bypasses Basic Auth for subsequent iframe requests
    const authUrl = `${dashboardUrl}/_claw_auth?_key=${encodeURIComponent(embedKey)}`;

    fetch(authUrl, { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setReady(true);
        } else {
          // Auth endpoint failed — fallback to direct iframe (may prompt for Basic Auth)
          setReady(true);
        }
      })
      .catch(() => {
        // Network error — still try the iframe
        setReady(true);
      });
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
