import { useState, useEffect } from "react";

export type Orientation = "portrait" | "landscape";

/**
 * Returns the current device orientation.
 * Uses window.matchMedia for reliable detection that works with
 * both browser resize and native device rotation.
 */
export function useOrientation(): Orientation {
  const getOrientation = (): Orientation => {
    if (typeof window === "undefined") return "portrait";
    return window.matchMedia("(orientation: landscape)").matches
      ? "landscape"
      : "portrait";
  };

  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)");
    const handler = () => setOrientation(getOrientation());
    mql.addEventListener("change", handler);
    // Also listen to resize as fallback for browsers that don't fire matchMedia change
    window.addEventListener("resize", handler);
    return () => {
      mql.removeEventListener("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return orientation;
}

/**
 * Returns true when the device is in landscape orientation.
 */
export function useIsLandscape(): boolean {
  return useOrientation() === "landscape";
}

/**
 * Returns true when the device is a tablet (iPad) — screen width >= 768px.
 * Used to apply tablet-specific layout adaptations.
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    const handler = () => setIsTablet(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isTablet;
}
