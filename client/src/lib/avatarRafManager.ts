/**
 * Shared RAF (requestAnimationFrame) manager for all Canvas avatars.
 *
 * Problem: When many Canvas avatars are visible simultaneously (e.g. leaderboard,
 * lobby player list), each one runs its own rAF loop. This multiplies CPU/GPU
 * load and causes FPS degradation.
 *
 * Solution: A single shared rAF loop that calls all registered draw callbacks
 * once per frame. Avatars register/unregister themselves on mount/unmount.
 */

type DrawCallback = (timestamp: number) => void;

const callbacks = new Map<symbol, DrawCallback>();
let rafId: number | null = null;

function tick(timestamp: number) {
  for (const cb of callbacks.values()) {
    try {
      cb(timestamp);
    } catch (_e) {
      // Silently ignore errors from individual avatars
    }
  }
  if (callbacks.size > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null;
  }
}

/**
 * Register a draw callback. Returns a cleanup function that unregisters it.
 * Call this inside useEffect; return the cleanup function.
 *
 * @example
 * useEffect(() => {
 *   return registerAvatarDraw((ts) => { draw(ts); });
 * }, []);
 */
export function registerAvatarDraw(cb: DrawCallback): () => void {
  const id = Symbol();
  callbacks.set(id, cb);

  // Start the shared loop if not already running
  if (rafId === null) {
    rafId = requestAnimationFrame(tick);
  }

  return () => {
    callbacks.delete(id);
    // Loop will stop itself when callbacks is empty
  };
}
