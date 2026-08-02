"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CircleNotch,
  DownloadSimple,
  Plus,
  X,
} from "@phosphor-icons/react";

import { AuthModal } from "@/components/auth/auth-modal";
import { SectionRule } from "@/components/landing/section-rule";
import { Button } from "@/components/ui/button";
import {
  hostnameFromUrl,
  normalizeWebsiteUrl,
} from "@/lib/brand/url";
import { cn } from "@/lib/utils";

type BrandSummary = {
  id: string;
  name: string;
  slug: string;
  brandTag: string;
};

type KitColor = { hex: string; role?: string };

type KitIdentity = {
  name: string;
  domain?: string;
  logoUrl?: string;
  description?: string;
  tagline?: string;
};

type KitDesignLanguage = {
  colors: KitColor[];
  fonts: { heading?: string; body?: string };
  tone: string[];
  aesthetic?: string;
};

type BrandKit = {
  id: string;
  brandId: string;
  brandTag: string;
  sourceUrl: string | null;
  status: string;
  identity: KitIdentity;
  designLanguage: KitDesignLanguage;
};

type BrandKitAppProps = {
  signedIn: boolean;
};

const fieldClassName =
  "w-full border-0 border-b border-border bg-transparent py-2.5 text-body text-foreground outline-none transition-colors duration-300 ease-[var(--ease-swift)] placeholder:text-muted-foreground/50 focus:border-primary";

/** Truncated prose with Show more; edit via flat (non-resizable) field. */
function ClampedProseField({
  label,
  value,
  placeholder,
  onChange,
  clampLines = 3,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  clampLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const text = value.trim();
  const needsClamp = text.length > 160 || text.split(/\n/).length > clampLines;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-label text-muted-foreground">{label}</span>
        <button
          className="text-label text-primary transition-colors duration-300 ease-[var(--ease-swift)] hover:text-primary/80"
          onClick={() => setEditing((v) => !v)}
          type="button"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing ? (
        <textarea
          className="min-h-24 w-full resize-none border-0 border-b border-border bg-transparent py-2 text-body text-foreground outline-none transition-colors duration-300 ease-[var(--ease-swift)] placeholder:text-muted-foreground/50 focus:border-primary"
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          value={value}
        />
      ) : text ? (
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "text-body text-pretty text-foreground",
              !expanded && needsClamp && "line-clamp-3",
            )}
          >
            {text}
          </p>
          {needsClamp ? (
            <button
              className="self-start text-label text-primary transition-colors duration-300 ease-[var(--ease-swift)] hover:text-primary/80"
              onClick={() => setExpanded((v) => !v)}
              type="button"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-body text-muted-foreground/60">
          {placeholder ?? "Empty"}
        </p>
      )}
    </div>
  );
}

function emptyIdentity(): KitIdentity {
  return { name: "" };
}

function emptyDesign(): KitDesignLanguage {
  return { colors: [], fonts: {}, tone: [] };
}

