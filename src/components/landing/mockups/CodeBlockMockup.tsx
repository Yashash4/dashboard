"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

const CODE_LINES = [
  { text: 'curl -X POST https://api.clawhq.tech/v1/chat \\', color: "text-foreground" },
  { text: '  -H "Authorization: Bearer sk_live_..." \\', color: "text-[#ffe0c2]" },
  { text: '  -H "Content-Type: application/json" \\', color: "text-[#ffe0c2]" },
  { text: "  -d '{\"message\": \"Hello!\", \"agent\": \"support\"}'", color: "text-primary" },
];

const RESPONSE_LINES = [
  { text: '{', color: "text-muted-foreground" },
  { text: '  "reply": "Hi! How can I help?",', color: "text-primary" },
  { text: '  "status": 200', color: "text-[#ffe0c2]" },
  { text: '}', color: "text-muted-foreground" },
];

const FULL_CODE = CODE_LINES.map((l) => l.text).join("\n");
const FULL_RESPONSE = RESPONSE_LINES.map((l) => l.text).join("\n");

export function CodeBlockMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-50px" });
  const [typedCode, setTypedCode] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [showBadge, setShowBadge] = useState(false);
  const [phase, setPhase] = useState<"code" | "pause" | "response" | "badge" | "done">("code");
  const charIdx = useRef(0);

  const reset = useCallback(() => {
    setTypedCode("");
    setTypedResponse("");
    setShowBadge(false);
    charIdx.current = 0;
    setPhase("code");
  }, []);

  // Typing code
  useEffect(() => {
    if (!inView || phase !== "code") return;
    const id = setInterval(() => {
      charIdx.current++;
      if (charIdx.current >= FULL_CODE.length) {
        setTypedCode(FULL_CODE);
        clearInterval(id);
        setPhase("pause");
      } else {
        setTypedCode(FULL_CODE.slice(0, charIdx.current));
      }
    }, 18);
    return () => clearInterval(id);
  }, [inView, phase]);

  // Pause then type response
  useEffect(() => {
    if (phase !== "pause") return;
    const t = setTimeout(() => {
      charIdx.current = 0;
      setPhase("response");
    }, 600);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "response") return;
    const id = setInterval(() => {
      charIdx.current++;
      if (charIdx.current >= FULL_RESPONSE.length) {
        setTypedResponse(FULL_RESPONSE);
        clearInterval(id);
        setPhase("badge");
      } else {
        setTypedResponse(FULL_RESPONSE.slice(0, charIdx.current));
      }
    }, 25);
    return () => clearInterval(id);
  }, [phase]);

  // Show badge then loop
  useEffect(() => {
    if (phase !== "badge") return;
    setShowBadge(true);
    const t = setTimeout(() => {
      setPhase("done");
    }, 500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(reset, 4000);
    return () => clearTimeout(t);
  }, [phase, reset]);

  function renderTypedLines(typed: string, lineData: typeof CODE_LINES) {
    const lines = typed.split("\n");
    return lines.map((line, i) => {
      const color = lineData[i]?.color || "text-foreground";
      return (
        <div key={i} className={color}>
          {line}
        </div>
      );
    });
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto font-mono rounded-lg border border-border bg-[#191919] overflow-hidden"
    >
      {/* Window Chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-[#191919]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="text-[10px] text-muted-foreground ml-2">terminal</span>

        {/* 200 OK Badge */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={showBadge ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-medium"
        >
          200 OK
        </motion.span>
      </div>

      {/* Code Content */}
      <div className="p-3 text-[11px] leading-relaxed min-h-[180px]">
        <div className="mb-1 text-muted-foreground text-[10px]">$ request</div>
        <div className="whitespace-pre-wrap">
          {renderTypedLines(typedCode, CODE_LINES)}
          {phase === "code" && (
            <span className="inline-block w-[2px] h-3 bg-primary animate-pulse" />
          )}
        </div>

        {(phase === "response" || phase === "badge" || phase === "done") && (
          <>
            <div className="mt-3 mb-1 text-muted-foreground text-[10px]">$ response</div>
            <div className="whitespace-pre-wrap">
              {renderTypedLines(typedResponse, RESPONSE_LINES)}
              {phase === "response" && (
                <span className="inline-block w-[2px] h-3 bg-primary animate-pulse" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
