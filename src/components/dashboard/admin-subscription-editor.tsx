"use client";

import { useState } from "react";
import { CreditCard, Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRICE_MAP: Record<string, Record<string, number>> = {
  starter: { monthly: 59, annual: 599 },
  pro: { monthly: 129, annual: 1299 },
  ultra: { monthly: 350, annual: 3499 },
  enterprise: { monthly: 999, annual: 9999 },
};

interface Subscription {
  id: string;
  plan: string;
  status: string;
  billing_cycle: string;
  price: number;
  started_at: string | null;
  expires_at: string | null;
}

interface Props {
  userId: string;
  subscription: Subscription | null;
}

export function AdminSubscriptionEditor({ userId, subscription }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [plan, setPlan] = useState(subscription?.plan || "starter");
  const [status, setStatus] = useState(subscription?.status || "active");
  const [billingCycle, setBillingCycle] = useState(
    subscription?.billing_cycle || "monthly"
  );
  const [price, setPrice] = useState(
    subscription?.price?.toString() || "59"
  );
  const [expiresAt, setExpiresAt] = useState(
    subscription?.expires_at
      ? new Date(subscription.expires_at).toISOString().split("T")[0]
      : ""
  );

  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    const suggested = PRICE_MAP[newPlan]?.[billingCycle];
    if (suggested) setPrice(suggested.toString());
  };

  const handleCycleChange = (newCycle: string) => {
    setBillingCycle(newCycle);
    const suggested = PRICE_MAP[plan]?.[newCycle];
    if (suggested) setPrice(suggested.toString());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          status,
          billing_cycle: billingCycle,
          price: parseFloat(price),
          expires_at: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update subscription");
        return;
      }

      toast.success(
        subscription ? "Subscription updated" : "Subscription created"
      );
      setEditing(false);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPlan(subscription?.plan || "starter");
    setStatus(subscription?.status || "active");
    setBillingCycle(subscription?.billing_cycle || "monthly");
    setPrice(subscription?.price?.toString() || "59");
    setExpiresAt(
      subscription?.expires_at
        ? new Date(subscription.expires_at).toISOString().split("T")[0]
        : ""
    );
    setEditing(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "border-green-600/50 text-green-500",
    cancelled: "border-red-600/50 text-red-500",
    expired: "border-muted-foreground/30 text-muted-foreground",
    pending: "border-yellow-600/50 text-yellow-500",
  };

  const PLAN_COLORS: Record<string, string> = {
    starter: "bg-secondary text-secondary-foreground",
    pro: "bg-primary text-primary-foreground",
    ultra: "bg-violet-600 text-white",
    enterprise: "bg-purple-600 text-white",
  };

  // Read-only view
  if (!editing) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Subscription
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {subscription ? (
            <>
              <div className="flex items-center gap-2">
                <Badge className={`${PLAN_COLORS[subscription.plan] || ""} text-xs`}>
                  {subscription.plan.charAt(0).toUpperCase() +
                    subscription.plan.slice(1)}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[subscription.status] || ""} text-xs capitalize`}
                >
                  {subscription.status}
                </Badge>
              </div>
              {subscription.price && (
                <p className="text-sm">
                  ${Number(subscription.price).toLocaleString()}/
                  {subscription.billing_cycle === "annual" ? "yr" : "mo"}
                </p>
              )}
              {subscription.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires{" "}
                  {new Date(subscription.expires_at).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No subscription</p>
              <Button size="sm" onClick={() => setEditing(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit view
  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-primary">
          {subscription ? "Edit Subscription" : "Create Subscription"}
        </CardTitle>
        <CreditCard className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Plan</Label>
            <Select value={plan} onValueChange={handlePlanChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Billing Cycle</Label>
            <Select value={billingCycle} onValueChange={handleCycleChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Price ($)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Expires At</Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
