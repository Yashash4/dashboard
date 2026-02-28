import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawHQ — Your AI Agents, Managed For You",
  description:
    "All-inclusive managed AI agent hosting with bundled models, all messaging channels, and dedicated VPS. No API keys needed.",
  authors: [{ name: "ClawHQ" }],
  openGraph: {
    title: "ClawHQ — Your AI Agents, Managed For You",
    description: "All-inclusive managed AI agent hosting. Starting at $59/mo.",
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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
