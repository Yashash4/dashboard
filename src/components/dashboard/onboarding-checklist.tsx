"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Bot,
  ShoppingBag,
  X,
  Rocket,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingState {
  channel_connected: boolean;
  agent_deployed: boolean;
  message_sent: boolean;
  store_visited: boolean;
  checklist_dismissed: boolean;
  completed_at: string | null;
}

const STEPS = [
  {
    key: "channel_connected" as const,
    label: "Connect a channel",
    href: "/channels",
    icon: MessageSquare,
  },
  {
    key: "agent_deployed" as const,
    label: "Deploy an agent",
    href: "/agents",
    icon: Rocket,
  },
  {
    key: "message_sent" as const,
    label: "Send a message",
    href: "/chat",
    icon: Bot,
  },
  {
    key: "store_visited" as const,
    label: "Visit the Agent Store",
    href: "/store",
    icon: ShoppingBag,
  },
];

export function OnboardingChecklist() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<OnboardingState>({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist_dismissed: true }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding"] }),
  });

  if (isLoading || !data) return null;
  if (data.checklist_dismissed || data.completed_at) return null;

  const completed = STEPS.filter((s) => data[s.key]).length;
  const progress = (completed / STEPS.length) * 100;

  if (completed === STEPS.length) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Get Started with ClawHQ</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground"
          onClick={() => dismiss.mutate()}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground font-medium">
            {completed}/{STEPS.length}
          </span>
        </div>
        <div className="space-y-2">
          {STEPS.map((step) => {
            const done = data[step.key];
            const Icon = step.icon;
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`flex items-center gap-3 p-2 transition-colors hover:bg-muted/50 ${
                  done ? "opacity-60" : ""
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                  {step.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
