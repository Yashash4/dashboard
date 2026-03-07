"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (!link?.href) return;
      try {
        const url = new URL(link.href);
        if (
          url.origin === window.location.origin &&
          url.pathname !== pathname
        ) {
          setIsNavigating(true);
          setProgress(0);
        }
      } catch {
        // ignore invalid URLs
      }
    },
    [pathname]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [handleClick]);

  // Animate progress
  useEffect(() => {
    if (!isNavigating) return;
    const t1 = setTimeout(() => setProgress(30), 50);
    const t2 = setTimeout(() => setProgress(60), 400);
    const t3 = setTimeout(() => setProgress(80), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isNavigating]);

  // Complete on pathname change
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
