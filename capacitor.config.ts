import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.durakonlinefromkz.app',
  appName: 'Durak online from KZ',
  webDir: 'dist/public',

  // NOTE: server.url is intentionally NOT set here.
  // When server.url is set, Capacitor loads the WebView from a remote URL, which:
  //   1. Causes a white status bar gap at the top (iOS status bar overlay breaks)
  //   2. Causes OAuth deep links (durak://auth/...) to open in Safari instead of returning to the app
  // Instead, we use getAssetUrl() in client code to prepend NATIVE_API_BASE for /assets/ paths on native.

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0a1628',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a1628',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    // NOTE: CapacitorHttp is intentionally DISABLED.
    // On iOS 26.5.2 (iPadOS 26.5.2), CapacitorHttp causes fetch() promises to hang
    // indefinitely — they never resolve or reject. This causes infinite loading spinners
    // on all login buttons. Standard WKWebView fetch works correctly with proper CORS headers.
    // CapacitorHttp: { enabled: false },
    // CapacitorCookies: { enabled: false },
  },

  ios: {
    // Minimum iOS version: 14.0 (required by Capacitor 6+)
    // Set in Xcode: General → Deployment Info → iOS 14.0
    contentInset: 'never',
    allowsLinkPreview: false,
    scrollEnabled: false,
    backgroundColor: '#0a1628',
  },

  android: {
    // Minimum Android SDK: 22 (required by Capacitor 6+)
    // Set in android/app/build.gradle: minSdkVersion 22
    backgroundColor: '#0a1628',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true during development
  },

  // packageClassList tells Capacitor which native plugin classes to auto-register.
  // AppleSignInPlugin is our custom Swift plugin (AppleSignInPlugin.swift).
  // Without this entry, registerPlugin('AppleSignIn') in JS returns a no-op stub.
  packageClassList: [
    'AdMobPlugin',
    'AppPlugin',
    'CAPBrowserPlugin',
    'HapticsPlugin',
    'KeyboardPlugin',
    'PushNotificationsPlugin',
    'SplashScreenPlugin',
    'StatusBarPlugin',
    'PurchasesPlugin',
    'AppleSignInPlugin',
  ],
};

export default config;
