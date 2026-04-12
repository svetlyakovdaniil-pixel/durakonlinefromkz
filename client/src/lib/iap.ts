/**
 * In-App Purchase service using RevenueCat Purchases SDK for Capacitor.
 *
 * HOW TO ACTIVATE:
 * 1. Create a RevenueCat account at https://app.revenuecat.com
 * 2. Add your app (iOS + Android) in RevenueCat dashboard
 * 3. Create products in App Store Connect and Google Play Console:
 *    - Product IDs: durak_tenge_100, durak_tenge_500, durak_tenge_1000, durak_tenge_5000
 *    - Type: Consumable (Non-Subscription)
 * 4. Add those product IDs to RevenueCat as Entitlements or just use them directly
 * 5. Set VITE_REVENUECAT_IOS_KEY and VITE_REVENUECAT_ANDROID_KEY in your .env
 *
 * PRODUCT IDs (must match App Store Connect / Google Play Console):
 *   durak_tenge_100   → 100 тенге  (~$0.99)
 *   durak_tenge_500   → 500 тенге  (~$4.99)
 *   durak_tenge_1000  → 1000 тенге (~$9.99)
 *   durak_tenge_5000  → 5000 тенге (~$49.99)
 */

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export const TENGE_PRODUCT_IDS = [
  'durak_tenge_100',
  'durak_tenge_500',
  'durak_tenge_1000',
  'durak_tenge_5000',
] as const;

export type TengeProductId = typeof TENGE_PRODUCT_IDS[number];

export interface IAPProduct {
  productId: TengeProductId;
  title: string;
  description: string;
  priceString: string;
  price: number;
  currencyCode: string;
}

let initialized = false;

/**
 * Initialize RevenueCat SDK.
 * Call this once on app start (e.g., in main.tsx or App.tsx).
 */
export async function initIAP(userId?: string): Promise<void> {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return; // Only runs on iOS/Android

  const platform = Capacitor.getPlatform();
  const iosKey = import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined;
  const androidKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined;

  const apiKey = platform === 'ios' ? iosKey : androidKey;
  if (!apiKey) {
    console.warn('[IAP] RevenueCat API key not configured for platform:', platform);
    return;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey });
    if (userId) {
      await Purchases.logIn({ appUserID: userId });
    }
    initialized = true;
    console.log('[IAP] RevenueCat initialized for platform:', platform);
  } catch (err) {
    console.error('[IAP] Failed to initialize RevenueCat:', err);
  }
}

/**
 * Identify the current user to RevenueCat.
 * Call this after login.
 */
export async function identifyUser(userId: string): Promise<void> {
  if (!initialized || !Capacitor.isNativePlatform()) return;
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.error('[IAP] Failed to identify user:', err);
  }
}

/**
 * Fetch available tenge products from the store.
 * Returns an empty array if not on native platform or SDK not initialized.
 */
export async function fetchTengeProducts(): Promise<IAPProduct[]> {
  if (!initialized || !Capacitor.isNativePlatform()) return [];

  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [...TENGE_PRODUCT_IDS],
    });

    return products.map((p) => ({
      productId: p.identifier as TengeProductId,
      title: p.title,
      description: p.description,
      priceString: p.priceString,
      price: p.price,
      currencyCode: p.currencyCode,
    }));
  } catch (err) {
    console.error('[IAP] Failed to fetch products:', err);
    return [];
  }
}

/**
 * Purchase a tenge package.
 * Returns the transaction ID on success, or null on failure/cancellation.
 */
export async function purchaseTenge(productId: TengeProductId): Promise<string | null> {
  if (!initialized || !Capacitor.isNativePlatform()) return null;

  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [productId],
    });

    if (products.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const { transaction } = await Purchases.purchaseStoreProduct({
      product: products[0],
    });

    return transaction?.transactionIdentifier ?? null;
  } catch (err: unknown) {
    // User cancelled — not an error
    if (
      err &&
      typeof err === 'object' &&
      'userCancelled' in err &&
      (err as { userCancelled: boolean }).userCancelled
    ) {
      return null;
    }
    console.error('[IAP] Purchase failed:', err);
    throw err;
  }
}

/**
 * Restore previous purchases (required by App Store guidelines).
 */
export async function restorePurchases(): Promise<void> {
  if (!initialized || !Capacitor.isNativePlatform()) return;
  try {
    await Purchases.restorePurchases();
  } catch (err) {
    console.error('[IAP] Restore failed:', err);
  }
}

export function isIAPAvailable(): boolean {
  return Capacitor.isNativePlatform() && initialized;
}