export function BrandKitApp({ signedIn }: BrandKitAppProps) {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [identity, setIdentity] = useState<KitIdentity>(emptyIdentity);
  const [design, setDesign] = useState<KitDesignLanguage>(emptyDesign);
  const [url, setUrl] = useState("");
  const [loadingList, setLoadingList] = useState(signedIn);
  const [loadingKit, setLoadingKit] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toneDraft, setToneDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("#");
  const [genPrompt, setGenPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genImageSrc, setGenImageSrc] = useState<string | null>(null);
  const [genPromptUsed, setGenPromptUsed] = useState<string | null>(null);
  const [genLogoAttached, setGenLogoAttached] = useState(false);
  const [showPromptUsed, setShowPromptUsed] = useState(false);

  const normalized = normalizeWebsiteUrl(url);
  const previewHost = normalized
    ? hostnameFromUrl(normalized)?.replace(/^www\./, "")
    : null;

  const loadBrands = useCallback(async () => {
    if (!signedIn) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as {
        brands?: BrandSummary[];
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        setError(data.detail || data.error || `HTTP ${res.status}`);
        return;
      }
      const list = data.brands ?? [];
      setBrands(list);
      setSelectedBrandId((prev) => {
        if (prev && list.some((b) => b.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brands");
    } finally {
      setLoadingList(false);
    }
  }, [signedIn]);

  const loadKit = useCallback(async (brandId: string) => {
    setLoadingKit(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/v1/brand-kit/${brandId}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as {
        kit?: BrandKit;
        error?: string;
        detail?: string;
      };
      if (res.status === 404) {
        setKit(null);
        setIdentity(emptyIdentity());
        setDesign(emptyDesign());
        setDirty(false);
        setNotice(
          "No structured kit yet for this brand. Import a URL to create one.",
        );
        return;
      }
      if (!res.ok || !data.kit) {
        setError(data.detail || data.error || `HTTP ${res.status}`);
        return;
      }
      setKit(data.kit);
      setIdentity(data.kit.identity);
      setDesign(data.kit.designLanguage);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brand kit");
    } finally {
      setLoadingKit(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    if (!selectedBrandId) {
      setKit(null);
      setIdentity(emptyIdentity());
      setDesign(emptyDesign());
      setGenPrompt("");
      setGenImageSrc(null);
      setGenPromptUsed(null);
      setGenLogoAttached(false);
      setShowPromptUsed(false);
      return;
    }
    setGenPrompt("");
    setGenImageSrc(null);
    setGenPromptUsed(null);
    setGenLogoAttached(false);
    setShowPromptUsed(false);
    void loadKit(selectedBrandId);
  }, [selectedBrandId, loadKit]);

  async function handleImport(event: FormEvent) {
    event.preventDefault();
    if (!normalized || importing) return;

    setImporting(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/v1/brand-kit/from-url", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url: normalized }),
      });
      const data = (await res.json()) as {
        brand?: BrandSummary;
        kit?: BrandKit;
        error?: string;
        detail?: string;
      };

      if (!res.ok || !data.brand || !data.kit) {
        setError(data.detail || data.error || `HTTP ${res.status}`);
        return;
      }

      setUrl("");
      setBrands((prev) => {
        if (prev.some((b) => b.id === data.brand!.id)) return prev;
        return [data.brand!, ...prev];
      });
      setSelectedBrandId(data.brand.id);
      setKit(data.kit);
      setIdentity(data.kit.identity);
      setDesign(data.kit.designLanguage);
      setDirty(false);
      setNotice("Brand kit imported. Memory ingest is queued in the background.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleGenerate() {
    if (!selectedBrandId || !kit || generating) return;
    const prompt = genPrompt.trim();
    if (!prompt) {
      setError("Enter a prompt to generate an image.");
      return;
    }

    setGenerating(true);
    setError(null);
    setNotice(null);
    setGenImageSrc(null);
    setGenPromptUsed(null);
    setGenLogoAttached(false);

    try {
      const res = await fetch(
        `/api/v1/brand-kit/${selectedBrandId}/generate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ prompt }),
        },
      );
      const data = (await res.json()) as {
        imageBase64?: string;
        mimeType?: string;
        promptUsed?: string;
        logoAttached?: boolean;
        error?: string;
        detail?: string;
      };

      if (!res.ok || !data.imageBase64) {
        setError(data.detail || data.error || `HTTP ${res.status}`);
        return;
      }

      const mime = data.mimeType ?? "image/png";
      setGenImageSrc(`data:${mime};base64,${data.imageBase64}`);
      setGenPromptUsed(data.promptUsed ?? null);
      setGenLogoAttached(Boolean(data.logoAttached));
      setNotice(
        data.logoAttached
          ? "Image generated with logo attached as reference. Not saved — download if you want to keep it."
          : "Image generated. Not saved — download if you want to keep it.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!selectedBrandId || !kit || saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/v1/brand-kit/${selectedBrandId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          identity,
          designLanguage: design,
        }),
      });
      const data = (await res.json()) as {
        kit?: BrandKit;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.kit) {
        setError(data.detail || data.error || `HTTP ${res.status}`);
        return;
      }
      setKit(data.kit);
      setIdentity(data.kit.identity);
      setDesign(data.kit.designLanguage);
      setDirty(false);
      setNotice("Saved. Kit snapshot re-synced to memory.");
      setBrands((prev) =>
        prev.map((b) =>
          b.id === selectedBrandId
            ? { ...b, name: data.kit!.identity.name }
            : b,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function markDirty() {
    setDirty(true);
    setNotice(null);
  }

  function addTone() {
    const tag = toneDraft.trim();
    if (!tag) return;
    if (design.tone.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setToneDraft("");
      return;
    }
    setDesign((d) => ({ ...d, tone: [...d.tone, tag] }));
    setToneDraft("");
    markDirty();
  }

  function addColor() {
    const hex = colorDraft.trim();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
    const normalizedHex = hex.toUpperCase();
    if (design.colors.some((c) => c.hex.toUpperCase() === normalizedHex)) {
      setColorDraft("#");
      return;
    }
    setDesign((d) => ({
      ...d,
      colors: [...d.colors, { hex: normalizedHex }],
    }));
    setColorDraft("#");
    markDirty();
  }

  if (!signedIn) {
    return (
      <div className="sheet-pad flex flex-1 flex-col py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 animate-fade-up">
          <div className="flex flex-col gap-3">
            <p className="text-label text-primary">Brand kit</p>
            <h1 className="text-title font-medium text-balance">
              Import a site. Edit the system.
            </h1>
            <p className="text-prose text-pretty text-foreground/80">
              Paste a URL. desin extracts identity and design language into an
              editable kit — and queues it into brand memory.
            </p>
          </div>
          <AuthModal>
            <Button className="h-12 w-full px-7 text-body font-medium sm:w-auto">
              Sign in to continue
            </Button>
          </AuthModal>
        </div>
        <SectionRule className="bottom-0" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="sheet-pad relative py-10 md:py-14">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 animate-fade-up">
          <div className="flex flex-col gap-3">
            <p className="text-label text-primary">Brand kit</p>
            <h1 className="text-title font-medium text-balance">
              Structured brand context
            </h1>
            <p className="max-w-2xl text-body text-pretty text-muted-foreground">
              Import from a website, then refine identity and design language.
              Saves sync back into the memory layer for agents.
            </p>
          </div>

          <form
            className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
            onSubmit={handleImport}
          >
            <div className="flex flex-1 items-center gap-2 rounded bg-background-100 p-1.5">
              <input
                className="w-full border-0 bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none disabled:opacity-50"
                disabled={importing}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="yourwebsite.com"
                type="text"
                value={url}
              />
              <Button
                aria-label="Import brand kit from URL"
                className="size-9 shrink-0"
                disabled={!normalized || importing}
                size="icon"
                type="submit"
              >
                {importing ? (
                  <CircleNotch className="size-4 animate-spin text-white" />
                ) : (
                  <ArrowRight className="size-4" weight="bold" />
                )}
              </Button>
            </div>
            {previewHost ? (
              <p className="text-label text-muted-foreground sm:shrink-0">
                {importing ? `Extracting ${previewHost}` : previewHost}
              </p>
            ) : null}
          </form>

          {error ? (
            <p className="text-body text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-body text-muted-foreground">{notice}</p>
          ) : null}
        </div>
        <SectionRule className="bottom-0" />
      </section>

      <section className="sheet-pad relative flex flex-1 flex-col py-10 md:py-14">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-label text-primary">Brand</p>
              {loadingList ? (
                <p className="text-body text-muted-foreground">Loading…</p>
              ) : brands.length === 0 ? (
                <p className="text-body text-muted-foreground">
                  No brands yet. Import a URL above.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <button
                      className={cn(
                        "h-9 rounded px-3 text-sm transition-colors duration-300 ease-[var(--ease-swift)]",
                        selectedBrandId === brand.id
                          ? "bg-foreground text-sheet"
                          : "bg-background-100 text-foreground hover:bg-background-300",
                      )}
                      key={brand.id}
                      onClick={() => setSelectedBrandId(brand.id)}
                      type="button"
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {kit ? (
              <Button
                className="h-11 px-6 font-medium"
                disabled={!dirty || saving}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <>
                    <CircleNotch className="size-4 animate-spin" />
                    Saving
                  </>
                ) : dirty ? (
                  "Save changes"
                ) : (
                  "Saved"
                )}
              </Button>
            ) : null}
          </div>

          {loadingKit ? (
            <p className="text-body text-muted-foreground">Loading kit…</p>
          ) : null}

          {kit && !loadingKit ? (
            <>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <p className="text-label text-primary">Identity</p>
                  <h2 className="text-prose text-foreground">Who you are</h2>
                </div>

                <div className="flex flex-col gap-6">
                  {identity.logoUrl ? (
                    <div className="flex items-center gap-4">
                      <img
                        alt={`${identity.name} logo`}
                        className="size-12 object-contain"
                        src={identity.logoUrl}
                      />
                      <p className="font-mono text-xs break-all text-muted-foreground">
                        {identity.logoUrl}
                      </p>
                    </div>
                  ) : null}

                  <label className="flex flex-col gap-1">
                    <span className="text-label text-muted-foreground">Name</span>
                    <input
                      className={fieldClassName}
                      onChange={(e) => {
                        setIdentity((i) => ({ ...i, name: e.target.value }));
                        markDirty();
                      }}
                      value={identity.name}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-label text-muted-foreground">
                      Domain
                    </span>
                    <input
                      className={fieldClassName}
                      onChange={(e) => {
                        setIdentity((i) => ({
                          ...i,
                          domain: e.target.value || undefined,
                        }));
                        markDirty();
                      }}
                      placeholder="example.com"
                      value={identity.domain ?? ""}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-label text-muted-foreground">
                      Tagline
                    </span>
                    <input
                      className={fieldClassName}
                      onChange={(e) => {
                        setIdentity((i) => ({
                          ...i,
                          tagline: e.target.value || undefined,
                        }));
                        markDirty();
                      }}
                      placeholder="Short brand line"
                      value={identity.tagline ?? ""}
                    />
                  </label>

                  <ClampedProseField
                    label="Description"
                    onChange={(next) => {
                      setIdentity((i) => ({
                        ...i,
                        description: next || undefined,
                      }));
                      markDirty();
                    }}
                    placeholder="What the brand does"
                    value={identity.description ?? ""}
                  />

                  <label className="flex flex-col gap-1">
                    <span className="text-label text-muted-foreground">
                      Logo URL
                    </span>
                    <input
                      className={fieldClassName}
                      onChange={(e) => {
                        setIdentity((i) => ({
                          ...i,
                          logoUrl: e.target.value || undefined,
                        }));
                        markDirty();
                      }}
                      placeholder="https://"
                      value={identity.logoUrl ?? ""}
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <p className="text-label text-primary">Design language</p>
                  <h2 className="text-prose text-foreground">How you look</h2>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="text-label text-muted-foreground">
                      Colors
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {design.colors.map((color, index) => (
                        <div
                          className="group flex items-center gap-2"
                          key={`${color.hex}-${index}`}
                        >
                          <span
                            className="size-10 border border-border"
                            style={{ backgroundColor: color.hex }}
                            title={color.role ? `${color.role}: ${color.hex}` : color.hex}
                          />
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-foreground">
                              {color.hex}
                            </span>
                            {color.role ? (
                              <span className="text-label text-muted-foreground">
                                {color.role}
                              </span>
                            ) : null}
                          </div>
                          <button
                            aria-label={`Remove ${color.hex}`}
                            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity duration-300 ease-[var(--ease-swift)] group-hover:opacity-100 hover:text-foreground"
                            onClick={() => {
                              setDesign((d) => ({
                                ...d,
                                colors: d.colors.filter((_, i) => i !== index),
                              }));
                              markDirty();
                            }}
                            type="button"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="w-28 border-0 border-b border-border bg-transparent py-2 font-mono text-sm outline-none focus:border-primary"
                        onChange={(e) => setColorDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addColor();
                          }
                        }}
                        placeholder="#FF5800"
                        value={colorDraft}
                      />
                      <Button
                        onClick={addColor}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Plus className="size-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-label text-muted-foreground">
                        Heading font
                      </span>
                      <input
                        className={fieldClassName}
                        onChange={(e) => {
                          setDesign((d) => ({
                            ...d,
                            fonts: {
                              ...d.fonts,
                              heading: e.target.value || undefined,
                            },
                          }));
                          markDirty();
                        }}
                        value={design.fonts.heading ?? ""}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-label text-muted-foreground">
                        Body font
                      </span>
                      <input
                        className={fieldClassName}
                        onChange={(e) => {
                          setDesign((d) => ({
                            ...d,
                            fonts: {
                              ...d.fonts,
                              body: e.target.value || undefined,
                            },
                          }));
                          markDirty();
                        }}
                        value={design.fonts.body ?? ""}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-label text-muted-foreground">Tone</span>
                    <div className="flex flex-wrap gap-2">
                      {design.tone.map((tag) => (
                        <button
                          className="inline-flex items-center gap-1.5 rounded bg-background-100 px-2.5 py-1 text-sm text-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-background-300"
                          key={tag}
                          onClick={() => {
                            setDesign((d) => ({
                              ...d,
                              tone: d.tone.filter((t) => t !== tag),
                            }));
                            markDirty();
                          }}
                          type="button"
                        >
                          {tag}
                          <X className="size-3" />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="min-w-0 flex-1 border-0 border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary"
                        onChange={(e) => setToneDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTone();
                          }
                        }}
                        placeholder="Add tone tag"
                        value={toneDraft}
                      />
                      <Button
                        onClick={addTone}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Plus className="size-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <ClampedProseField
                    label="Aesthetic"
                    onChange={(next) => {
                      setDesign((d) => ({
                        ...d,
                        aesthetic: next || undefined,
                      }));
                      markDirty();
                    }}
                    placeholder="Visual style in a few sentences"
                    value={design.aesthetic ?? ""}
                  />

                  {kit.sourceUrl ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      Source: {kit.sourceUrl}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <p className="text-label text-primary">Generate</p>
                <h2 className="text-prose text-foreground">
                  Create with this brand
                </h2>
                <p className="text-body text-muted-foreground">
                  Uses the saved kit for {identity.name || "this brand"} — colors,
                  tone, aesthetic, and logo
                  {identity.logoUrl
                    ? " (downloaded and attached when generating)"
                    : ""}
                  . Images are not stored.
                </p>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-label text-muted-foreground">Prompt</span>
                <textarea
                  className="min-h-28 w-full resize-none border-0 border-b border-border bg-transparent py-2 text-body text-foreground outline-none transition-colors duration-300 ease-[var(--ease-swift)] placeholder:text-muted-foreground/50 focus:border-primary"
                  disabled={generating}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="e.g. Hero illustration of a product launch on a dark background"
                  rows={4}
                  value={genPrompt}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="h-11 px-6 font-medium"
                  disabled={generating || !genPrompt.trim()}
                  onClick={() => void handleGenerate()}
                  type="button"
                >
                  {generating ? (
                    <>
                      <CircleNotch className="size-4 animate-spin" />
                      Generating
                    </>
                  ) : (
                    "Generate image"
                  )}
                </Button>
                {dirty ? (
                  <p className="text-label text-muted-foreground">
                    Unsaved kit edits are not included — save first.
                  </p>
                ) : null}
              </div>

              {genImageSrc ? (
                <div className="flex flex-col gap-4">
                  <img
                    alt="Generated brand image"
                    className="max-h-[32rem] w-full max-w-xl object-contain"
                    src={genImageSrc}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      className="inline-flex h-9 items-center gap-2 rounded bg-background-100 px-3 text-sm text-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-background-300"
                      download={`${identity.name || "brand"}-generate.png`}
                      href={genImageSrc}
                    >
                      <DownloadSimple className="size-4" />
                      Download
                    </a>
                    {genLogoAttached ? (
                      <span className="text-label text-muted-foreground">
                        Logo attached as reference
                      </span>
                    ) : null}
                    {genPromptUsed ? (
                      <button
                        className="text-label text-primary transition-colors duration-300 ease-[var(--ease-swift)] hover:text-primary/80"
                        onClick={() => setShowPromptUsed((v) => !v)}
                        type="button"
                      >
                        {showPromptUsed ? "Hide prompt used" : "Show prompt used"}
                      </button>
                    ) : null}
                  </div>
                  {showPromptUsed && genPromptUsed ? (
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                      {genPromptUsed}
                    </pre>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
          ) : null}
        </div>
        <SectionRule className="bottom-0" />
      </section>
    </div>
  );
}
