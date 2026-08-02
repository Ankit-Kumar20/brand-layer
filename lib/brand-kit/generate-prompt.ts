import { formatBrandKitMarkdown } from "@/lib/brand-kit/format";
import type {
  BrandKitDesignLanguage,
  BrandKitIdentity,
} from "@/lib/brand-kit/schemas";

/** Build an OpenAI Images prompt grounded in the selected brand kit. */
export function buildBrandImagePrompt(opts: {
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
  sourceUrl?: string | null;
  userPrompt: string;
  /** True when the logo bytes are attached to images.edit as a reference. */
  logoAttached?: boolean;
}): string {
  const kitMarkdown = formatBrandKitMarkdown({
    identity: opts.identity,
    designLanguage: opts.designLanguage,
    sourceUrl: opts.sourceUrl,
  });

  const colorLine = opts.designLanguage.colors.length
    ? opts.designLanguage.colors
        .map((c) => (c.role ? `${c.role} ${c.hex}` : c.hex))
        .join(", ")
    : "(none listed)";

  const logoConstraint = opts.logoAttached
    ? "- A brand logo image is attached as visual reference. When the composition should include the mark, reproduce it faithfully (colors, proportions, clear space); do not invent a new logo."
    : opts.identity.logoUrl
      ? `- Logo reference URL (respect mark style if depicting a logo): ${opts.identity.logoUrl}`
      : "- No logo URL on file; do not invent a conflicting mark.";

  return [
    "Create a single on-brand marketing image.",
    "",
    "User request:",
    opts.userPrompt.trim(),
    "",
    "Brand kit (follow closely):",
    kitMarkdown,
    "",
    "Visual constraints:",
    `- Prefer these brand colors: ${colorLine}`,
    logoConstraint,
    opts.designLanguage.tone.length
      ? `- Tone: ${opts.designLanguage.tone.join(", ")}`
      : null,
    opts.designLanguage.aesthetic
      ? `- Aesthetic: ${opts.designLanguage.aesthetic}`
      : null,
    "- Do not invent off-brand colors, claims, or unrelated product names.",
    "- Do not render any URLs, web addresses, or domain names on the image.",
    "- No watermarks, no UI chrome, no mock browser frames unless requested.",
  ]
    .filter((line): line is string => line != null)
    .join("\n");
}
