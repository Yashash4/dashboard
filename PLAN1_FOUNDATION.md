# Plan 1: Foundation — Deep Dive (Implementation-Ready)

## Context
ClawHQ dashboard needs auth, protected routes, sidebar layout, and stub pages. The repo has been converted from Vite to Next.js App Router. This plan provides exact code for every file.

## CSS Variable Note
User wants ALL colors as CSS variables for easy rebranding. The existing `globals.css` has 6 utility classes with hardcoded `hsl(10 100% 52%)` — we'll fix those to use `var(--primary)` instead.

---

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

No other deps needed — react-hook-form, zod, @hookform/resolvers, lucide-react, sonner all already installed.

---

## Step 2: Fix hardcoded colors in `globals.css`

**File:** `src/app/globals.css`

Replace all `hsl(10 100% 52%)` with `hsl(var(--primary))` in the utility classes:
- `.text-gradient` — gradient uses hardcoded orange → use `--primary` and a new `--primary-light` variable
- `.glow-primary` — hardcoded → `hsl(var(--primary) / 0.25)`
- `.glow-primary-sm` — hardcoded → `hsl(var(--primary) / 0.2)`
- `.border-glow` — hardcoded → `hsl(var(--primary) / 0.25)`
- `.dashed-border-top` — hardcoded → `hsl(var(--primary) / 0.3)`
- `.dashed-border-bottom` — hardcoded → `hsl(var(--primary) / 0.3)`
- `.line-gradient` — hardcoded → `hsl(var(--primary) / 0.3)`

Add new CSS variable:
```css
--primary-light: 25 100% 55%;
```

---

## Step 3: Environment Variables

**Create:** `.env.local.template`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Update:** `.gitignore` — add `.env.local` (already covered by `*.local` rule in existing .gitignore)

---

## Step 4: Supabase Database Setup (manual — run in Supabase SQL Editor)

