/**
 * Haptics utility — wraps @capacitor/haptics for native iOS/Android
 * and falls back to navigator.vibrate on web browsers.
 *
 * Usage:
 *   import { hapticImpact, hapticSuccess, hapticWarning, hapticError } from '@/lib/haptics';
 *   hapticImpact('medium');
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/** Light / medium / heavy impact (e.g. card play) */
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const styleMap: Record<string, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } else if (navigator.vibrate) {
    const durationMap: Record<string, number> = { light: 30, medium: 60, heavy: 100 };
    navigator.vibrate(durationMap[style]);
  }
}

/** Success notification (e.g. round won, card defended) */
export async function hapticSuccess(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Success });
  } else if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50]);
  }
}

/** Warning notification (e.g. timer running low) */
export async function hapticWarning(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Warning });
  } else if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

/** Error notification (e.g. invalid move, game lost) */
export async function hapticError(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Error });
  } else if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
}

/**
 * Selection feedback — subtle tick for UI interactions (e.g. card selection)
 */
export async function hapticSelection(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } else if (navigator.vibrate) {
    navigator.vibrate(15);
  }
}
