import type {
  BrandKitDesignLanguage,
  BrandKitIdentity,
} from "@/lib/brand-kit/schemas";

/** Markdown snapshot of a brand kit for memory-layer ingest. */
export function formatBrandKitMarkdown(opts: {
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
  sourceUrl?: string | null;
}): string {
  const { identity, designLanguage, sourceUrl } = opts;
  const lines: string[] = [
    "# Brand kit",
    "",
    "## Identity",
    `- Name: ${identity.name}`,
  ];

  if (identity.domain) lines.push(`- Domain: ${identity.domain}`);
  if (identity.logoUrl) lines.push(`- Logo: ${identity.logoUrl}`);
  if (identity.tagline) lines.push(`- Tagline: ${identity.tagline}`);
  if (identity.description) {
    lines.push("", identity.description);
  }

  lines.push("", "## Design language");

  if (designLanguage.colors.length) {
    lines.push("- Colors:");
    for (const c of designLanguage.colors) {
      lines.push(
        `  - ${c.role ? `${c.role}: ` : ""}${c.hex}`,
      );
    }
  }

  if (designLanguage.fonts.heading || designLanguage.fonts.body) {
    lines.push("- Fonts:");
    if (designLanguage.fonts.heading) {
      lines.push(`  - Heading: ${designLanguage.fonts.heading}`);
    }
    if (designLanguage.fonts.body) {
      lines.push(`  - Body: ${designLanguage.fonts.body}`);
    }
  }

  if (designLanguage.tone.length) {
    lines.push(`- Tone: ${designLanguage.tone.join(", ")}`);
  }

  if (designLanguage.aesthetic) {
    lines.push("", designLanguage.aesthetic);
  }

  if (sourceUrl) {
    lines.push("", `Source: ${sourceUrl}`);
  }

  return lines.join("\n");
}
