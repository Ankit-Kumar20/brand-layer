"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, RefreshCw, Loader2 } from "lucide-react";

import { ToolIcon } from "@/components/landing/integrations";
import { SectionRule, SheetEdges } from "@/components/landing/section-rule";
import { TopBar } from "@/components/landing/topbar";
import { MarkBrain } from "@/components/logo/marks";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";

type SetupStatus = "idle" | "scanning" | "success";

type SetupClientProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
};

const SCAN_STEPS = [
  { id: "01", label: "Resolving domain & fetching public brand assets..." },
  { id: "02", label: "Extracting vector marks & primary color palette..." },
  { id: "03", label: "Synthesizing typography & tone of voice rules..." },
  { id: "04", label: "Packaging live MCP brand truth schema..." },
];

const SAMPLE_BRANDS: Record<
  string,
  { name: string; color: string; font: string; voice: string }
> = {
  "stripe.com": {
    name: "Stripe",
    color: "#635BFF",
    font: "Soehne, Inter, sans-serif",
    voice: "Precise, developer-focused, articulate, and trustworthy.",
  },
  "linear.app": {
    name: "Linear",
    color: "#5E6AD2",
    font: "Inter, SF Pro, sans-serif",
    voice: "Opinionated, high-velocity, modern, and direct.",
  },
  "vercel.com": {
    name: "Vercel",
    color: "#000000",
    font: "Geist, Geist Mono, sans-serif",
    voice: "Minimalist, developer-first, cutting-edge, and authoritative.",
  },
  "airbnb.com": {
    name: "Airbnb",
    color: "#FF385C",
    font: "Cereal, Circular, sans-serif",
    voice: "Warm, inviting, community-driven, and inspiring.",
  },
};

const clients = [
  { id: "claude" as const, label: "Claude" },
  { id: "cursor" as const, label: "Cursor" },
  { id: "chatgpt" as const, label: "ChatGPT" },
];

const INVALID_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isValidUrl(input: string): boolean {
  if (!input) return false;

  // Clean invisible zero-width characters & trailing/leading whitespace
  const trimmed = input.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!trimmed) return false;

  // Disallow non-HTTP pseudo-protocols (javascript:, data:, file:, ftp:, mailto:)
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("ftp:") ||
    lower.startsWith("mailto:")
  ) {
    return false;
  }

  let clean = trimmed;
  if (!/^https?:\/\//i.test(clean)) {
    clean = "https://" + clean;
  }

  try {
    const parsed = new URL(clean);

    // Protocol must be HTTP or HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (!host || INVALID_HOSTS.has(host)) return false;

    // Disallow raw IP addresses (IPv4 & IPv6) for public brand extraction
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const isIPv6 = /^\[?[a-f0-9:]+\]?$/i.test(host) && host.includes(":");
    if (isIPv4 || isIPv6) return false;

    // Split hostname into domain labels
    const parts = host.split(".");
    if (parts.length < 2) return false;

    // Disallow empty labels (e.g., domain..com)
    if (parts.some((part) => !part)) return false;

    // Validate domain labels (rfc1035 / rfc1123 format)
    const labelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
    for (const part of parts) {
      if (part.startsWith("xn--")) continue; // IDN Punycode labels
      if (!labelRegex.test(part)) return false;
    }

    // TLD must be alpha (2-63 chars) or Punycode (xn--)
    const tld = parts[parts.length - 1];
    const isStandardTld = /^[a-z]{2,63}$/i.test(tld);
    const isPunycodeTld = /^xn--[a-z0-9]+$/i.test(tld);

    if (!isStandardTld && !isPunycodeTld) return false;

    return true;
  } catch {
    return false;
  }
}

