const INVALID_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

/** Normalize user input to an absolute http(s) URL, or null if invalid. */
export function normalizeWebsiteUrl(input: string): string | null {
  if (!input) return null;

  const trimmed = input.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("ftp:") ||
    lower.startsWith("mailto:")
  ) {
    return null;
  }

  let clean = trimmed;
  if (!/^https?:\/\//i.test(clean)) {
    clean = "https://" + clean;
  }

  try {
    const parsed = new URL(clean);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (!host || INVALID_HOSTS.has(host)) return null;

    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const isIPv6 = /^\[?[a-f0-9:]+\]?$/i.test(host) && host.includes(":");
    if (isIPv4 || isIPv6) return null;

    const parts = host.split(".");
    if (parts.length < 2) return null;
    if (parts.some((part) => !part)) return null;

    const labelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
    for (const part of parts) {
      if (part.startsWith("xn--")) continue;
      if (!labelRegex.test(part)) return null;
    }

    const tld = parts[parts.length - 1];
    const isStandardTld = /^[a-z]{2,63}$/i.test(tld);
    const isPunycodeTld = /^xn--[a-z0-9]+$/i.test(tld);
    if (!isStandardTld && !isPunycodeTld) return null;

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

/** Turn `stripe.com` / `www.my-brand.co` into a display name. */
export function brandNameFromHostname(hostname: string): string {
  const host = hostname.replace(/^www\./, "");
  const label = host.split(".")[0] ?? host;
  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
