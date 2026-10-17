import { getEnvVar } from "./jellyfin-api";

// Footer text on share images. SHARE_WATERMARK sets it, "none" hides it,
// and when it is unset the site's own address is shown.
export function getWatermark(): string {
  const value = getEnvVar("SHARE_WATERMARK")?.trim();
  if (!value) return window.location.host;
  return value.toLowerCase() === "none" ? "" : value;
}
