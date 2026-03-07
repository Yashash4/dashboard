"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

type MfaFactor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
};

export function Admin2faSetup() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Enrollment state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  const supabase = createClient();

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.totp || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const verifiedFactors = factors.filter((f) => f.status === "verified");
  const isEnabled = verifiedFactors.length > 0;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "ClawHQ Admin",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to start enrollment");
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;

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
        code: verifyCode,
      });

      if (verifyError) {
        toast.error("Invalid code. Please try again.");
        setVerifyCode("");
        return;
      }

      toast.success("2FA enabled successfully");
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      await loadFactors();
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenroll = async (fId: string) => {
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: fId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("2FA disabled");
      await loadFactors();
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    } finally {
      setUnenrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">
            Security
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage two-factor authentication for your admin account
          </p>
        </div>
        <Shield className="h-8 w-8 text-muted-foreground/30" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <CardTitle className="text-base">
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security using a TOTP authenticator app
                </CardDescription>
              </div>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled && !qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                2FA is active. You will be asked for a verification code when
                accessing admin pages.
              </p>
              {verifiedFactors.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {f.friendly_name || "TOTP"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {f.id.slice(0, 8)}...
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnenroll(f.id)}
                    disabled={unenrolling}
                  >
                    {unenrolling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Disable"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!isEnabled && !qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your admin account by requiring a verification code from
                an authenticator app (Google Authenticator, Authy, 1Password,
                etc.) when signing in.
              </p>
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </Button>
            </div>
          )}

          {qrCode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  1. Scan this QR code with your authenticator app
                </p>
                <div className="flex justify-center p-4 bg-white rounded-md w-fit">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {secret && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Or enter this key manually:
                  </p>
                  <code className="block text-xs font-mono bg-muted p-2 select-all break-all">
                    {secret}
                  </code>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  2. Enter the 6-digit code from your authenticator
                </Label>
                <div className="flex gap-2 items-center max-w-xs">
                  <Input
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="font-mono text-center tracking-[0.5em] text-lg"
                    maxLength={6}
                    autoFocus
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={verifyCode.length !== 6 || verifying}
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQrCode(null);
                  setSecret(null);
                  setFactorId(null);
                  setVerifyCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
