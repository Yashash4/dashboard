"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  BookOpen,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./code-block";
import { HttpBadge } from "./http-badge";
import { ParamTable } from "./param-table";

/* ─── Section definitions ─── */
const SECTIONS = [
  { id: "introduction", label: "Introduction", num: "001" },
  { id: "quick-start", label: "Quick Start", num: "002" },
  { id: "authentication", label: "Authentication", num: "003" },
  { id: "chat-endpoint", label: "Chat Endpoint", num: "004" },
  { id: "sessions", label: "Session Management", num: "005" },
  { id: "knowledge-base", label: "Knowledge Base", num: "006" },
  { id: "errors", label: "Error Handling", num: "007" },
  { id: "rate-limits", label: "Rate Limits", num: "008" },
  { id: "api-keys", label: "API Keys", num: "009" },
  { id: "examples", label: "Code Examples", num: "010" },
  { id: "sdks", label: "SDKs & Tools", num: "011" },
];

const BASE_URL = "https://app.clawhq.tech/api";

/* ─── Code examples ─── */
const CURL_BASIC = `curl -X POST ${BASE_URL}/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What can you help me with?",
    "agent": "support"
  }'`;

const PYTHON_BASIC = `import requests

API_KEY = "clw_your_api_key_here"

response = requests.post(
    "${BASE_URL}/v1/chat",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "message": "What can you help me with?",
        "agent": "support",
    },
)

data = response.json()
print(data["response"])`;

const JS_BASIC = `const API_KEY = "clw_your_api_key_here";

const response = await fetch("${BASE_URL}/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "What can you help me with?",
    agent: "support",
  }),
});

const data = await response.json();
console.log(data.response);`;

const PWSH_BASIC = `$apiKey = "clw_your_api_key_here"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type"  = "application/json"
}

$body = @{
    message = "What can you help me with?"
    agent   = "support"
} | ConvertTo-Json

$response = Invoke-RestMethod \`
  -Uri "${BASE_URL}/v1/chat" \`
  -Method POST \`
  -Headers $headers \`
  -Body $body

Write-Host $response.response`;

/* ─── Full examples with error handling ─── */
const PYTHON_FULL = `import requests
import time

API_KEY = "clw_your_api_key_here"
BASE_URL = "${BASE_URL}"

def send_message(message, agent=None, session_id=None, retries=3):
    """Send a message to your ClawHQ agent with retry logic."""
    payload = {"message": message}
    if agent:
        payload["agent"] = agent
    if session_id:
        payload["session_id"] = session_id

    for attempt in range(retries):
        response = requests.post(
            f"{BASE_URL}/v1/chat",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90,
        )

        if response.status_code == 200:
            return response.json()

        if response.status_code == 429:
            wait = 2 ** attempt
            print(f"Rate limited. Retrying in {wait}s...")
            time.sleep(wait)
            continue

        error = response.json().get("error", "Unknown error")
        raise Exception(f"API error {response.status_code}: {error}")

    raise Exception("Max retries exceeded")


# Usage
result = send_message(
    "How do I configure my agent?",
    agent="support",
    session_id="user_123_session",
)
print(f"Agent: {result['agent']}")
print(f"Response: {result['response']}")`;

const JS_FULL = `const API_KEY = "clw_your_api_key_here";
const BASE_URL = "${BASE_URL}";

async function sendMessage(message, { agent, sessionId, retries = 3 } = {}) {
  const payload = { message };
  if (agent) payload.agent = agent;
  if (sessionId) payload.session_id = sessionId;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(\`\${BASE_URL}/v1/chat\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) return res.json();

    if (res.status === 429) {
      const wait = 2 ** attempt * 1000;
      console.log(\`Rate limited. Retrying in \${wait}ms...\`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    const { error } = await res.json();
    throw new Error(\`API error \${res.status}: \${error}\`);
  }

  throw new Error("Max retries exceeded");
}

// Usage
const result = await sendMessage("How do I configure my agent?", {
  agent: "support",
  sessionId: "user_123_session",
});
console.log(\`Agent: \${result.agent}\`);
console.log(\`Response: \${result.response}\`);`;

