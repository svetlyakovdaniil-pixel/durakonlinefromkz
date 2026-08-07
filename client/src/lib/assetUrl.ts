import { Capacitor } from '@capacitor/core';
import { NATIVE_API_BASE } from '@shared/const';

/**
 * Asset paths that are bundled inside the iOS app (in client/public/).
 * These load from capacitor://localhost on native — no server request needed.
 */
const BUNDLED_PREFIXES = [
  '/assets/cards/',
  '/assets/avatars/',
  '/assets/emotions/',
  '/assets/static/',
];

/** Audio files are never bundled — they stream from the server (music + sfx). */
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];

/**
 * Returns the correct URL for a static asset path.
 *
 * On native iOS/Android:
 *   - Bundled assets (/assets/cards/, /assets/avatars/, /assets/emotions/,
 *     /assets/static/ images) → return as-is (served from capacitor://localhost,
 *     no network request)
 *   - Audio files (.mp3/.wav) → always prepend production server URL, they are
 *     not bundled and must stream from https://durakonlinefromkz.online
 *   - Other assets → prepend production server URL
 *
 * On web: returns the path as-is (relative URL, served from same origin).
 */
export function getAssetUrl(path: string): string {
  // Already an absolute URL (e.g. from backend playlists) — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (Capacitor.isNativePlatform()) {
    // Audio always loads from the production server (never bundled)
    const lower = path.toLowerCase();
    const isAudio = AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext));
    if (isAudio) {
      return `${NATIVE_API_BASE}${path}`;
    }
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
