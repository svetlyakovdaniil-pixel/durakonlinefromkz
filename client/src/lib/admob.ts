/**
 * AdMob integration — rewarded ads for Shanyrak top-up.
 *
 * HOW TO ACTIVATE:
 * 1. Create an AdMob account at https://admob.google.com
 * 2. Add your app (iOS + Android) in AdMob dashboard
 * 3. Create a Rewarded Ad unit for each platform
 * 4. Set the following env vars (via webdev_request_secrets):
 *    - VITE_ADMOB_IOS_APP_ID          → ca-app-pub-XXXXXXXX~XXXXXXXX  (iOS App ID)
 *    - VITE_ADMOB_ANDROID_APP_ID      → ca-app-pub-XXXXXXXX~XXXXXXXX  (Android App ID)
 *    - VITE_ADMOB_REWARDED_AD_UNIT_ID → ca-app-pub-XXXXXXXX/XXXXXXXX  (Rewarded Ad Unit)
 *
 * For testing, use Google's test IDs:
 *   iOS App ID:      ca-app-pub-3940256099942544~1458002511
 *   Android App ID:  ca-app-pub-3940256099942544~3347511713
 *   Rewarded Unit (Android): ca-app-pub-3940256099942544/5224354917
 *   Rewarded Unit (iOS):     ca-app-pub-3940256099942544/1712485313
 *
 * IMPORTANT (iOS): Add NSUserTrackingUsageDescription to Info.plist
 * IMPORTANT (Android): Add AdMob APPLICATION_ID to AndroidManifest.xml
 */
import {
  AdMob,
  AdmobConsentStatus,
  AdmobConsentDebugGeography,
  RewardAdPluginEvents,
  type AdMobRewardItem,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

let admobInitialized = false;
let admobInitAttempted = false;
const admobListeners: Array<(available: boolean) => void> = [];

/** Subscribe to AdMob availability changes */
export function onAdMobAvailabilityChange(cb: (available: boolean) => void): () => void {
  admobListeners.push(cb);
  return () => {
    const idx = admobListeners.indexOf(cb);
    if (idx !== -1) admobListeners.splice(idx, 1);
  };
}

/**
 * Initialize AdMob SDK. Call once on app start (in App.tsx).
 * Safe to call on web — will no-op.
 */
export async function initAdMob(): Promise<void> {
  if (admobInitAttempted) return;
  admobInitAttempted = true;

  if (!Capacitor.isNativePlatform()) return;

  try {
    // Request ATT before AdMob starts so the permission appears on a fresh install.
    try {
      const trackingInfo = await AdMob.trackingAuthorizationStatus();
      if (trackingInfo.status === 'notDetermined') {
        console.log('[FIX:ATT] Requesting tracking authorization before AdMob initialization');
        await AdMob.requestTrackingAuthorization();
      }
    } catch (trackingErr) {
      // ATT is iOS-only; Android and older plugin runtimes must still initialize ads.
      console.warn('[FIX:ATT] Tracking authorization request was unavailable:', trackingErr);
    }

    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });

    // Request consent (GDPR / CCPA compliance) — best-effort, don't block on failure
    try {
      const consentInfo = await AdMob.requestConsentInfo({
        debugGeography: AdmobConsentDebugGeography.DISABLED,
        testDeviceIdentifiers: [],
      });

      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdmobConsentStatus.REQUIRED
      ) {
        await AdMob.showConsentForm();
      }
    } catch (consentErr) {
      // Consent errors are non-fatal — ads can still be shown without consent form
      console.warn('[AdMob] Consent request failed (non-fatal):', consentErr);
    }

    admobInitialized = true;
    console.log('[AdMob] Initialized successfully');
    admobListeners.forEach(cb => cb(true));
  } catch (err) {
    console.error('[AdMob] Failed to initialize:', err);
    // Even if initialization fails, mark as attempted so we don't retry infinitely.
    // The button will still be shown — the ad load will fail gracefully at show time.
    // Notify listeners that AdMob is available on native (button should be shown)
    // so user can try — if ad fails to load we show a toast.
    admobListeners.forEach(cb => cb(true));
  }
}

/**
 * Returns true if we're on a native platform (iOS/Android).
 * The ad button should be shown whenever we're on native,
 * regardless of whether AdMob SDK initialized successfully.
 */