function getDomainFromUrl(input: string): string | null {
  if (!isValidUrl(input)) return null;
  const trimmed = input.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  let clean = trimmed;
  if (!/^https?:\/\//i.test(clean)) {
    clean = "https://" + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}



export function SetupClient({ user }: SetupClientProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SetupStatus>("idle");
  const [loadedFaviconUrl, setLoadedFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    const activeDomain = getDomainFromUrl(url);
    if (!activeDomain) {
      setLoadedFaviconUrl(null);
      return;
    }

    const targetUrl = `https://www.google.com/s2/favicons?domain=${activeDomain}&sz=128`;
    let isMounted = true;

    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      if (isMounted) {
        // If naturalWidth <= 16, it's a default fallback icon; keep our MarkBrain logo
        if (img.naturalWidth > 16) {
          setLoadedFaviconUrl(targetUrl);
        } else {
          setLoadedFaviconUrl(null);
        }
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setLoadedFaviconUrl(null);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [url]);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const isInputValid = isValidUrl(url);

  const handleStartScan = (targetUrl: string) => {
    if (!isValidUrl(targetUrl) || status !== "idle" || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStatus("scanning");
      setCurrentStep(0);
      setProgress(0);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStartScan(url);
  };

  useEffect(() => {
    if (status !== "scanning") {
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return Math.min(100, prev + 2);
        }
        clearInterval(timer);
        setTimeout(() => {
          setStatus("success");
        }, 500);
        return 100;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [status]);

  const normalizedUrl =
    url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "") || "yourwebsite.com";

  const brandData = SAMPLE_BRANDS[normalizedUrl] || {
    name: normalizedUrl.split(".")[0]?.toUpperCase() || "Your Brand",
    color: "#ff5800",
    font: "Geist, sans-serif",
    voice: "Modern, articulate, and clear AI instructions.",
  };

  const mcpContextJson = JSON.stringify(
    {
      brand: brandData.name,
      domain: normalizedUrl,
      primary_color: brandData.color,
      typography: brandData.font,
      tone_of_voice: brandData.voice,
      mcp_status: "live_sync_enabled",
    },
    null,
    2
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mcpContextJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-sheet selection:bg-primary selection:text-primary-foreground">
      <div className="sheet flex min-h-svh flex-col">
        <div className="relative flex flex-1 flex-col">
          <SheetEdges />
          <TopBar hideNav signedIn={Boolean(user)} user={user} />

          <main className="relative flex flex-1 flex-col justify-between pb-8 md:pb-12">
            {/* Top Border Blueprint Spacing */}
            <div className="sheet-pad pt-[var(--sheet-pad)] w-full" />

            <div className="sheet-pad mx-auto my-auto w-full max-w-2xl">
              <div className="flex flex-col items-center text-center">
                {/* Brand Favicon Badge (Anchored Position) */}
                <div className="mb-3 flex items-center justify-center transition-all duration-300">
                  {loadedFaviconUrl ? (
                    <img
                      src={loadedFaviconUrl}
                      alt="Brand mark"
                      className="size-10 object-contain"
                    />
                  ) : (
                    <MarkBrain className="size-10 text-foreground" />
                  )}
                </div>

                {/* Morphing Headline */}
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground text-center text-balance transition-all duration-300">
                  {status === "idle" && "Add your brand"}
                  {status === "scanning" && `Extracting ${normalizedUrl}`}
                  {status === "success" && `${brandData.name} extracted`}
                </h1>

                {/* Dynamic Content Container with In-Place Smooth Transitions */}
                <div className="w-full flex flex-col items-center">
                  {/* STATE 1: IDLE FORM */}
                  {status === "idle" && (
                    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                      <p className="mt-2 text-body text-sm max-w-md text-center text-muted-foreground text-pretty">
                        Paste your website, and desin sets up <br />
                        your brand context automatically.
                      </p>

                      {/* Form Input Strip */}
                      <form
                        onSubmit={handleSubmit}
                        className="mt-6 relative flex w-full max-w-lg items-center gap-2 rounded bg-background-100 p-1.5"
                      >
                        <div className="flex flex-1 items-center px-3">
                          <input
                            type="text"
                            placeholder="yourwebsite.com"
                            value={url}
                            disabled={isSubmitting}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-transparent border-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 disabled:opacity-50"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={!isInputValid || isSubmitting}
                          size="icon"
                          className="shrink-0 size-9 rounded"
                          aria-label="Set up brand"
                        >
                          {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin text-white" />
                          ) : (
                            <ArrowRight className="size-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* STATE 2: SCANNING / EXTRACTING */}
                  {status === "scanning" && (
                    <div className="mt-2 font-mono text-sm sm:text-base font-semibold text-primary tracking-wider animate-in fade-in zoom-in-95 duration-300">
                      {progress}%
                    </div>
                  )}

                  {/* STATE 3: SUCCESS */}
                  {status === "success" && (
                    <div className="mt-6 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                      <Button asChild className="font-medium px-6 h-10">
                        <Link href="/app">
                          <span>Open brand page</span>
                          <ArrowRight className="size-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <SectionRule className="bottom-0" />
          </main>
        </div>
      </div>
    </div>
  );
}
