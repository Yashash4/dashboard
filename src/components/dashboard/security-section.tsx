"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, LogOut, Calendar, Key } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SecuritySectionProps {
  createdAt: string;
  passwordLastChanged?: string | null;
}

export function SecuritySection({ createdAt, passwordLastChanged }: SecuritySectionProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // UX_05: Display password last changed from user metadata
  const passwordChangedDisplay = passwordLastChanged
    ? new Date(passwordLastChanged).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Never changed";

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast.error("Failed to sign out all devices");
        return;
      }
      toast.success("Signed out from all devices");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out all devices");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Security</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Password Last Changed
            </p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              {passwordChangedDisplay}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Account Created
            </p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOutAll}
            disabled={signingOut}
          >
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign Out All Devices
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