export function isAdMobAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/** Reason why an ad failed — returned alongside null for better UX */
export type AdFailReason = 'no_fill' | 'load_error' | 'show_error' | 'timeout' | 'dismissed_early' | 'not_initialized' | 'no_unit_id' | null;

/**
 * Show a rewarded ad and wait for the reward.
 * Returns { reward, failReason } where:
 *   - reward is non-null on success
 *   - failReason explains why reward is null
 */
export async function showRewardedAd(): Promise<{ reward: AdMobRewardItem | null; failReason: AdFailReason }> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('[AdMob] Not on native platform — skipping rewarded ad');
    return { reward: null, failReason: 'not_initialized' };
  }

  const platform = Capacitor.getPlatform();
  // Use platform-specific rewarded ad unit ID if available, fallback to shared
  const iosUnitId = import.meta.env.VITE_ADMOB_IOS_REWARDED_AD_UNIT_ID as string | undefined;
  const sharedUnitId = import.meta.env.VITE_ADMOB_REWARDED_AD_UNIT_ID as string | undefined;
  const adUnitId = (platform === 'ios' && iosUnitId) ? iosUnitId : sharedUnitId;
  if (!adUnitId) {
    console.warn('[AdMob] No rewarded ad unit ID configured for platform:', platform);
    return { reward: null, failReason: 'no_unit_id' };
  }

  // If AdMob hasn't initialized yet, try to initialize now
  if (!admobInitialized && !admobInitAttempted) {
    await initAdMob();
  }

  return new Promise((resolve) => {
    let rewardEarned: AdMobRewardItem | null = null;
    let settled = false;
    let failReason: AdFailReason = null;

    // Safety timeout — if no event fires within 90s, resolve with timeout
    const timeoutId = setTimeout(() => {
      console.error('[AdMob] Rewarded ad timed out after 90s');
      void cleanup();
      safeResolve(null, 'timeout');
    }, 90_000);

    const safeResolve = (val: AdMobRewardItem | null, reason: AdFailReason = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve({ reward: val, failReason: reason });
    };

    // Listen for reward event
    const rewardListenerP = AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward: AdMobRewardItem) => {
        console.log('[AdMob] Reward earned:', reward);
        rewardEarned = reward;
      }
    );

    const cleanup = async () => {
      try {
        (await rewardListenerP).remove();
        (await closedListenerP).remove();
        (await failedListenerP).remove();
        (await failedToShowListenerP).remove();
      } catch {
        // ignore cleanup errors
      }
    };

    // Listen for ad closed (after reward or dismissed)
    const closedListenerP = AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      () => {
        console.log('[AdMob] Ad dismissed, rewardEarned:', rewardEarned);
        void cleanup();
        if (rewardEarned) {
          safeResolve(rewardEarned, null);
        } else {
          safeResolve(null, 'dismissed_early');
        }
      }
    );

    // Listen for load failure
    const failedListenerP = AdMob.addListener(
      RewardAdPluginEvents.FailedToLoad,
      (error) => {
        console.error('[AdMob] Rewarded ad failed to load:', JSON.stringify(error));
        void cleanup();
        // Error code 3 = no fill (no ads available)
        const errorCode = (error as { code?: number })?.code;
        safeResolve(null, errorCode === 3 ? 'no_fill' : 'load_error');
      }
    );

    // Listen for show failure
    const failedToShowListenerP = AdMob.addListener(
      RewardAdPluginEvents.FailedToShow,
      (error) => {
        console.error('[AdMob] Rewarded ad failed to show:', JSON.stringify(error));
        void cleanup();
        safeResolve(null, 'show_error');
      }
    );

    // Prepare and show the ad
    console.log('[AdMob] Preparing rewarded ad with unit ID:', adUnitId);
    AdMob.prepareRewardVideoAd({
      adId: adUnitId,
      isTesting: false,
    })
      .then(() => {
        console.log('[AdMob] Ad prepared, showing...');
        return AdMob.showRewardVideoAd();
      })
      .then((reward) => {
        console.log('[AdMob] showRewardVideoAd returned:', reward);
        // showRewardVideoAd() may return the reward directly in some versions
        if (reward && !rewardEarned) {
          rewardEarned = reward;
        }
      })
      .catch((err) => {
        console.error('[AdMob] Failed to prepare/show rewarded ad:', JSON.stringify(err));
        void cleanup();
        safeResolve(null, 'load_error');
      });
  });
}
