"use client";

import { useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "clawhq-chat-sound";

export function useChatSound() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setEnabled(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const playNotification = useCallback(() => {
    if (!enabled) return;
    if (document.hasFocus()) return;

    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);

      oscillator.onended = () => ctx.close();
    } catch {
      // Web Audio API not available
    }
  }, [enabled]);

  return { enabled, toggle, playNotification };
}

interface ChatSoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function ChatSoundToggle({ enabled, onToggle }: ChatSoundToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="text-xs text-muted-foreground"
      title={enabled ? "Mute notifications" : "Enable sound notifications"}
    >
      {enabled ? (
        <Volume2 className="h-3.5 w-3.5" />
      ) : (
        <VolumeX className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
