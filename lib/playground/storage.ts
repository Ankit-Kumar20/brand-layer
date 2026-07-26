const TAG = "brand-layer.containerTag";
const DOC = "brand-layer.lastDocumentId";

export function loadContainerTag(): string {
  if (typeof window === "undefined") return "user_alex";
  return localStorage.getItem(TAG) ?? "user_alex";
}

export function saveContainerTag(value: string) {
  localStorage.setItem(TAG, value);
}

export function loadLastDocumentId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DOC) ?? "";
}

export function saveLastDocumentId(value: string) {
  if (value) localStorage.setItem(DOC, value);
  else localStorage.removeItem(DOC);
}
