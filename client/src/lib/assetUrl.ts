import { Capacitor } from '@capacitor/core';
import { NATIVE_API_BASE } from '@shared/const';

/**
 * Returns the correct URL for a static asset path.
 *
 * On native iOS/Android: prepends the production server URL so that
 * assets like /assets/static/... load from https://durakonlinefromkz.online
 * instead of capacitor://localhost (which has no files).
 *
 * On web: returns the path as-is (relative URL, served from same origin).
 */
export function getAssetUrl(path: string): string {
  // Already an absolute URL (e.g. from backend playlists) — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_API_BASE}${path}`;
  }
  return path;
}
