"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, Ticket, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WhatsApp setup flow.
 *
 * WhatsApp requires QR code pairing on the VPS, which needs admin assistance.
 * This dialog collects the user's phone number and auto-creates a support ticket
 * requesting WhatsApp setup.
 */
export function WhatsAppSetup({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Basic phone validation
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (cleaned.length < 10 || !/^\+?\d+$/.test(cleaned)) {
      toast.error("Please enter a valid phone number with country code");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "WhatsApp Channel Setup Request",
          description: `Please set up WhatsApp channel for my account.\n\nPhone number: ${phoneNumber}\n\nThis requires QR code pairing on my VPS. Please assist with the setup process.`,
          priority: "medium",
          category: "channels",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit request");
        return;
      }

      setSubmitted(true);
      toast.success("Setup request submitted");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Set Up WhatsApp
          </DialogTitle>
          <DialogDescription>
            WhatsApp requires QR code pairing on your server. Our team will help you get connected.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Request Submitted</p>
            <p className="text-xs text-muted-foreground mb-4">
              We&apos;ll set up WhatsApp on your VPS and notify you when it&apos;s ready.
              This usually takes less than 24 hours.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/support")}
            >
              <Ticket className="mr-2 h-3.5 w-3.5" />
              View My Tickets
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted/50 border border-border text-xs text-muted-foreground space-y-2">
              <p><strong>How it works:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Submit your phone number below</li>
                <li>Our team initiates QR code pairing on your VPS</li>
                <li>You receive a QR code to scan with WhatsApp</li>
                <li>Once paired, your WhatsApp channel goes live</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Phone Number</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Include country code. This number will be linked to your WhatsApp Business account.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !phoneNumber.trim()}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ticket className="mr-2 h-4 w-4" />
              )}
              Request WhatsApp Setup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
