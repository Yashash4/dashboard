"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";

const RESPONSE_TEXT =
  "Of course! Your order #12345 was shipped on March 10 and is expected to arrive by March 17. Would you like me to send you the tracking link?";

type Phase = "idle" | "typing" | "streaming" | "done";

export function ChatMockup() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [streamedText, setStreamedText] = useState("");
  const charIndex = useRef(0);

  const reset = useCallback(() => {
    setPhase("idle");
    setStreamedText("");
    charIndex.current = 0;
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("typing"), 1000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase === "typing") {
      const t = setTimeout(() => setPhase("streaming"), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "streaming") {
      const id = setInterval(() => {
        charIndex.current += 1;
        if (charIndex.current >= RESPONSE_TEXT.length) {
          setStreamedText(RESPONSE_TEXT);
          clearInterval(id);
          setPhase("done");
        } else {
          setStreamedText(RESPONSE_TEXT.slice(0, charIndex.current));
        }
      }, 20);
      return () => clearInterval(id);
    }
    if (phase === "done") {
      const t = setTimeout(() => reset(), 3000);
      return () => clearTimeout(t);
    }
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("typing"), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, reset]);

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border border-border bg-card overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[#191919]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-foreground text-[11px] font-medium">Support Agent</span>
        <span className="text-[10px] text-muted-foreground ml-auto">Online</span>
      </div>

      {/* Chat Area */}
      <div className="p-3 space-y-2 min-h-[180px] bg-[#191919]">
        {/* User message */}
        <div className="flex justify-end">
          <div className="rounded-lg bg-primary/15 text-primary px-3 py-1.5 max-w-[75%] text-[11px]">
            Can you check the status of my last order?
          </div>
        </div>

        {/* Bot response area */}
        <AnimatePresence mode="wait">
          {phase === "typing" && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-lg bg-[#222222] border border-border px-3 py-2 text-[11px] text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </span>
              </div>
            </motion.div>
          )}

          {(phase === "streaming" || phase === "done") && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-lg bg-[#222222] border border-border px-3 py-2 max-w-[80%] text-[11px] text-foreground leading-relaxed">
                {streamedText}
                {phase === "streaming" && (
                  <span className="inline-block w-[2px] h-3 bg-primary ml-0.5 animate-pulse" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-[#191919]">
        <div className="flex-1 rounded-md bg-[#222222] border border-border px-2 py-1.5 text-[11px] text-muted-foreground">
          Type a message...
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 text-primary">
          <Send className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
