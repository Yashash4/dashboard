"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";

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

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface SetupStep {
  title: string;
  instructions: string[];
  link?: { label: string; url: string };
}

const CHANNEL_SETUP_STEPS: Record<string, SetupStep[]> = {
  telegram: [
    {
      title: "Create a Telegram Bot",
      instructions: [
        'Open Telegram and search for "@BotFather"',
        'Send /newbot and follow the prompts to name your bot',
        'BotFather will give you a Bot Token (e.g. 123456:ABC-DEF...)',
        'Copy the token — you\'ll need it in the next step',
      ],
      link: { label: "Open BotFather", url: "https://t.me/BotFather" },
    },
  ],
  discord: [
    {
      title: "Create a Discord Bot",
      instructions: [
        'Go to the Discord Developer Portal',
        'Click "New Application" and give it a name',
        'Go to "Bot" in the sidebar and click "Add Bot"',
        'Click "Reset Token" and copy the Bot Token',
        'Under "Privileged Gateway Intents", enable Message Content Intent',
        'Go to "OAuth2 > URL Generator", select "bot" scope and "Send Messages" permission',
        'Use the generated URL to invite the bot to your server',
      ],
      link: {
        label: "Discord Developer Portal",
        url: "https://discord.com/developers/applications",
      },
    },
  ],
  slack: [
    {
      title: "Create a Slack App",
      instructions: [
        'Go to the Slack API portal and click "Create New App"',
        'Choose "From scratch" and pick your workspace',
        'Go to "Socket Mode" and enable it — copy the App Token (xapp-...)',
        'Go to "OAuth & Permissions" and add bot scopes: chat:write, app_mentions:read',
        'Install the app to your workspace and copy the Bot Token (xoxb-...)',
      ],
      link: { label: "Slack API Portal", url: "https://api.slack.com/apps" },
    },
  ],
  teams: [
    {
      title: "Register a Teams Bot",
      instructions: [
        'Go to the Azure Portal and create a new "Azure Bot" resource',
        'Copy the App ID from the bot configuration',
        'Go to "Configuration" and create a new client secret — copy the password',
        'Note your Azure AD Tenant ID from the overview page',
        'In the Bot configuration, set the messaging endpoint to your OpenClaw URL',
      ],
      link: {
        label: "Azure Portal",
        url: "https://portal.azure.com/#create/Microsoft.AzureBot",
      },
    },
  ],
  webchat: [],
};

export function ChannelSetupWizard({
  channelType,
  channelLabel,
  fields,
  open,
  onOpenChange,
  onConnect,
  connecting,
}: {
  channelType: string;
  channelLabel: string;
  fields: FieldDef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (credentials: Record<string, string>) => void;
  connecting: boolean;
}) {
  const steps = CHANNEL_SETUP_STEPS[channelType] || [];
  const hasSetupSteps = steps.length > 0 && fields.length > 0;
  const totalSteps = hasSetupSteps ? 2 : 1; // instructions + credentials, or just credentials/confirm
  const [step, setStep] = useState(0);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const handleClose = () => {
    setStep(0);
    setCredentials({});
    onOpenChange(false);
  };

  const handleConnect = () => {
    onConnect(credentials);
  };

  const isCredentialsStep = hasSetupSteps ? step === 1 : step === 0;
  const isInstructionsStep = hasSetupSteps && step === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect {channelLabel}</DialogTitle>
          <DialogDescription>
            {hasSetupSteps && (
              <span className="text-xs font-mono">
                Step {step + 1} of {totalSteps}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Instructions */}
        {isInstructionsStep && steps[0] && (
          <div className="space-y-4 py-2">
            <h3 className="font-semibold text-sm">{steps[0].title}</h3>
            <ol className="space-y-2">
              {steps[0].instructions.map((instruction, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground font-mono shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-muted-foreground">{instruction}</span>
                </li>
              ))}
            </ol>
            {steps[0].link && (
              <a
                href={steps[0].link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {steps[0].link.label}
              </a>
            )}
          </div>
        )}

        {/* Step: Credentials */}
        {isCredentialsStep && fields.length > 0 && (
          <div className="space-y-4 py-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* No credentials needed (webchat) */}
        {isCredentialsStep && fields.length === 0 && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              No credentials needed. Click Connect to enable {channelLabel} on
              your instance.
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {isInstructionsStep ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep(1)}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {hasSetupSteps && (
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  disabled={connecting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {!hasSetupSteps && (
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Connect
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
