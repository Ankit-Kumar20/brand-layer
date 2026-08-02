import { toFile } from "openai";
import sharp from "sharp";

const MAX_LOGO_BYTES = 50 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

type LogoFile = Awaited<ReturnType<typeof toFile>>;

function sniffIsSvg(bytes: Buffer, contentType: string, url: string): boolean {
  if (contentType.includes("svg")) return true;
  if (/\.svg($|\?)/i.test(url)) return true;
  const head = bytes.subarray(0, 256).toString("utf8").trimStart();
  return head.startsWith("<svg") || head.startsWith("<?xml");
}

function rasterMimeExt(
  contentType: string,
): { mime: string; ext: string } | null {
  if (contentType.includes("png")) return { mime: "image/png", ext: "png" };
  if (contentType.includes("webp")) return { mime: "image/webp", ext: "webp" };
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  return null;
}

/**
 * Download a brand logo URL and prepare an OpenAI uploadable file.
 * SVGs are rasterized to PNG via sharp. Returns null if download/convert fails
 * or the asset is not a supported image type.
 */
export async function fetchLogoFile(
  logoUrl: string,
): Promise<LogoFile | null> {
  if (!logoUrl || logoUrl.startsWith("data:")) return null;

  let url: URL;
  try {
    url = new URL(logoUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  try {
    const res = await fetch(logoUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "image/*,*/*" },
    });
    if (!res.ok) return null;

    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_LOGO_BYTES) return null;

    const contentType = (
      res.headers.get("content-type") ?? ""
    ).toLowerCase();

    if (sniffIsSvg(bytes, contentType, logoUrl)) {
      const png = await sharp(bytes, { density: 300 })
        .resize({
          width: 1024,
          height: 1024,
          fit: "inside",
          withoutEnlargement: false,
        })
        .png()
        .toBuffer();
      return toFile(png, "logo.png", { type: "image/png" });
    }

    const raster = rasterMimeExt(contentType);
    if (raster) {
      return toFile(bytes, `logo.${raster.ext}`, { type: raster.mime });
    }

    // Content-Type missing/wrong — try sharp decode (covers PNG/JPEG/WebP).
    const png = await sharp(bytes)
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    return toFile(png, "logo.png", { type: "image/png" });
  } catch {
    return null;
  }
}
