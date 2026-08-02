import { fetchLogoFile } from "@/lib/brand-kit/fetch-logo-file";
import { buildBrandImagePrompt } from "@/lib/brand-kit/generate-prompt";
import type {
  BrandKitDesignLanguage,
  BrandKitIdentity,
} from "@/lib/brand-kit/schemas";
import { getOpenAI, IMAGE_MODEL } from "@/lib/openai";

export type BrandImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export type GeneratedBrandImage = {
  imageBase64: string;
  mimeType: "image/png";
  promptUsed: string;
  model: string;
  size: BrandImageSize;
  logoAttached: boolean;
};

/** Generate an ephemeral brand-grounded image via OpenAI Images (no persistence). */
export async function generateBrandImage(opts: {
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
  sourceUrl?: string | null;
  userPrompt: string;
  size?: BrandImageSize;
}): Promise<GeneratedBrandImage> {
  const size = opts.size ?? "1024x1024";
  const logoFile = opts.identity.logoUrl
    ? await fetchLogoFile(opts.identity.logoUrl)
    : null;
  const logoAttached = logoFile != null;

  const promptUsed = buildBrandImagePrompt({
    identity: opts.identity,
    designLanguage: opts.designLanguage,
    sourceUrl: opts.sourceUrl,
    userPrompt: opts.userPrompt,
    logoAttached,
  });

  const openai = getOpenAI();
  // gpt-image-2 does not support input_fidelity (always high fidelity internally)
  const supportsInputFidelity = !IMAGE_MODEL.includes("gpt-image-2");
  const response = logoFile
    ? await openai.images.edit({
        model: IMAGE_MODEL,
        image: logoFile,
        prompt: promptUsed,
        n: 1,
        size,
        quality: "medium",
        output_format: "png",
        ...(supportsInputFidelity ? { input_fidelity: "high" as const } : {}),
      })
    : await openai.images.generate({
        model: IMAGE_MODEL,
        prompt: promptUsed,
        n: 1,
        size,
        quality: "medium",
        output_format: "png",
      });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error("OpenAI returned no image data");
  }

  return {
    imageBase64,
    mimeType: "image/png",
    promptUsed,
    model: IMAGE_MODEL,
    size,
    logoAttached,
  };
}
