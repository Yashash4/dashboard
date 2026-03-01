import { User } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { AccountSettings } from "@/components/dashboard/account-settings";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, role, created_at")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Account</h1>
        <p className="text-muted-foreground mb-6">Your account settings.</p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground">
                Unable to load your profile. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AccountSettings profile={profile} />;
}
