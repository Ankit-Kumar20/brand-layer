import {
  createUserBrand,
  listUserBrands,
  requireUserSession,
} from "@/lib/auth-session";

/** List brands the signed-in user can access. */
export async function GET(request: Request) {
  try {
    const user = await requireUserSession(request);
    const brands = await listUserBrands(user.id);
    return Response.json({ brands });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to list brands",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

/** Create a brand (and org if needed) + default encrypted API key. */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      slug?: string;
      organizationId?: string;
    };

    if (!body.name?.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const { apiKey, ...brand } = await createUserBrand(user.id, {
      name: body.name,
      slug: body.slug,
      organizationId: body.organizationId,
    });

    return Response.json({
      brand,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.raw,
        prefix: apiKey.prefix,
        created: apiKey.created,
        recoverable: true,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to create brand",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
