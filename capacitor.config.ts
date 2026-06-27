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
      launchShowDuration: 2000,
      launchAutoHide: false, // We hide it manually after app loads
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
};

export default config;
