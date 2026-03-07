export type Plan = "starter" | "pro" | "ultra" | "enterprise";

export const PLAN_ORDER: Plan[] = ["starter", "pro", "ultra", "enterprise"];

/**
 * Check if a user's plan has access to a feature requiring a minimum plan.
 * e.g., hasAccess("ultra", "pro") → true (ultra includes all pro features)
 */
export function hasAccess(userPlan: string, requiredPlan: Plan): boolean {
  const userIndex = PLAN_ORDER.indexOf(userPlan as Plan);
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
  if (userIndex === -1 || requiredIndex === -1) return false;
  return userIndex >= requiredIndex;
}

/**
 * Plan display config for sidebar badges, billing, etc.
 */
export const PLAN_CONFIG: Record<
  Plan,
  { label: string; badgeClass: string }
> = {
  starter: {
    label: "Starter",
    badgeClass:
      "bg-sidebar-foreground/10 text-sidebar-foreground/60 border border-sidebar-foreground/20",
  },
  pro: {
    label: "Pro",
    badgeClass: "bg-primary/15 text-primary border border-primary/30",
  },
  ultra: {
    label: "Ultra",
    badgeClass:
      "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  },
  enterprise: {
    label: "Enterprise",
    badgeClass:
      "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30",
  },
};
