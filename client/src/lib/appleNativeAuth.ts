import { Capacitor } from '@capacitor/core';
import { AppleSignIn } from './appleSignIn';

interface NativeAppleAuthResult {
  token: string;
}

/** Runs the same native Apple credential flow from both auth screens. */
export async function authorizeWithAppleNative(origin: string): Promise<NativeAppleAuthResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Apple native sign-in is only available on native platforms');
  }

  const appleResponse = await AppleSignIn.authorize();
  const { identityToken, givenName, familyName, email, user } = appleResponse.response;

  if (!identityToken) {
    throw new Error('Apple Sign In returned no identity token');
  }

  const response = await fetch(`${origin}/api/auth/apple/native`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken, user, givenName, familyName, email }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.error || `Apple server authentication failed (${response.status})`);
  }

  return { token: data.token };
}
