"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DangerZoneProps {
  email: string;
}

export function DangerZone({ email }: DangerZoneProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const resetDialog = () => {
    setStep(1);
    setEmailConfirm("");
    setPassword("");
    setDeleting(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) resetDialog();
  };

  const handleDelete = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete account");
        return;
      }

      toast.success("Account deleted. Goodbye!");
      router.push("/login");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-red-500/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg text-red-500">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Account</DialogTitle>
            <DialogDescription>
              {step === 1 &&
                "This will permanently delete your account and all your data, including agents, channels, tickets, and subscription."}
              {step === 2 && "Type your email address to confirm."}
              {step === 3 && "Enter your password for final verification."}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400 font-medium mb-2">
                  This action will permanently:
                </p>
                <ul className="text-sm text-red-400/80 space-y-1 list-disc pl-4">
                  <li>Delete all your deployed agents</li>
                  <li>Remove all connected channels</li>
                  <li>Delete all support tickets</li>
                  <li>Cancel your subscription</li>
                  <li>Remove all account data</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={() => setStep(2)}
                >
                  I Understand, Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email-confirm">
                  Type <span className="font-mono text-foreground">{email}</span> to
                  confirm
                </Label>
                <Input
                  id="email-confirm"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  disabled={emailConfirm !== email}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="delete-password">Enter your password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your account password"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  disabled={!password || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete My Account
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
