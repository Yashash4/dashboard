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

  // If Supabase env vars are not set, let requests through (landing page works without auth)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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

  // Use getSession() for fast route protection (reads JWT from cookie, no network call)
  // Layout still calls getUser() for full validation
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user || null;

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

  // Root path: logged in → dashboard, not logged in → landing page
  // ?landing=true bypasses redirect so logged-in users can preview the landing page
  if (path === "/" && user && !request.nextUrl.searchParams.has("landing")) {
    effectivePath = "/dashboard";
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
  ],
};
