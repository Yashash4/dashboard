import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

/** POST /api/playground/compare — Compare 2 models side by side */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:playground`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { model1, model2, prompt, temperature, maxTokens } = body as {
    model1?: string;
    model2?: string;
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
  };

  if (!model1 || !model2 || !prompt?.trim()) {
    return NextResponse.json(
      { error: "model1, model2, and prompt are required" },
      { status: 400 }
    );
  }

  if (prompt.length > 10000) {
    return NextResponse.json(
      { error: "Prompt too long (max 10KB)" },
      { status: 400 }
    );
  }

  // Get VPS details
  const { data: vps } = await admin
    .from("vps_instances")
    .select("hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS must be running for playground" },
      { status: 400 }
    );
  }

  const dashboardUrl =
    vps.openclaw_dashboard_url ||
    (vps.hostname ? `https://${vps.hostname}` : null);

  if (!dashboardUrl) {
    return NextResponse.json(
      { error: "Dashboard URL not configured" },
      { status: 500 }
    );
  }

  const baseUrl = dashboardUrl.replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (vps.dashboard_username && vps.dashboard_password) {
    const basicAuth = Buffer.from(
      `${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`
    ).toString("base64");
    headers["Authorization"] = `Basic ${basicAuth}`;
  }

  const buildRequest = (modelName: string) => {
    const reqBody: Record<string, unknown> = {
      model: modelName,
      messages: [{ role: "user", content: prompt.trim() }],
    };
    if (temperature !== undefined) reqBody.temperature = Math.max(0, Math.min(2, temperature));
    if (maxTokens !== undefined) reqBody.max_tokens = Math.max(1, Math.min(4096, maxTokens));
    return reqBody;
  };

  // Run both requests in parallel
  const runModel = async (modelName: string) => {
    const startMs = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(buildRequest(modelName)),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          content: null,
          error: `Model returned HTTP ${res.status}`,
          responseTimeMs: Date.now() - startMs,
        };
      }

      const data = await res.json();
      let content = data.choices?.[0]?.message?.content || "";

      // Strip thinking tags
      content = content
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
        .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
        .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
        .replace(/<\|think_start\|>[\s\S]*?<\|think_end\|>/gi, "")
        .trim();

      return {
        content: content || "No response",
        error: null,
        responseTimeMs: Date.now() - startMs,
      };
    } catch {
      return {
        content: null,
        error: "Request failed or timed out",
        responseTimeMs: Date.now() - startMs,
      };
    }
  };

  const [response1, response2] = await Promise.all([
    runModel(model1),
    runModel(model2),
  ]);

  return NextResponse.json({ response1, response2 });
}
