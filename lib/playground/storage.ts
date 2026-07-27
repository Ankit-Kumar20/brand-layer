const TAG = "brand-layer.containerTag";
const BRAND = "brand-layer.brandId";
const DOC = "brand-layer.lastDocumentId";

export function loadContainerTag(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TAG) ?? "";
}

export function saveContainerTag(value: string) {
  if (value) localStorage.setItem(TAG, value);
  else localStorage.removeItem(TAG);
}

export function loadBrandId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BRAND) ?? "";
}

export function saveBrandId(value: string) {
  if (value) localStorage.setItem(BRAND, value);
  else localStorage.removeItem(BRAND);
}

export function loadLastDocumentId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DOC) ?? "";
}

export function saveLastDocumentId(value: string) {
  if (value) localStorage.setItem(DOC, value);
  else localStorage.removeItem(DOC);
}
