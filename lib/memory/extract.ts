/**
 * L2 — Extract raw text from markdown, PDF, JSON tokens, URLs, or SVG assets.
 */

import { extractText, getDocumentProxy } from "unpdf";
import { scrapeUrlWithFirecrawl } from "./firecrawl";
import { memoryError, memoryLog, memoryWarn } from "./log";

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenJsonTokens(
  value: unknown,
  path: string[] = [],
  lines: string[] = [],
): string[] {
  if (value === null || value === undefined) return lines;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    lines.push(`${path.join(".") || "value"}: ${String(value)}`);
    return lines;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => flattenJsonTokens(item, [...path, String(i)], lines));
    return lines;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flattenJsonTokens(v, [...path, k], lines);
    }
  }
  return lines;
}

function normalizeJsonContent(content: string): string {
  const parsed = JSON.parse(content) as unknown;
  const lines = flattenJsonTokens(parsed);
  if (lines.length === 0) {
    return JSON.stringify(parsed, null, 2);
  }
  return `Brand design tokens:\n${lines.join("\n")}`;
}

function svgAssetCard(opts: {
  content?: string | null;
  metadata?: Record<string, string | number | boolean> | null;
}): string {
  const meta = opts.metadata ?? {};
  const lines = [
    "Brand asset: SVG logo",
    `Asset type: ${meta.assetType ?? "logo"}`,
    meta.variant != null ? `Variant: ${meta.variant}` : null,
    meta.market != null ? `Market: ${meta.market}` : null,
    meta.rights != null ? `Rights: ${meta.rights}` : null,
    meta.usage != null ? `Usage: ${meta.usage}` : null,
    meta.product != null ? `Product: ${meta.product}` : null,
  ].filter(Boolean) as string[];

  const svg = opts.content?.trim() ?? "";
  if (svg) {
    const idMatch = svg.match(/\bid=["']([^"']+)["']/i);
    const titleMatch = svg.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (idMatch?.[1]) lines.push(`SVG id: ${idMatch[1]}`);
    if (titleMatch?.[1]) lines.push(`SVG title: ${titleMatch[1].trim()}`);
    const capped = svg.length > 4_000 ? `${svg.slice(0, 4_000)}…` : svg;
    lines.push("", "SVG markup:", capped);
  }

  return lines.join("\n");
}

async function extractPdfText(input: {
  content?: string | null;
  pdfBase64?: string | null;
}): Promise<string> {
  let bytes: Uint8Array;
  if (input.pdfBase64?.trim()) {
    const raw = input.pdfBase64.trim();
    const b64 = raw.includes("base64,") ? raw.split("base64,")[1]! : raw;
    bytes = Uint8Array.from(Buffer.from(b64, "base64"));
  } else if (input.content?.trim()) {
    // Allow callers to pass already-extracted text, or base64 in content
    const c = input.content.trim();
    if (c.startsWith("%PDF") || !/^[A-Za-z0-9+/=\s]+$/.test(c.slice(0, 200))) {
      return c;
    }
    bytes = Uint8Array.from(Buffer.from(c, "base64"));
  } else {
    throw new Error("PDF requires pdfBase64 or content");
  }

  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const rawText = (Array.isArray(text) ? text.join("\n") : text).trim();
  if (!rawText) throw new Error("PDF produced no extractable text");
  return rawText;
}

export async function extractDocument(input: {
  content?: string | null;
  url?: string | null;
  type?: string | null;
  kind?: string | null;
  metadata?: Record<string, string | number | boolean> | null;
  pdfBase64?: string | null;
}): Promise<{ rawText: string; type: string }> {
  const kind = input.kind ?? input.type;

  if (kind === "pdf" || input.type === "pdf" || input.pdfBase64) {
    memoryLog("L2", "extract pdf", {});
    const rawText = await extractPdfText(input);
    memoryLog("L2", "extract pdf done", { chars: rawText.length });
    return { rawText, type: "pdf" };
  }

  if (kind === "json" || input.type === "json") {
    if (!input.content?.trim()) throw new Error("JSON ingest requires content");
    memoryLog("L2", "extract json tokens", {
      chars: input.content.trim().length,
    });
    try {
      const rawText = normalizeJsonContent(input.content.trim());
      return { rawText, type: "json" };
    } catch {
      throw new Error("Invalid JSON content");
    }
  }

  if (kind === "svg_asset" || input.type === "asset" || input.type === "svg_asset") {
    memoryLog("L2", "extract svg asset card", {});
    const rawText = svgAssetCard({
      content: input.content,
      metadata: input.metadata,
    });
    if (!rawText.trim()) throw new Error("SVG asset produced empty card");
    return { rawText, type: "svg_asset" };
  }

  if (kind === "markdown" || input.type === "markdown") {
    if (!input.content?.trim()) throw new Error("Markdown requires content");
    const rawText = input.content.trim().replace(/\r\n/g, "\n");
    memoryLog("L2", "extract markdown", { chars: rawText.length });
    return { rawText, type: "markdown" };
  }

  if (input.content?.trim()) {
    memoryLog("L2", "extract from content", {
      chars: input.content.trim().length,
    });
    return { rawText: input.content.trim(), type: input.type ?? "text" };
  }

  if (input.url) {
    // Prefer Firecrawl for JS-heavy / marketing pages when configured.
    try {
      const markdown = await scrapeUrlWithFirecrawl(input.url);
      if (markdown) {
        return { rawText: markdown, type: "webpage" };
      }
    } catch (err) {
      memoryWarn("L2", "firecrawl failed — falling back to fetch", {
        url: input.url,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    memoryLog("L2", "extract fetch url", { url: input.url });
    const res = await fetch(input.url, {
      headers: { "User-Agent": "brand-layer-memory/0.1" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      memoryError("L2", "url fetch failed", {
        url: input.url,
        status: res.status,
      });
      throw new Error(`Failed to fetch URL (${res.status})`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    if (
      contentType.includes("text/plain") ||
      contentType.includes("text/markdown")
    ) {
      memoryLog("L2", "extract url text", { chars: body.trim().length });
      return { rawText: body.trim(), type: "text" };
    }
    if (contentType.includes("application/json")) {
      try {
        const rawText = normalizeJsonContent(body);
        return { rawText, type: "json" };
      } catch {
        return { rawText: body.trim(), type: "text" };
      }
    }
    const rawText = htmlToText(body);
    memoryLog("L2", "extract url html→text", { chars: rawText.length });
    return { rawText, type: "webpage" };
  }

  throw new Error("No content or url to extract");
}
