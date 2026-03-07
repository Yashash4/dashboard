"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface SSLResult {
  valid: boolean;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  error?: string;
}

export function SSLChecker({ hostname }: { hostname: string }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<SSLResult | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/vps/ssl-check", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        toast.error(data.error || "Failed to check SSL");
      }
    } catch {
      toast.error("Failed to check SSL");
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">SSL Certificate</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheck}
            disabled={checking}
          >
            {checking ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Checking
              </>
            ) : (
              "Check SSL"
            )}
          </Button>
        </div>
        <CardDescription className="font-mono text-xs">
          {hostname}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!result ? (
          <p className="text-sm text-muted-foreground">
            Click &quot;Check SSL&quot; to verify your certificate
          </p>
        ) : result.error && !result.valid ? (
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-500">SSL Error</p>
              <p className="text-xs text-muted-foreground">{result.error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.valid ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/10">
                    Valid
                  </Badge>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Expired</Badge>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {result.issuer && (
                <div>
                  <p className="text-muted-foreground">Issuer</p>
                  <p className="font-medium">{result.issuer}</p>
                </div>
              )}
              {result.daysRemaining !== undefined && (
                <div>
                  <p className="text-muted-foreground">Days Remaining</p>
                  <p
                    className={`font-medium font-mono ${
                      result.daysRemaining < 14
                        ? "text-yellow-500"
                        : result.daysRemaining < 0
                          ? "text-red-500"
                          : ""
                    }`}
                  >
                    {result.daysRemaining}
                  </p>
                </div>
              )}
              {result.validFrom && (
                <div>
                  <p className="text-muted-foreground">Valid From</p>
                  <p className="font-medium">{formatDate(result.validFrom)}</p>
                </div>
              )}
              {result.validTo && (
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">{formatDate(result.validTo)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
