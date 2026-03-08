"use client";

import { CopyButton } from "@/components/ui/copy-button";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  return (
    <div className="relative border border-white/10 bg-[hsl(0_0%_4%)] overflow-hidden">
      {filename && (
        <div className="border-b border-white/10 px-4 py-2 bg-white/[0.02] flex items-center justify-between">
          <span className="font-mono text-[11px] text-white/40">{filename}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="p-4 overflow-x-auto">
          <code className="font-mono text-[13px] leading-relaxed text-white/80 whitespace-pre">
            {code}
          </code>
        </pre>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton value={code} />
        </div>
      </div>
      {language && (
        <div className="absolute bottom-2 right-3">
          <span className="font-mono text-[9px] text-white/15 uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
    </div>
  );
}
