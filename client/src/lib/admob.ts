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

/**
 * Initialize AdMob SDK. Call once on app start (in App.tsx).
 * Safe to call on web — will no-op.
 */
export async function initAdMob(): Promise<void> {
  if (admobInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false, // Set to true during development
    });

    // Request consent (GDPR / CCPA compliance)
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

    admobInitialized = true;
    console.log('[AdMob] Initialized');
  } catch (err) {
    console.error('[AdMob] Failed to initialize:', err);
  }
}

export function isAdMobAvailable(): boolean {
  return Capacitor.isNativePlatform() && admobInitialized;
}

/**
 * Show a rewarded ad and wait for the reward.
 * Returns the reward item on success, or null if:
 *   - Not on native platform
 *   - Ad failed to load
 *   - User closed the ad before earning the reward
 */
export async function showRewardedAd(): Promise<AdMobRewardItem | null> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('[AdMob] Not on native platform — skipping rewarded ad');
    return null;
  }

  const adUnitId = import.meta.env.VITE_ADMOB_REWARDED_AD_UNIT_ID as string | undefined;
  if (!adUnitId) {
    console.warn('[AdMob] VITE_ADMOB_REWARDED_AD_UNIT_ID not configured');
    return null;
  }

  return new Promise((resolve) => {
    let rewardEarned: AdMobRewardItem | null = null;

    // Listen for reward event
    const rewardListenerP = AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward: AdMobRewardItem) => {
        rewardEarned = reward;
      }
    );

    const cleanup = async () => {
      (await rewardListenerP).remove();
      (await closedListenerP).remove();
      (await failedListenerP).remove();
    };

    // Listen for ad closed (after reward or dismissed)
    const closedListenerP = AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      () => {
        void cleanup();
        resolve(rewardEarned);
      }
    );

    // Listen for load failure
    const failedListenerP = AdMob.addListener(
      RewardAdPluginEvents.FailedToLoad,
      () => {
        console.error('[AdMob] Rewarded ad failed to load');
        void cleanup();
        resolve(null);
      }
    );

    // Prepare and show the ad
    AdMob.prepareRewardVideoAd({
      adId: adUnitId,
      isTesting: false,
    })
      .then(() => AdMob.showRewardVideoAd())
      .catch((err) => {
        console.error('[AdMob] Failed to prepare/show rewarded ad:', err);
        void cleanup();
        resolve(null);
      });
  });
}
