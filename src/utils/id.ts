/** UUID generator with fallback for iPad Safari on non-HTTPS (local network) origins. */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // crypto.randomUUID throws on insecure origins in some Safari versions
    }
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
