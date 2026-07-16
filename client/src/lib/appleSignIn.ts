import { registerPlugin } from '@capacitor/core';

export interface AppleSignInResponse {
  response: {
    identityToken: string;
    authorizationCode?: string;
    user: string;
    email?: string;
    givenName?: string;
    familyName?: string;
  };
}

export interface AppleSignInPlugin {
  authorize(): Promise<AppleSignInResponse>;
}

/**
 * Register the native AppleSignInPlugin (AppleSignInPlugin.swift) with Capacitor.
 * The jsName in the Swift plugin is "AppleSignIn", so we use that here.
 * On web, this will be a no-op stub (Apple Sign In is not supported on web via native).
 */
export const AppleSignIn = registerPlugin<AppleSignInPlugin>('AppleSignIn', {
  web: () => {
    // Web stub — not used, Apple Sign In only works natively
    return {
      authorize: () => Promise.reject(new Error('Apple Sign In is only available on native iOS')),
    };
  },
});
