/**
 * Global Animation Scheduler
 *
 * Instead of each Canvas component running its own requestAnimationFrame loop,
 * all components register a callback here. A single RAF loop drives all of them.
 *
 * Benefits:
 *  - 1 RAF interrupt per frame instead of N (one per mounted Canvas)
 *  - Browser can batch GPU compositing for all canvases in one pass
 *  - Automatic cleanup when components unmount
 *  - Throttle to 60fps cap regardless of display refresh rate (120Hz → still 60fps)
 *
 * Usage:
 *   const id = scheduleAnimation((timestamp) => { ... draw ... });
 *   // on unmount:
 *   cancelAnimation(id);
 */

type AnimationCallback = (timestamp: number) => void;

const callbacks = new Map<number, AnimationCallback>();
let nextId = 1;
let rafHandle: number | null = null;
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS; // ~16.67ms

function tick(timestamp: number) {
  // Throttle to TARGET_FPS
  const elapsed = timestamp - lastFrameTime;
  if (elapsed >= FRAME_INTERVAL - 0.5) {
    lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);
    // Call all registered callbacks
    callbacks.forEach((cb) => {
      try {
        cb(timestamp);
      } catch (e) {
        // Swallow errors so one bad callback doesn't kill the loop
        console.error('[AnimationScheduler] callback error:', e);
      }
    });
  }

  if (callbacks.size > 0) {
    rafHandle = requestAnimationFrame(tick);
  } else {
    rafHandle = null;
  }
}

function startLoop() {
  if (rafHandle === null) {
    lastFrameTime = 0;
    rafHandle = requestAnimationFrame(tick);
  }
}

/**
 * Register an animation callback. Returns an ID to use for cancellation.
 * The callback receives the RAF timestamp (milliseconds).
 */
export function scheduleAnimation(cb: AnimationCallback): number {
  const id = nextId++;
  callbacks.set(id, cb);
  startLoop();
  return id;
}

/**
 * Unregister an animation callback by ID.
 */
export function cancelAnimation(id: number): void {
  callbacks.delete(id);
  if (callbacks.size === 0 && rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
}
