"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";

import { MarkBrain } from "@/components/logo/marks";
import { Button } from "@/components/ui/button";

type SetupStatus = "idle" | "scanning" | "success";

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

const INVALID_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isValidUrl(input: string): boolean {
  if (!input) return false;

  const trimmed = input.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!trimmed) return false;

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

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (!host || INVALID_HOSTS.has(host)) return false;

    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const isIPv6 = /^\[?[a-f0-9:]+\]?$/i.test(host) && host.includes(":");
    if (isIPv4 || isIPv6) return false;

    const parts = host.split(".");
    if (parts.length < 2) return false;
    if (parts.some((part) => !part)) return false;

    const labelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
    for (const part of parts) {
      if (part.startsWith("xn--")) continue;
      if (!labelRegex.test(part)) return false;
    }

    const tld = parts[parts.length - 1];
    const isStandardTld = /^[a-z]{2,63}$/i.test(tld);
    const isPunycodeTld = /^xn--[a-z0-9]+$/i.test(tld);

    return isStandardTld || isPunycodeTld;
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

type AddBrandPanelProps = {
  onDone: () => void;
};

export function AddBrandPanel({ onDone }: AddBrandPanelProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SetupStatus>("idle");
  const [loadedFaviconUrl, setLoadedFaviconUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const isInputValid = isValidUrl(url);

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
      if (!isMounted) return;
      if (img.naturalWidth > 16) {
        setLoadedFaviconUrl(targetUrl);
      } else {
        setLoadedFaviconUrl(null);
      }
    };
    img.onerror = () => {
      if (isMounted) setLoadedFaviconUrl(null);
    };

    return () => {
      isMounted = false;
    };
  }, [url]);

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

  function handleStartScan(targetUrl: string) {
    if (!isValidUrl(targetUrl) || status !== "idle" || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStatus("scanning");
      setProgress(0);
    }, 2000);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    handleStartScan(url);
  }

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

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-3 flex items-center justify-center transition-all duration-300">
          {loadedFaviconUrl ? (
            <img
              alt="Brand mark"
              className="size-10 object-contain"
              src={loadedFaviconUrl}
            />
          ) : (
            <MarkBrain className="size-10 text-foreground" />
          )}
        </div>

        <h2 className="text-balance text-center text-xl font-medium tracking-tight text-foreground transition-all duration-300 sm:text-2xl">
          {status === "idle" && "Add your brand"}
          {status === "scanning" && `Extracting ${normalizedUrl}`}
          {status === "success" && `${brandData.name} extracted`}
        </h2>

        <div className="flex w-full flex-col items-center">
          {status === "idle" ? (
            <div className="flex w-full animate-in flex-col items-center fade-in zoom-in-95 duration-300">
              <p className="mt-2 max-w-md text-center text-sm text-pretty text-muted-foreground">
                Paste your website, and desin sets up <br />
                your brand context automatically.
              </p>

              <form
                className="relative mt-6 flex w-full max-w-lg items-center gap-2 rounded bg-background-100 p-1.5"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-1 items-center px-3">
                  <input
                    className="w-full border-0 bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none disabled:opacity-50"
                    disabled={isSubmitting}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="yourwebsite.com"
                    type="text"
                    value={url}
                  />
                </div>
                <Button
                  aria-label="Set up brand"
                  className="size-9 shrink-0 rounded"
                  disabled={!isInputValid || isSubmitting}
                  size="icon"
                  type="submit"
                >
                      {isSubmitting ? (
                        <CircleNotch className="size-4 animate-spin text-white" />
                      ) : (
                        <ArrowRight className="size-4" weight="bold" />
                      )}
                </Button>
              </form>
            </div>
          ) : null}

          {status === "scanning" ? (
            <div className="mt-2 animate-in font-mono text-sm font-semibold tracking-wider text-primary fade-in zoom-in-95 duration-300 sm:text-base">
              {progress}%
            </div>
          ) : null}

          {status === "success" ? (
            <div className="mt-6 flex animate-in items-center justify-center fade-in zoom-in-95 duration-300">
              <Button className="h-10 px-6 font-medium" onClick={onDone}>
                <span>Continue</span>
                <ArrowRight className="ml-2 size-4" weight="bold" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