const CURL_SESSION = `# First message — start a session
curl -X POST ${BASE_URL}/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hi, I need help with billing", "session_id": "sess_abc123"}'

# Follow-up — same session_id maintains context
curl -X POST ${BASE_URL}/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "What plans do you offer?", "session_id": "sess_abc123"}'`;

/* ─── Callout component ─── */
function Callout({
  type,
  children,
}: {
  type: "warning" | "info" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    warning: "border-amber-500 bg-amber-500/5",
    info: "border-blue-500 bg-blue-500/5",
    tip: "border-emerald-500 bg-emerald-500/5",
  };
  const icons = {
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
    tip: <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`border-l-2 ${styles[type]} p-4 flex gap-3`}>
      {icons[type]}
      <div className="text-[13px] text-white/70 leading-relaxed">{children}</div>
    </div>
  );
}

/* ─── Section heading ─── */
function SectionHeading({
  num,
  title,
  id,
}: {
  num: string;
  title: string;
  id: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="font-mono text-[10px] text-primary/50 tracking-widest">
        {num}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
      <h2 id={`heading-${id}`} className="text-2xl font-bold text-white tracking-tight">
        {title}
      </h2>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

/* ─── Status code badge ─── */
function StatusBadge({ code }: { code: number }) {
  const color =
    code < 300
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : code < 500
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30";
  return (
    <span
      className={`inline-flex px-2 py-0.5 font-mono text-[11px] font-bold border ${color}`}
    >
      {code}
    </span>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function ApiDocs() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ─── Intersection observer for active section ─── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));
    return () => sections.forEach((s) => observer.unobserve(s));
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  /* ─── Sidebar content (shared between desktop & mobile) ─── */
  const sidebarContent = (
    <nav className="p-6 space-y-0.5">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="font-mono text-[11px] text-white/50 uppercase tracking-widest">
          API Reference
        </span>
      </div>
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={`w-full text-left px-3 py-2 text-[13px] font-mono transition-all duration-150 ${
            activeSection === s.id
              ? "text-primary border-l-2 border-primary bg-primary/5 -ml-px"
              : "text-white/40 hover:text-white/70 border-l-2 border-transparent -ml-px"
          }`}
        >
          {s.label}
        </button>
      ))}

      <div className="pt-6 mt-6 border-t border-white/[0.06]">
        <Link
          href="/register"
          className="flex items-center gap-2 px-3 py-2 text-[12px] font-mono text-primary/70 hover:text-primary transition-colors"
        >
          Get API Key
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STICKY HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-white/10 flex items-center px-4 lg:px-8">
        <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-1.5 text-white/50 hover:text-white">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-background border-white/10">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold font-mono">
                  C
                </span>
              </div>
              <span className="text-white text-sm font-semibold tracking-widest font-mono uppercase">
                ClawHQ
              </span>
            </Link>

            <div className="h-4 w-px bg-white/10" />
            <span className="text-white/50 text-[11px] font-mono uppercase tracking-wider">
              API Docs
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-white/40 hover:text-white transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-3 w-3" />
              Home
            </Link>
            <Link
              href="/register"
              className="text-[11px] font-mono tracking-wider border border-primary bg-primary text-primary-foreground px-4 py-1.5 hover:brightness-110 transition-all uppercase"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── LAYOUT ─── */}
      <div className="flex pt-16">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block fixed top-16 left-0 w-60 h-[calc(100vh-64px)] border-r border-white/10 bg-background overflow-y-auto">
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 px-4 sm:px-8 lg:px-16 py-12 max-w-4xl">
          {/* ════════ SECTION 1: INTRODUCTION ════════ */}
          <section id="introduction" className="mb-20 scroll-mt-24">
            <SectionHeading num="001" title="Introduction" id="introduction" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              The ClawHQ API lets you interact with your deployed AI agents
              programmatically. Send messages, receive responses, and integrate
              intelligent agents into any application.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-white/10 p-4 bg-white/[0.01]">
                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
                  Base URL
                </div>
                <code className="font-mono text-[14px] text-primary">{BASE_URL}</code>
              </div>
              <div className="border border-white/10 p-4 bg-white/[0.01]">
                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
                  Protocol
                </div>
                <code className="font-mono text-[14px] text-white/80">HTTPS only</code>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Authentication", value: "Bearer Token" },
                { label: "Content Type", value: "application/json" },
                { label: "Rate Limit", value: "60 req/min" },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 p-3 bg-white/[0.01]">
                  <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1">
                    {item.label}
                  </div>
                  <span className="font-mono text-[13px] text-white/70">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ════════ SECTION 2: QUICK START ════════ */}
          <section id="quick-start" className="mb-20 scroll-mt-24">
            <SectionHeading num="002" title="Quick Start" id="quick-start" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-8">
              Get your first API response in under 2 minutes.
            </p>

            {/* Step 1 */}
            <div className="flex gap-4 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
                  1
                </div>
                <div className="w-px flex-1 bg-white/10 mt-2" />
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-white font-semibold mb-2">Get an API Key</h3>
                <p className="text-white/50 text-sm mb-3">
                  Go to your{" "}
                  <Link href="/api-access" className="text-primary hover:underline">
                    Dashboard → API Access
                  </Link>{" "}
                  page. Click <strong className="text-white/70">Generate API Key</strong>,
                  name it, and copy the full key. It&apos;s shown only once.
                </p>
                <Callout type="warning">
                  Store your API key securely. It cannot be retrieved after creation.
                </Callout>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
                  2
                </div>
                <div className="w-px flex-1 bg-white/10 mt-2" />
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-white font-semibold mb-2">Send Your First Request</h3>
                <p className="text-white/50 text-sm mb-3">
                  Replace <code className="font-mono text-primary/80 text-[13px]">YOUR_API_KEY</code> with
                  your actual key and run:
                </p>
                <CodeBlock
                  language="bash"
                  code={`curl -X POST ${BASE_URL}/v1/chat \\
  -H "Authorization: Bearer clw_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, what can you help me with?"}'`}
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Get Your Response</h3>
                <p className="text-white/50 text-sm mb-3">
                  You&apos;ll receive a JSON response with the agent&apos;s reply:
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "response": "I can help you with account questions, technical support, and billing inquiries. What do you need?",
  "agent": "support"
}`}
                />
              </div>
            </div>
          </section>

          {/* ════════ SECTION 3: AUTHENTICATION ════════ */}
          <section id="authentication" className="mb-20 scroll-mt-24">
            <SectionHeading num="003" title="Authentication" id="authentication" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              All API requests require a Bearer token in the{" "}
              <code className="font-mono text-[13px] text-white/90">Authorization</code> header.
              API keys are available on <strong className="text-white/80">Pro</strong>,{" "}
              <strong className="text-white/80">Ultra</strong>, and{" "}
              <strong className="text-white/80">Enterprise</strong> plans.
            </p>

            <CodeBlock
              filename="Request Header"
              language="http"
              code={`Authorization: Bearer clw_a1b2c3d4e5f6789012345678901234ab`}
            />

            <div className="mt-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Key Format
              </h3>
              <div className="border border-white/10 p-4 bg-white/[0.01]">
                <div className="flex items-center gap-3 font-mono text-[14px]">
                  <span className="text-primary">clw_</span>
                  <span className="text-white/60">+</span>
                  <span className="text-white/70">32 hexadecimal characters</span>
                  <span className="text-white/60">=</span>
                  <span className="text-white/50">36 characters total</span>
                </div>
              </div>
            </div>

            <h3 className="text-white font-semibold mb-3">Security Best Practices</h3>
            <ul className="space-y-2 text-[13px] text-white/60 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
                Never commit API keys to version control
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
                Use environment variables to store keys
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
                Rotate keys regularly and revoke compromised ones immediately
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
                Each key has independent rate limits and usage tracking
              </li>
            </ul>

            <Callout type="info">
              API keys are hashed with SHA-256 before storage. The full key is
              returned only once at creation — store it immediately.
            </Callout>
          </section>

          {/* ════════ SECTION 4: CHAT ENDPOINT ════════ */}
          <section id="chat-endpoint" className="mb-20 scroll-mt-24">
            <SectionHeading num="004" title="Chat Endpoint" id="chat-endpoint" />

            <div className="flex items-center gap-3 mb-4">
              <HttpBadge method="POST" />
              <code className="font-mono text-[15px] text-white/90">/v1/chat</code>
            </div>
            <p className="text-white/70 text-[15px] leading-relaxed mb-8">
              Send a message to your deployed AI agent and receive a response.
              Supports stateless and stateful conversations.
            </p>

            {/* Request headers */}
            <h3 className="text-white font-semibold mb-3">Request Headers</h3>
            <ParamTable
              params={[
                {
                  name: "Authorization",
                  type: "string",
                  required: true,
                  description: "Bearer <your_api_key>",
                },
                {
                  name: "Content-Type",
                  type: "string",
                  required: true,
                  description: "Must be application/json",
                },
              ]}
            />

            {/* Request body */}
            <h3 className="text-white font-semibold mb-3 mt-8">Request Body</h3>
            <ParamTable
              params={[
                {
                  name: "message",
                  type: "string",
                  required: true,
                  description:
                    "The message to send to the agent. Maximum 100KB.",
                },
                {
                  name: "agent",
                  type: "string",
                  required: false,
                  description:
                    'Agent name or slug to target. If omitted, the first deployed agent is used. Example: "support", "sales_bot"',
                },
                {
                  name: "session_id",
                  type: "string",
                  required: false,
                  description:
                    "Session identifier for stateful conversations. Alphanumeric, underscores, and dashes only. Max 128 characters.",
                },
              ]}
            />

            {/* Code examples */}
            <h3 className="text-white font-semibold mb-3 mt-8">Example Request</h3>
            <Tabs defaultValue="curl">
              <TabsList className="bg-white/[0.03] border border-white/10 h-10 p-0.5">
                <TabsTrigger
                  value="curl"
                  className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
                >
                  cURL
                </TabsTrigger>
                <TabsTrigger
                  value="python"
                  className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
                >
                  Python
                </TabsTrigger>
                <TabsTrigger
                  value="javascript"
                  className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
                >
                  JavaScript
                </TabsTrigger>
                <TabsTrigger
                  value="powershell"
                  className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
                >
                  PowerShell
                </TabsTrigger>
              </TabsList>
              <TabsContent value="curl" className="mt-3">
                <CodeBlock language="bash" code={CURL_BASIC} />
              </TabsContent>
              <TabsContent value="python" className="mt-3">
                <CodeBlock language="python" code={PYTHON_BASIC} />
              </TabsContent>
              <TabsContent value="javascript" className="mt-3">
                <CodeBlock language="javascript" code={JS_BASIC} />
              </TabsContent>
              <TabsContent value="powershell" className="mt-3">
                <CodeBlock language="powershell" code={PWSH_BASIC} />
              </TabsContent>
            </Tabs>

            {/* Success response */}
            <h3 className="text-white font-semibold mb-3 mt-8">
              Success Response <StatusBadge code={200} />
            </h3>
            <CodeBlock
              language="json"
              code={`{
  "response": "I can help you with account setup, billing questions, and technical support. What would you like to know?",
  "agent": "support"
}`}
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Response Fields</h3>
            <ParamTable
              params={[
                {
                  name: "response",
                  type: "string",
                  required: true,
                  description:
                    "The agent's response text. Thinking/reasoning tags are automatically stripped.",
                },
                {
                  name: "agent",
                  type: "string",
                  required: true,
                  description:
                    "The sanitized slug of the agent that processed the request.",
                },
              ]}
            />
          </section>

          {/* ════════ SECTION 5: SESSIONS ════════ */}
          <section id="sessions" className="mb-20 scroll-mt-24">
            <SectionHeading num="005" title="Session Management" id="sessions" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              By default, each API call is independent — no conversation history
              is maintained. To create multi-turn conversations, use the{" "}
              <code className="font-mono text-[13px] text-white/90">session_id</code> parameter.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="border border-white/10 p-4 bg-white/[0.01]">
                <h4 className="font-semibold text-white text-sm mb-2">
                  Stateless Mode
                </h4>
                <p className="text-white/50 text-[13px]">
                  Omit <code className="font-mono text-white/70">session_id</code>.
                  Each request is a fresh conversation with no memory of previous messages.
                </p>
              </div>
              <div className="border border-primary/30 p-4 bg-primary/5">
                <h4 className="font-semibold text-white text-sm mb-2">
                  Stateful Mode
                </h4>
                <p className="text-white/50 text-[13px]">
                  Pass the same <code className="font-mono text-white/70">session_id</code> across
                  requests. The agent remembers the full conversation.
                </p>
              </div>
            </div>

            <h3 className="text-white font-semibold mb-3">Stateful Conversation Example</h3>
            <CodeBlock language="bash" code={CURL_SESSION} />

            <Callout type="info">
              Session IDs must be alphanumeric with underscores and dashes
              only. Maximum 128 characters. Pattern:{" "}
              <code className="font-mono text-white/70">[a-zA-Z0-9_-]+</code>
            </Callout>
          </section>

          {/* ════════ SECTION 6: KNOWLEDGE BASE ════════ */}
          <section id="knowledge-base" className="mb-20 scroll-mt-24">
            <SectionHeading num="006" title="Knowledge Base" id="knowledge-base" />
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                Pro Feature
              </span>
            </div>
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              When you upload documents to your Knowledge Base, the Chat API
              automatically searches for relevant context and injects it into
              agent responses. No additional API parameters needed.
            </p>

            <h3 className="text-white font-semibold mb-4">How It Works</h3>
            <div className="space-y-3 mb-6">
              {[
                "You upload PDFs, text files, or URLs to your Knowledge Base in the dashboard",
                "Documents are automatically chunked and indexed using full-text search",
                "When a message is ≥20 characters and ≥3 words, the system searches your KB",
                "Top 3 most relevant chunks are injected as system context before the agent responds",
                "The agent uses this context to give accurate, document-aware answers",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[11px] text-primary/60 mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-white/60 text-[13px]">{step}</p>
                </div>
              ))}
            </div>

            <Callout type="tip">
              Short messages (under 20 characters or fewer than 3 words) skip
              KB search for faster responses. KB failures never block your chat
              — they fail silently.
            </Callout>
          </section>

          {/* ════════ SECTION 7: ERRORS ════════ */}
          <section id="errors" className="mb-20 scroll-mt-24">
            <SectionHeading num="007" title="Error Handling" id="errors" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              All errors return a JSON object with an{" "}
              <code className="font-mono text-[13px] text-white/90">error</code> field.
              Use the HTTP status code to determine the error category.
            </p>

            <CodeBlock
              filename="Error Response Format"
              language="json"
              code={`{
  "error": "Description of what went wrong"
}`}
            />

            <h3 className="text-white font-semibold mb-4 mt-8">Status Codes</h3>
            <div className="border border-white/10 overflow-hidden">
              {[
                {
                  code: 200,
                  title: "OK",
                  desc: "Request succeeded. Response contains the agent's reply.",
                },
                {
                  code: 400,
                  title: "Bad Request",
                  desc: "Missing or invalid parameters.",
                  examples: [
                    '"message field is required"',
                    '"Invalid JSON body"',
                    '"session_id must be alphanumeric, max 128 chars"',
                    '"No deployed agents found"',
                    '"No VPS provisioned"',
                  ],
                },
                {
                  code: 401,
                  title: "Unauthorized",
                  desc: "Authentication failed.",
                  examples: [
                    '"Missing Authorization: Bearer <api_key> header"',
                    '"Invalid API key format"',
                    '"Invalid API key"',
                    '"API key has been revoked"',
                  ],
                },
                {
                  code: 403,
                  title: "Forbidden",
                  desc: "Your plan doesn't include API access.",
                  examples: ['"API access requires a Pro plan or higher"'],
                },
                {
                  code: 404,
                  title: "Not Found",
                  desc: "The specified agent doesn't exist or isn't deployed.",
                  examples: [
                    '"Agent \\"custom_bot\\" not found or not deployed"',
                  ],
                },
                {
                  code: 429,
                  title: "Too Many Requests",
                  desc: "Rate limit exceeded.",
                  examples: ['"Rate limit exceeded. Try again later."'],
                },
                {
                  code: 502,
                  title: "Bad Gateway",
                  desc: "Your VPS agent returned an error or is unreachable.",
                  examples: ['"Failed to get response from agent"'],
                },
                {
                  code: 503,
                  title: "Service Unavailable",
                  desc: "Your VPS is not running.",
                  examples: ['"VPS is not running"'],
                },
                {
                  code: 504,
                  title: "Gateway Timeout",
                  desc: "Agent did not respond within 60 seconds.",
                  examples: ['"Agent took too long to respond"'],
                },
              ].map((err) => (
                <div
                  key={err.code}
                  className="border-b border-white/[0.06] last:border-0 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge code={err.code} />
                    <span className="font-semibold text-white text-sm">
                      {err.title}
                    </span>
                  </div>
                  <p className="text-white/50 text-[13px] mb-2">{err.desc}</p>
                  {err.examples && (
                    <div className="space-y-1">
                      {err.examples.map((ex, i) => (
                        <code
                          key={i}
                          className="block font-mono text-[12px] text-white/40"
                        >
                          {`{ "error": ${ex} }`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ════════ SECTION 8: RATE LIMITS ════════ */}
          <section id="rate-limits" className="mb-20 scroll-mt-24">
            <SectionHeading num="008" title="Rate Limits" id="rate-limits" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              Each API key has an independent rate limit. The default is{" "}
              <strong className="text-white/90">60 requests per minute</strong> using
              a sliding window algorithm.
            </p>

            <div className="border border-white/10 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                      Limit
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.06]">
                    <td className="px-4 py-3 text-white/70">Requests per minute</td>
                    <td className="px-4 py-3 font-mono text-white/90">60 RPM (default)</td>
                  </tr>
                  <tr className="border-b border-white/[0.06]">
                    <td className="px-4 py-3 text-white/70">Window type</td>
                    <td className="px-4 py-3 font-mono text-white/90">Sliding window</td>
                  </tr>
                  <tr className="border-b border-white/[0.06]">
                    <td className="px-4 py-3 text-white/70">Scope</td>
                    <td className="px-4 py-3 font-mono text-white/90">Per API key</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-white/70">Custom limits</td>
                    <td className="px-4 py-3 font-mono text-white/90">
                      Contact support
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Handling Rate Limits</h3>
            <p className="text-white/50 text-[13px] mb-3">
              When you exceed the rate limit, the API returns a{" "}
              <StatusBadge code={429} /> response. Implement exponential backoff:
            </p>
            <CodeBlock
              language="python"
              code={`import time