```sql
-- Users table linked to Supabase Auth
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Also: Supabase Dashboard > Authentication > Settings > Disable "Enable email confirmations"

---

## Step 5: Supabase Client Files

### 5a. `src/lib/supabase.ts` — Browser client

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 5b. `src/lib/supabase-server.ts` — Server client

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

---

## Step 6: Middleware — `src/middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  const path = request.nextUrl.pathname;

  // Logged-in users trying to access auth pages → redirect to dashboard
  if ((path === "/login" || path === "/register") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Unauthenticated users trying to access protected routes
  if (path.startsWith("/dashboard") && !user) {
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
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
```

---

## Step 7: Auth Pages

### 7a. `src/app/login/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border">
        <CardHeader className="text-center">
          {/* ClawHQ Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold font-mono">C</span>
            </div>
            <span className="text-foreground text-lg font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7b. `src/app/register/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold font-mono">C</span>
            </div>
            <span className="text-foreground text-lg font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Get started with ClawHQ</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Step 8: Dashboard Sidebar — `src/components/dashboard/app-sidebar.tsx`

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Brain,
  Bot,
  MessageSquare,
  HelpCircle,
  CreditCard,
  User as UserIcon,
  BarChart3,
  Users,
  Rocket,
  Ticket,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const customerNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "VPS", href: "/dashboard/vps", icon: Server },
  { title: "Models", href: "/dashboard/models", icon: Brain },
  { title: "Agents", href: "/dashboard/agents", icon: Bot },
  { title: "Channels", href: "/dashboard/channels", icon: MessageSquare },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Account", href: "/dashboard/account", icon: UserIcon },
];

const adminNav = [
  { title: "Stats", href: "/admin", icon: BarChart3 },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Deploy", href: "/admin/deploy", icon: Rocket },
  { title: "Tickets", href: "/admin/tickets", icon: Ticket },
];

interface AppSidebarProps {
  user: {
    name: string | null;
    email: string;
    role: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      {/* Header — Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold font-mono">C</span>
          </div>
          <span className="text-sidebar-foreground text-base font-semibold tracking-widest font-mono uppercase">
            ClawHQ
          </span>
        </Link>
      </SidebarHeader>

      {/* Content — Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section — only visible to admins */}
        {user.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer — User + Logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">
              {user.name || "User"}
            </p>
            <p className="text-xs truncate text-sidebar-foreground/60">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

---

## Step 9: Dashboard Layout — `src/app/dashboard/layout.tsx`

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", authUser.id)
    .single();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Step 10: Admin Layout — `src/app/admin/layout.tsx`

Reuses the same dashboard layout (shared sidebar). Admin route protection is handled by middleware.

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", authUser.id)
    .single();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Step 11: Stub Pages (12 pages)

All stubs follow this pattern — minimal server component:

```typescript
export default function PageName() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Page Title</h1>
      <p className="text-muted-foreground">Description text.</p>
    </div>
  );
}
```

### Customer stubs:
| File | Title | Description |
|------|-------|-------------|
| `src/app/dashboard/page.tsx` | Overview | Your ClawHQ dashboard at a glance. |
| `src/app/dashboard/vps/page.tsx` | VPS | Manage your VPS instance. |
| `src/app/dashboard/models/page.tsx` | Models | Configure your AI models. |
| `src/app/dashboard/agents/page.tsx` | Agents | Manage your OpenClaw agents. |
| `src/app/dashboard/channels/page.tsx` | Channels | Your connected messaging channels. |
| `src/app/dashboard/support/page.tsx` | Support | Get help from the ClawHQ team. |
| `src/app/dashboard/billing/page.tsx` | Billing | Manage your subscription and payments. |
| `src/app/dashboard/account/page.tsx` | Account | Your account settings. |

### Admin stubs:
| File | Title | Description |
|------|-------|-------------|
| `src/app/admin/page.tsx` | Admin Stats | Platform overview and metrics. |
| `src/app/admin/customers/page.tsx` | Customers | All customer accounts. |
| `src/app/admin/deploy/page.tsx` | Deploy | Deploy models and agents to customer VPS. |
| `src/app/admin/tickets/page.tsx` | Tickets | Customer support tickets. |

---

## Files Created (20 files)

```
src/lib/supabase.ts              — browser Supabase client
src/lib/supabase-server.ts       — server Supabase client
src/middleware.ts                 — auth + admin route protection
.env.local.template              — env var template
src/app/login/page.tsx            — login page
src/app/register/page.tsx         — register page
src/app/dashboard/layout.tsx      — dashboard layout with sidebar
src/app/dashboard/page.tsx        — overview stub
src/app/dashboard/vps/page.tsx    — vps stub
src/app/dashboard/models/page.tsx — models stub
src/app/dashboard/agents/page.tsx — agents stub
src/app/dashboard/channels/page.tsx — channels stub
src/app/dashboard/support/page.tsx  — support stub
src/app/dashboard/billing/page.tsx  — billing stub
src/app/dashboard/account/page.tsx  — account stub
src/app/admin/layout.tsx          — admin layout
src/app/admin/page.tsx            — admin stats stub
src/app/admin/customers/page.tsx  — customers stub
src/app/admin/deploy/page.tsx     — deploy stub
src/app/admin/tickets/page.tsx    — tickets stub
src/components/dashboard/app-sidebar.tsx — sidebar component
```

## Files Modified (1 file)

```
src/app/globals.css — fix hardcoded hsl values → use CSS variables
```

## Existing Files Reused
- `src/components/ui/sidebar.tsx` — SidebarProvider, Sidebar, SidebarContent, etc.
- `src/components/ui/card.tsx` — Card, CardHeader, CardTitle, etc.
- `src/components/ui/button.tsx` — Button
- `src/components/ui/input.tsx` — Input
- `src/components/ui/form.tsx` — Form, FormField, FormItem, etc.
- `src/components/ui/avatar.tsx` — Avatar, AvatarFallback
- `src/components/ui/separator.tsx` — Separator (via SidebarSeparator)
- `src/lib/utils.ts` — cn()

---

## Build Order

1. `npm install @supabase/supabase-js @supabase/ssr`
2. Create `.env.local.template` + `.env.local` with real keys
3. Run SQL in Supabase + disable email confirmation
4. Fix `globals.css` hardcoded colors
5. Create `lib/supabase.ts` + `lib/supabase-server.ts`
6. Create `middleware.ts`
7. Create `login/page.tsx` + `register/page.tsx`
8. Create `components/dashboard/app-sidebar.tsx`
9. Create `dashboard/layout.tsx` + `admin/layout.tsx`
10. Create all 12 stub pages
11. Test: `npm run dev`

## Verification

1. `npm run dev` — no errors
2. `/login` — form renders, dark theme, ClawHQ logo
3. `/register` — form with name/email/password/confirm
4. Register a user → auto-redirects to `/dashboard`
5. Sidebar shows 8 nav items, all clickable
6. Logout → redirected to `/login`, can't access `/dashboard`
7. `/login` while logged in → redirected to `/dashboard`
8. Manually set user role to `admin` in Supabase → sidebar shows admin section
9. Admin can access `/admin/*` routes
10. Non-admin trying `/admin` → redirected to `/dashboard`
