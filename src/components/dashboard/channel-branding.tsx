"use client";

import { useState } from "react";
import { Paintbrush, Loader2, Save } from "lucide-react";
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
  channelId: string;
  channelType: string;
  channelLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  telegram: "To change your bot's name, talk to @BotFather on Telegram → /setname",
  discord: "Go to Discord Developer Portal → Your App → Bot → Change username",
  slack: "Go to api.slack.com → Your App → Basic Information → Display Information",
  teams: "Go to Azure Portal → Bot Services → Your Bot → Settings → Display Name",
  webchat: "Your webchat bot name is customizable below.",
};

export function ChannelBranding({
  channelId,
  channelType,
  channelLabel,
  open,
  onOpenChange,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const isWebchat = channelType === "webchat";
  const instructions = PLATFORM_INSTRUCTIONS[channelType];

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update branding");
        return;
      }

      toast.success("Branding updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            {channelLabel} Branding
          </DialogTitle>
          <DialogDescription>
            Customize how your bot appears on {channelLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {instructions && (
            <div className="p-3 bg-muted/50 border border-border text-sm text-muted-foreground">
              {instructions}
            </div>
          )}

          {isWebchat && (
            <div className="space-y-2">
              <Label className="text-sm">Bot Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Support Assistant"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This name appears in the webchat widget header.
              </p>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            </div>
          )}

          {!isWebchat && (
            <p className="text-sm text-muted-foreground">
              Bot name and avatar for {channelLabel} must be changed in the platform&apos;s settings.
              Follow the instructions above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
