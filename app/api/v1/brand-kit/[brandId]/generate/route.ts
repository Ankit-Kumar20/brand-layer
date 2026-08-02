import { getBrandIfOwner, requireUserSession } from "@/lib/auth-session";
import { generateBrandImage, getBrandKitByBrandId } from "@/lib/brand-kit";
import { BrandKitGenerateSchema } from "@/lib/brand-kit/schemas";

export const maxDuration = 120;

type RouteContext = { params: Promise<{ brandId: string }> };

/** Generate an ephemeral image from the selected brand kit + user prompt. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUserSession(request);
    const { brandId } = await context.params;

    const brand = await getBrandIfOwner(user.id, brandId);
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    const kit = await getBrandKitByBrandId(user.id, brandId);
    if (!kit) {
      return Response.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = BrandKitGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await generateBrandImage({
      identity: kit.identity,
      designLanguage: kit.designLanguage,
      sourceUrl: kit.sourceUrl,
      userPrompt: parsed.data.prompt,
      size: parsed.data.size,
    });

    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to generate image",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
