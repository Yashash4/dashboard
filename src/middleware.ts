import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Clean paths that get rewritten to /dashboard/* internally
const DASHBOARD_PATHS = [
  "/vps",
  "/models",
  "/agents",
  "/channels",
  "/support",
  "/billing",
  "/account",
  "/chat",
  "/monitoring",
  "/openclaw",
  "/store",
  "/mission-control",
  "/logs",
  "/analytics",
  "/knowledge-base",
  "/webhooks",

  "/api-access",
  "/audit-log",
  "/model-playground",
  "/agent-builder",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // If Supabase env vars are not set, block all protected routes (ST_MED_06)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const isProtected =
      path.startsWith("/api/") ||
      path.startsWith("/admin") ||
      path.startsWith("/dashboard") ||
      DASHBOARD_PATHS.some((p) => path === p || path.startsWith(p + "/"));
    if (isProtected) {
      return NextResponse.json(
        { error: "Service unavailable — authentication not configured" },
        { status: 503 }
      );
    }
    return NextResponse.next();
  }

  // Rewrite clean URLs to /dashboard/* internally
  // Note: "/" is handled after auth check — unauthenticated users see the landing page
  let effectivePath = path;
  const isDashboardPath = DASHBOARD_PATHS.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if (isDashboardPath) {
    effectivePath = `/dashboard${path}`;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2.31: Use getUser() instead of getSession() for security.
  // getSession() reads from the JWT cookie without server validation,
  // meaning expired/revoked tokens could still pass. getUser() makes a
  // server call to verify the token is still valid.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2.30: Protect API routes — unauthenticated requests to session-based
  // API routes are rejected. Exclude routes that handle their own auth:
  //   /api/v1/*   — public V1 API (uses Bearer token, not session)
  //   /api/auth/* — auth-related routes (login-audit, etc.)
  //   /api/cron/* — cron jobs (use CRON_SECRET header auth)
  if (path.startsWith("/api/")) {
    const isPublicApi =
      path.startsWith("/api/v1/") ||
      path.startsWith("/api/auth/") ||
      path.startsWith("/api/cron/");

    if (!isPublicApi && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ADMIN_HIGH_05: Enforce admin role on /api/admin/* routes in middleware
    if (path.startsWith("/api/admin/") && user) {
      const { data: adminProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!adminProfile || adminProfile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // API routes pass through — individual handlers do fine-grained auth
    return supabaseResponse;
  }

  // Protect /checkout — require login, redirect to register with plan params
  if (path === "/checkout") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/register";
      // Preserve plan/cycle params
      url.search = request.nextUrl.search;
      return NextResponse.redirect(url);
    }
  }

  // Logged-in users trying to access auth pages → redirect to home
  // /reset-password is accessible to anyone (recovery token in URL fragment)
  if (path === "/reset-password") {
    return supabaseResponse;
  }

  if ((path === "/login" || path === "/register") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }


  // Unauthenticated users trying to access protected routes
  if (effectivePath.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin routes — must be logged in AND have admin role
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // MFA check: if admin has TOTP enrolled, require AAL2
    if (!path.startsWith("/admin/verify-2fa")) {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        aal &&
        aal.nextLevel === "aal2" &&
        aal.currentLevel !== "aal2"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/verify-2fa";
        return NextResponse.redirect(url);
      }
    }
  }

  // Rewrite clean URLs to /dashboard/* internally
  if (effectivePath !== path) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePath;
    return NextResponse.rewrite(url, {
      headers: supabaseResponse.headers,
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/reset-password",
    "/vps/:path*",
    "/models/:path*",
    "/agents/:path*",
    "/channels/:path*",
    "/support/:path*",
    "/billing/:path*",
    "/account/:path*",
    "/chat/:path*",
    "/monitoring/:path*",
    "/openclaw/:path*",
    "/store/:path*",
    "/mission-control/:path*",
    "/logs/:path*",
    "/analytics/:path*",
    "/knowledge-base/:path*",
    "/webhooks/:path*",

    "/api-access/:path*",
    "/audit-log/:path*",
    "/model-playground/:path*",
    "/agent-builder/:path*",
    "/pricing",
    "/checkout",
    "/thank-you",
    "/docs/:path*",
    "/terms",
    "/privacy",
  ],
};
