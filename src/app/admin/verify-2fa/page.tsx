"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Verify2FAPage() {
  const router = useRouter();
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the user's TOTP factor
    const loadFactor = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data?.totp?.length) {
        // No MFA factors — shouldn't be here, redirect to admin
        router.replace("/admin");
        return;
      }

      const verified = data.totp.filter((f) => f.status === "verified");
      if (verified.length === 0) {
        router.replace("/admin");
        return;
      }

      setFactorId(verified[0].id);
      setLoading(false);
    };

    loadFactor();
  }, []);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;

    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        toast.error(challengeError.message);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        toast.error("Invalid code. Please try again.");
        setCode("");
        return;
      }

      // Verification successful — redirect to admin
      router.replace("/admin");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Two-Factor Verification</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={handleKeyDown}
              placeholder="000000"
              className="font-mono text-center tracking-[0.5em] text-lg h-12"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
