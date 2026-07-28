import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AgentationToolbar } from "@/components/agentation-toolbar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "desin — the brand layer for agents",
  description:
    "Ingest your brand once. desin turns it into a live system every agent, app, and teammate can call — via MCP or API.",
  twitter: {
    card: "summary_large_image",
    creator: "@desinapp",
    site: "@desinapp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        {process.env.NODE_ENV === "development" ? <AgentationToolbar /> : null}
      </body>
    </html>
  );
}
