"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";

import { MarkBrain } from "@/components/logo/marks";
import { Button } from "@/components/ui/button";
import {
  hostnameFromUrl,
  normalizeWebsiteUrl,
} from "@/lib/brand/url";

type SetupStatus = "idle" | "scanning" | "success" | "error";

type CreatedBrand = {
  id: string;
  name: string;
  brandTag: string;
};

type AddBrandPanelProps = {
  onDone: (brand?: CreatedBrand) => void;
};

export function AddBrandPanel({ onDone }: AddBrandPanelProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SetupStatus>("idle");
  const [loadedFaviconUrl, setLoadedFaviconUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedBrand | null>(null);

  const normalized = normalizeWebsiteUrl(url);
  const isInputValid = Boolean(normalized);
  const activeDomain = normalized ? hostnameFromUrl(normalized) : null;

  useEffect(() => {
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
  }, [activeDomain]);

  useEffect(() => {
    if (status !== "scanning") {
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return prev;
        }
        return Math.min(90, prev + 2);
      });
    }, 80);

    return () => clearInterval(timer);
  }, [status]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!normalized || isSubmitting || status === "scanning") return;

    setIsSubmitting(true);
    setError(null);
    setCreated(null);
    setStatus("scanning");
    setProgress(8);

    try {
      const res = await fetch("/api/brands/from-url", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url: normalized }),
      });
      const data = (await res.json()) as {
        brand?: CreatedBrand;
        resolvedName?: string;
        error?: string;
        detail?: string;
      };

      if (!res.ok || !data.brand) {
        setStatus("error");
        setError(data.detail || data.error || `HTTP ${res.status}`);
        return;
      }

      setProgress(100);
      setCreated({
        id: data.brand.id,
        name: data.resolvedName || data.brand.name,
        brandTag: data.brand.brandTag,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayHost =
    activeDomain?.replace(/^www\./, "") || "yourwebsite.com";

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
          {status === "scanning" && `Extracting ${displayHost}`}
          {status === "success" &&
            `${created?.name ?? "Brand"} extracted`}
          {status === "error" && "Couldn’t set up that brand"}
        </h2>

        <div className="flex w-full flex-col items-center">
          {status === "idle" || status === "error" ? (
            <div className="flex w-full animate-in flex-col items-center fade-in zoom-in-95 duration-300">
              <p className="mt-2 max-w-md text-center text-sm text-pretty text-muted-foreground">
                Paste your website, and desin sets up <br />
                your brand context automatically.
              </p>

              {error ? (
                <p className="mt-3 max-w-md text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <form
                className="relative mt-6 flex w-full max-w-lg items-center gap-2 rounded bg-background-100 p-1.5"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-1 items-center px-3">
                  <input
                    className="w-full border-0 bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none disabled:opacity-50"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setUrl(event.target.value);
                      if (status === "error") {
                        setStatus("idle");
                        setError(null);
                      }
                    }}
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
            <div className="mt-6 flex animate-in flex-col items-center gap-3 fade-in zoom-in-95 duration-300">
              {created?.brandTag ? (
                <p className="font-mono text-xs text-muted-foreground">
                  {created.brandTag}
                </p>
              ) : null}
              <Button
                className="h-10 px-6 font-medium"
                onClick={() => onDone(created ?? undefined)}
              >
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
