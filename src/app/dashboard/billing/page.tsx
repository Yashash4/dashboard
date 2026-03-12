import { CreditCard } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { BillingOverview } from "@/components/dashboard/billing-overview";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let subscription: any = null;
  let payments: any[] | null = null;

  try {
    const [subRes, paymentsRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, billing_cycle, price, status, started_at, expires_at")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("payments")
        .select("id, amount, description, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    subscription = subRes.data;
    payments = paymentsRes.data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your data. Please refresh the page.</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-muted-foreground mb-6">
          Manage your subscription and payments.
        </p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Active Subscription</h2>
              <p className="text-muted-foreground">
                Your billing details will appear here once your subscription is active.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <BillingOverview subscription={subscription} payments={payments || []} />
  );
}
