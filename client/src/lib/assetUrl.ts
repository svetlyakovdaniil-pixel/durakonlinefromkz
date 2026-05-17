import { Capacitor } from '@capacitor/core';
import { NATIVE_API_BASE } from '@shared/const';

/**
 * Asset paths that are bundled inside the iOS app (in client/public/).
 * These load from capacitor://localhost on native — no server request needed.
 */
const BUNDLED_PREFIXES = [
  '/assets/cards/',
  '/assets/avatars/',
];

/**
 * Returns the correct URL for a static asset path.
 *
 * On native iOS/Android:
 *   - Bundled assets (/assets/cards/, /assets/avatars/) → return as-is
 *     (served from capacitor://localhost, no network request)
 *   - Other assets (/assets/static/, /assets/emotions/) → prepend production
 *     server URL so they load from https://durakonlinefromkz.online
 *
 * On web: returns the path as-is (relative URL, served from same origin).
 */
export function getAssetUrl(path: string): string {
  // Already an absolute URL (e.g. from backend playlists) — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (Capacitor.isNativePlatform()) {
    // Check if this asset is bundled in the app
    const isBundled = BUNDLED_PREFIXES.some(prefix => path.startsWith(prefix));
    if (isBundled) {
      // Return as-is — Capacitor serves from the app bundle
      return path;
    }
    // Not bundled — load from production server
    return `${NATIVE_API_BASE}${path}`;
  }
  return path;
}
