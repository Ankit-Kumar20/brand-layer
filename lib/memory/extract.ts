/**
 * L2 — Extract raw text from document content or URL.
 */

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

export async function extractDocument(input: {
  content?: string | null;
  url?: string | null;
  type?: string | null;
}): Promise<{ rawText: string; type: string }> {
  if (input.type === "pdf") {
    throw new Error("PDF extraction is not supported in v1; send plain text");
  }

  if (input.content?.trim()) {
    return { rawText: input.content.trim(), type: input.type ?? "text" };
  }

  if (input.url) {
    const res = await fetch(input.url, {
      headers: { "User-Agent": "brand-layer-memory/0.1" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch URL (${res.status})`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    if (contentType.includes("text/plain")) {
      return { rawText: body.trim(), type: "text" };
    }
    return { rawText: htmlToText(body), type: "webpage" };
  }

  throw new Error("No content or url to extract");
}