def call_with_retry(fn, retries=3):
    for attempt in range(retries):
        response = fn()
        if response.status_code != 429:
            return response
        wait = 2 ** attempt  # 1s, 2s, 4s
        print(f"Rate limited. Waiting {wait}s...")
        time.sleep(wait)
    raise Exception("Rate limit: max retries exceeded")`}
            />
          </section>

          {/* ════════ SECTION 9: API KEYS ════════ */}
          <section id="api-keys" className="mb-20 scroll-mt-24">
            <SectionHeading num="009" title="API Keys" id="api-keys" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              Manage API keys from your{" "}
              <Link href="/api-access" className="text-primary hover:underline">
                dashboard
              </Link>
              . You can also use the management endpoints below.
            </p>

            {/* List keys */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <HttpBadge method="GET" />
                <code className="font-mono text-[14px] text-white/90">/api/keys</code>
              </div>
              <p className="text-white/50 text-[13px] mb-3">
                List all API keys. Returns key prefix only — never the full key.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "keys": [
    {
      "id": "uuid-here",
      "name": "Production",
      "key_prefix": "clw_a1b2c3d4",
      "usage_count": 1523,
      "last_used_at": "2026-03-09T12:00:00Z",
      "status": "active",
      "created_at": "2026-03-01T10:00:00Z"
    }
  ]
}`}
              />
            </div>

            {/* Create key */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <HttpBadge method="POST" />
                <code className="font-mono text-[14px] text-white/90">/api/keys</code>
              </div>
              <p className="text-white/50 text-[13px] mb-3">
                Generate a new API key. Maximum 5 active keys per account.
              </p>
              <ParamTable
                params={[
                  {
                    name: "name",
                    type: "string",
                    required: true,
                    description: "A label for this key. Max 100 characters.",
                  },
                ]}
              />
              <div className="mt-3">
                <CodeBlock
                  language="json"
                  filename="Response — save the full_key immediately!"
                  code={`{
  "key": {
    "id": "uuid-here",
    "name": "Production",
    "key_prefix": "clw_a1b2c3d4",
    "full_key": "clw_a1b2c3d4e5f6789012345678901234ab",
    "status": "active",
    "created_at": "2026-03-09T12:00:00Z"
  }
}`}
                />
              </div>
              <div className="mt-3">
                <Callout type="warning">
                  The <code className="font-mono text-white/70">full_key</code> is returned{" "}
                  <strong>only once</strong>. Copy and store it securely — it
                  cannot be retrieved later.
                </Callout>
              </div>
            </div>

            {/* Revoke key */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <HttpBadge method="DELETE" />
                <code className="font-mono text-[14px] text-white/90">
                  /api/keys/{"{id}"}
                </code>
              </div>
              <p className="text-white/50 text-[13px] mb-3">
                Revoke an API key. This is immediate and irreversible. All
                applications using this key will fail authentication.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "success": true
}`}
              />
            </div>
          </section>

          {/* ════════ SECTION 10: CODE EXAMPLES ════════ */}
          <section id="examples" className="mb-20 scroll-mt-24">
            <SectionHeading num="010" title="Code Examples" id="examples" />
            <p className="text-white/70 text-[15px] leading-relaxed mb-6">
              Full working examples with error handling and retry logic.
            </p>

            <Tabs defaultValue="python">
              <TabsList className="bg-white/[0.03] border border-white/10 h-10 p-0.5">
                <TabsTrigger
                  value="python"
                  className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
                >
                  Python
                </TabsTrigger>
                <TabsTrigger
                  value="javascript"
                  className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
                >
                  JavaScript
                </TabsTrigger>
              </TabsList>
              <TabsContent value="python" className="mt-3">
                <CodeBlock language="python" code={PYTHON_FULL} />
              </TabsContent>
              <TabsContent value="javascript" className="mt-3">
                <CodeBlock language="javascript" code={JS_FULL} />
              </TabsContent>
            </Tabs>
          </section>

          {/* ════════ SECTION 11: SDKS ════════ */}
          <section id="sdks" className="mb-20 scroll-mt-24">
            <SectionHeading num="011" title="SDKs & Tools" id="sdks" />

            <h3 className="text-white font-semibold mb-4">Official SDKs</h3>
            <p className="text-white/50 text-[13px] mb-6">
              Official SDKs are coming soon for:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                { lang: "Python", pkg: "pip install clawhq" },
                { lang: "JavaScript", pkg: "npm install @clawhq/sdk" },
                { lang: "Go", pkg: "go get github.com/clawhq/go-sdk" },
                { lang: "Ruby", pkg: "gem install clawhq" },
              ].map((sdk) => (
                <div
                  key={sdk.lang}
                  className="border border-white/10 p-3 bg-white/[0.01] flex items-center justify-between"
                >
                  <span className="text-white/70 text-sm">{sdk.lang}</span>
                  <code className="font-mono text-[11px] text-white/30">
                    {sdk.pkg}
                  </code>
                </div>
              ))}
            </div>

            <h3 className="text-white font-semibold mb-4">Need Help?</h3>
            <p className="text-white/50 text-[13px]">
              Have questions or want to report an issue? Contact us at{" "}
              <a
                href="mailto:hello@clawhq.tech"
                className="text-primary hover:underline"
              >
                hello@clawhq.tech
              </a>
            </p>
          </section>

          {/* ─── Footer spacer ─── */}
          <div className="border-t border-white/[0.06] pt-8 mt-12">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/20">
                ClawHQ API v1
              </span>
              <span className="font-mono text-[10px] text-white/20">
                Last updated: March 2026
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
