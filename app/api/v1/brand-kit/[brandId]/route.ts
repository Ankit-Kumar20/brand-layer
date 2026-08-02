import { getBrandIfOwner, requireUserSession } from "@/lib/auth-session";
import {
  getBrandKitByBrandId,
  patchBrandKit,
  syncBrandKitToMemory,
} from "@/lib/brand-kit";
import { BrandKitPatchSchema } from "@/lib/brand-kit/schemas";

type RouteContext = { params: Promise<{ brandId: string }> };

/** Get the editable brand kit for a brand. */
export async function GET(request: Request, context: RouteContext) {
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

    return Response.json({ kit });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to load brand kit",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

/** Partially update identity / design language; re-syncs into memory. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUserSession(request);
    const { brandId } = await context.params;

    const brand = await getBrandIfOwner(user.id, brandId);
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = BrandKitPatchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const kit = await patchBrandKit(user.id, brandId, parsed.data);
    if (!kit) {
      return Response.json({ error: "Brand kit not found" }, { status: 404 });
    }

    const kitDoc = await syncBrandKitToMemory({
      userId: user.id,
      brandTag: brand.brandTag,
      identity: kit.identity,
      designLanguage: kit.designLanguage,
      sourceUrl: kit.sourceUrl,
    });

    return Response.json({
      kit,
      brandKitDocumentId: kitDoc.id,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to update brand kit",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
