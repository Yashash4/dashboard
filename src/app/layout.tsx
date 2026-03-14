import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawHQ — Managed AI Agent Hosting",
  description:
    "All-inclusive managed AI agent hosting. Dedicated VPS, bundled AI models, 7 messaging channels, full dashboard. No API keys needed. Starting at $59/mo.",
  authors: [{ name: "ClawHQ" }],
  openGraph: {
    title: "ClawHQ — Managed AI Agent Hosting",
    description:
      "Dedicated VPS, bundled AI models, 7 channels. One price, everything included. Starting at $59/mo.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ClawHQ",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
