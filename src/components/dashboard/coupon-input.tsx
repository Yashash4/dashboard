"use client";

import { useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CouponInput() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/billing/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to apply coupon");
        return;
      }

      toast.success(data.message || "Coupon applied successfully!");
      setCode("");
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Coupon / Referral Code</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            maxLength={20}
            className="flex-1 bg-transparent border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
            }}
          />
          <Button
            onClick={handleApply}
            disabled={isLoading || !code.trim()}
            size="sm"
          >
            {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Apply
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter a coupon or referral code to receive a discount on your subscription.
        </p>
      </CardContent>
    </Card>
  );
}
