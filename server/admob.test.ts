/**
 * Tests for AdMob configuration.
 * Validates that AdMob env vars are set and follow the correct format.
 */
import { describe, it, expect } from 'vitest';

describe('AdMob configuration', () => {
  const IOS_APP_ID = process.env.VITE_ADMOB_IOS_APP_ID;
  const ANDROID_APP_ID = process.env.VITE_ADMOB_ANDROID_APP_ID;
  const REWARDED_UNIT_ID = process.env.VITE_ADMOB_REWARDED_AD_UNIT_ID;

  it('should have VITE_ADMOB_IOS_APP_ID configured', () => {
    expect(IOS_APP_ID).toBeTruthy();
    expect(IOS_APP_ID).toMatch(/^ca-app-pub-\d+~\d+$/);
  });

  it('should have VITE_ADMOB_ANDROID_APP_ID configured', () => {
    expect(ANDROID_APP_ID).toBeTruthy();
    expect(ANDROID_APP_ID).toMatch(/^ca-app-pub-\d+~\d+$/);
  });

  it('should have VITE_ADMOB_REWARDED_AD_UNIT_ID configured', () => {
    expect(REWARDED_UNIT_ID).toBeTruthy();
    expect(REWARDED_UNIT_ID).toMatch(/^ca-app-pub-\d+\/\d+$/);
  });
});
