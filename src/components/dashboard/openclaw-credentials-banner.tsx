"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OpenClawCredentialsBannerProps {
  username: string;
  password: string;
}

export function OpenClawCredentialsBanner({
  username,
  password,
}: OpenClawCredentialsBannerProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<"user" | "pass" | null>(null);

  const copyToClipboard = (text: string, type: "user" | "pass") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex items-center gap-3 px-6 py-2 bg-muted/50 border-b border-border text-sm flex-wrap">
      <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">Login credentials:</span>
      <span className="font-mono text-foreground">{username}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => copyToClipboard(username, "user")}
        aria-label="Copy username"
      >
        {copied === "user" ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
      <span className="text-muted-foreground">/</span>
      <span className="font-mono text-foreground">
        {showPassword ? password : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => copyToClipboard(password, "pass")}
        aria-label="Copy password"
      >
        {copied === "pass" ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
