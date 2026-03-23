import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.clawhq.tech"),
  title: "ClawHQ — Managed AI Agent Hosting",
  description:
    "All-inclusive managed AI agent hosting. Dedicated VPS, bundled AI models, 7 messaging channels, full dashboard. No API keys needed. Starting at $59/mo.",
  authors: [{ name: "ClawHQ" }],
  openGraph: {
    title: "ClawHQ — Managed AI Agent Hosting",
    description:
      "Deploy AI agents on your own dedicated VPS. AI models included, 7 channels, zero DevOps.",
    url: "https://app.clawhq.tech",
    siteName: "ClawHQ",
    images: [
      { url: "/logo-full.jpeg", width: 1200, height: 630, alt: "ClawHQ" },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawHQ — Managed AI Agent Hosting",
    description:
      "Deploy AI agents on your own dedicated VPS. AI models included, 7 channels, zero DevOps.",
    images: ["/logo-full.jpeg"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/apple-touch-icon.png",
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
