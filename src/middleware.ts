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
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rewrite clean URLs to /dashboard/* internally
  let effectivePath = path;
  const needsRewrite =
    path === "/" ||
    DASHBOARD_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (needsRewrite) {
    effectivePath = path === "/" ? "/dashboard" : `/dashboard${path}`;
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

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-in users trying to access auth pages → redirect to home
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
    "/vps/:path*",
    "/models/:path*",
    "/agents/:path*",
    "/channels/:path*",
    "/support/:path*",
    "/billing/:path*",
    "/account/:path*",
  ],
};
