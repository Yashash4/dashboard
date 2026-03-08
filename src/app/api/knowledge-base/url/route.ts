import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { indexDocument, stripHTML } from "@/lib/knowledge-base";

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

  const rl = rateLimit(`${user.id}:kb_url`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const { url } = body as { url?: string };

  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { error: "Valid URL is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch URL content
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ClawHQ-KB-Crawler/1.0",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const textContent = stripHTML(html);

    if (!textContent || textContent.length < 20) {
      return NextResponse.json(
        { error: "No useful text content found at URL" },
        { status: 400 }
      );
    }

    // Create document record
    const contentSize = Buffer.byteLength(textContent, "utf-8");

    const { data: doc, error: docError } = await admin
      .from("kb_documents")
      .insert({
        user_id: user.id,
        name: new URL(url).hostname + new URL(url).pathname,
        type: "url",
        source_url: url,
        file_size: contentSize,
        status: "processing",
      })
      .select("id")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }

    const { chunkCount } = await indexDocument(
      doc.id,
      user.id,
      textContent,
      false
    );

    const { data: fullDoc } = await admin
      .from("kb_documents")
      .select("*")
      .eq("id", doc.id)
      .single();

    return NextResponse.json({ document: fullDoc, chunkCount });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "URL took too long to respond" },
        { status: 400 }
      );
    }
    console.error("[kb/url] Error:", err);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
