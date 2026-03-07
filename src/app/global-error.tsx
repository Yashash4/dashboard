"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <span className="text-red-500 text-xl font-bold font-mono">!</span>
            </div>
            <h2 className="text-xl font-bold font-mono">Something went wrong</h2>
            <p className="text-sm text-gray-400">
              An unexpected error occurred. Our team has been notified.
            </p>
            <Button onClick={reset} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
