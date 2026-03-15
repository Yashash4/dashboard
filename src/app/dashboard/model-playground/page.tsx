import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { ModelPlayground } from "@/components/dashboard/model-playground";

export default async function ModelPlaygroundPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: sub }, { data: models }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("available_models")
      .select("name, display_name, description")
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  const plan = (sub?.plan as string) || "starter";

  if (!hasAccess(plan, "pro")) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Model Playground</h1>
        <p className="text-muted-foreground mb-6">
          Compare AI models side by side.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Model Playground</h1>
      <p className="text-muted-foreground mb-6">
        Compare AI models side by side. Each comparison sends 2 requests.
      </p>
      <ModelPlayground models={models || []} />
    </div>
  );
}
