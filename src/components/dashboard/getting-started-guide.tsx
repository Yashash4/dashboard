"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Rocket,
  MessageSquare,
  Bot,
  Server,
  X,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingState {
  guide_dismissed: boolean;
  checklist_dismissed: boolean;
  completed_at: string | null;
  channel_connected: boolean;
  agent_deployed: boolean;
  message_sent: boolean;
}

const GUIDE_STEPS = [
  {
    icon: Server,
    title: "Your VPS is ready",
    description: "Your dedicated server is provisioned with OpenClaw installed and configured.",
  },
  {
    icon: MessageSquare,
    title: "Connect a channel",
    description: "Link WhatsApp, Telegram, Discord, Slack, or other platforms.",
    href: "/channels",
  },
  {
    icon: Bot,
    title: "Deploy an agent",
    description: "Choose an AI agent from the store and deploy it to your VPS.",
    href: "/store",
  },
  {
    icon: Rocket,
    title: "Start chatting",
    description: "Your agent will handle conversations automatically across all connected channels.",
    href: "/chat",
  },
];

export function GettingStartedGuide() {
  const queryClient = useQueryClient();

  const { data } = useQuery<OnboardingState>({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_dismissed: true }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding"] }),
  });

  // Don't show if: still loading, already dismissed, or user has completed steps
  if (!data) return null;
  if (data.guide_dismissed) return null;
  if (data.completed_at) return null;
  // Only show for truly new users — hide once they've done anything
  if (data.channel_connected || data.agent_deployed || data.message_sent) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Welcome to ClawHQ</h2>
            <p className="text-sm text-muted-foreground">
              Here&apos;s how to get your AI agents live in minutes.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground shrink-0"
            onClick={() => dismiss.mutate()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GUIDE_STEPS.map((step, i) => {
            const Icon = step.icon;
            const content = (
              <div className="flex items-start gap-3 p-3 border border-border bg-card/50 h-full">
                <div className="flex items-center justify-center w-8 h-8 shrink-0 bg-primary/10 text-primary">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-sm font-medium">{step.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {step.href && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary mt-1.5">
                      Get started <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            );

            return step.href ? (
              <Link key={i} href={step.href} className="hover:opacity-80 transition-opacity">
                {content}
              </Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
