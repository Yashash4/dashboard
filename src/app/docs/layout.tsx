import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation | ClawHQ",
  description:
    "Complete API reference for ClawHQ. Learn how to integrate AI agents into your applications with our REST API. Code examples in Python, JavaScript, cURL, and PowerShell.",
  openGraph: {
    title: "API Documentation | ClawHQ",
    description:
      "Complete API reference for ClawHQ. Integrate AI agents into your applications.",
    type: "website",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
