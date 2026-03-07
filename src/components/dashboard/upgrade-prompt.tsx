import Link from "next/link";
import { Lock, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PRO_FEATURES = [
  "Advanced monitoring & analytics",
  "Custom agent templates & presets",
  "Priority support with live chat",
  "5x higher rate limits",
  "Custom API integrations",
];

export function UpgradePrompt() {
  return (
    <Card className="border-border max-w-lg mx-auto">
      <CardContent className="pt-6">
        <div className="text-center py-4">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Upgrade to Pro</h2>
          <p className="text-muted-foreground mb-6">
            This feature is available on the Pro plan.
          </p>
        </div>

        <ul className="space-y-2.5 mb-6">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button className="w-full" asChild>
          <Link href="/billing">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
