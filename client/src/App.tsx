import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MusicProvider } from "./contexts/MusicContext";
import { SoundProvider } from "./contexts/SoundContext";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { I18nProvider } from "./i18n";
import { initIAP } from "./lib/iap";
import { initAdMob } from "./lib/admob";
import { initPushNotifications, isNativePlatform } from "./lib/pushNotifications";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { NATIVE_TOKEN_KEY } from '@shared/const';
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactPage from "./pages/ContactPage";
import SeasonRulesPage from "./pages/SeasonRulesPage";
import DemoGame from "./pages/DemoGame";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LanguageSelectionModal from "./components/LanguageSelectionModal";
import MaintenancePage from "./pages/MaintenancePage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/demo-game"} component={DemoGame} />
      <Route path={"/profile"} component={ProfilePage} />
      <Route path={"/contact"}>{() => <ContactPage backPath="/" />}</Route>
      <Route path={"/season-rules"}>{() => <SeasonRulesPage backPath="/" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

/** Initialize RevenueCat IAP SDK once user is authenticated */
function IAPInitializer() {
  const meQuery = trpc.auth.me.useQuery();
  useEffect(() => {
    const userId = meQuery.data?.openId;
    void initIAP(userId);
  }, [meQuery.data?.openId]);
  return null;
}

/** Initialize AdMob SDK on app start (native platforms only) */
function AdMobInitializer() {
  useEffect(() => {
    void initAdMob();
  }, []);
  return null;
}

/** Initialize push notifications on native platforms */
function PushInitializer() {
  const meQuery = trpc.auth.me.useQuery();
  const registerToken = trpc.push.registerToken.useMutation();

  useEffect(() => {
    if (!isNativePlatform()) return;
    const userId = meQuery.data?.id;
    if (!userId) return; // Only register when authenticated

    void initPushNotifications(
      (token, platform) => {
        registerToken.mutate({ token, platform });
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meQuery.data?.id]);

  return null;
}

/**
 * Global deep link handler for OAuth callbacks.
 * Handles BOTH cold start and warm start scenarios:
 * - Cold start: app was killed, then launched via durak:// deep link
 * - Warm start: app was already running when deep link fired
 * Handles durak://auth/success?token=... and durak://auth/error?reason=...
 */
function DeepLinkHandler() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle COLD START: app was launched directly via deep link
    // This happens when iOS kills the app and then Sign in with Apple/Google
    // redirects to durak:// — the app starts fresh and appUrlOpen never fires.
    // getLaunchUrl() returns the URL that triggered the cold launch.
    //
    // IMPORTANT: We use a sessionStorage flag to ensure we only process the
    // cold-start URL ONCE per app session. Without this, every time the user
    // logs out and the app re-renders DeepLinkHandler, getLaunchUrl() returns
    // the same old OAuth URL and auto-logs them back in.
    const COLD_START_PROCESSED_KEY = '__durak_cold_start_processed';
    const alreadyProcessed = sessionStorage.getItem(COLD_START_PROCESSED_KEY);
    if (!alreadyProcessed) {
      CapApp.getLaunchUrl().then(async (result) => {
        if (result?.url && result.url.startsWith('durak://auth/')) {
          console.log('[DeepLink] Cold start URL:', result.url);
          // Mark as processed BEFORE handling to prevent race conditions
          sessionStorage.setItem(COLD_START_PROCESSED_KEY, '1');
          await handleDeepLink(result.url, utils, setLocation);
        } else {
          // No auth deep link — mark as processed anyway so we don't check again
          sessionStorage.setItem(COLD_START_PROCESSED_KEY, '1');
        }
      }).catch((err) => {
        console.error('[DeepLink] getLaunchUrl failed:', err);
        sessionStorage.setItem(COLD_START_PROCESSED_KEY, '1');
      });
    }

    // Handle WARM START: app was already running when deep link fired
    const listenerPromise = CapApp.addListener('appUrlOpen', async (event) => {
      if (event.url.startsWith('durak://auth/')) {
        console.log('[DeepLink] Warm start URL:', event.url);
        await handleDeepLink(event.url, utils, setLocation);
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove()).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

async function handleDeepLink(
  url: string,
  utils: ReturnType<typeof trpc.useUtils>,
  setLocation: (path: string) => void
): Promise<void> {
  // Close the in-app browser if it's open
  await Browser.close().catch(() => {});

  if (url.startsWith('durak://auth/success')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const token = params.get('token');
    if (token) {
      try {
        localStorage.setItem(NATIVE_TOKEN_KEY, token);
        // Invalidate all tRPC queries so auth.me re-fetches with the new token
        await utils.invalidate();
        // Use SPA navigation instead of window.location.href to avoid full WKWebView reload.
        // Full reload can hang on iPadOS 26 if there are in-flight requests.
        setLocation('/');
      } catch (err) {
        console.error('[DeepLink] Failed to save token:', err);
      }
    }
  } else if (url.startsWith('durak://auth/error')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const reason = params.get('reason') || 'unknown';
    console.error('[DeepLink] OAuth error:', reason);
    // Use SPA navigation instead of window.location.href
    setLocation('/login?error=' + encodeURIComponent(reason));
  }
}

/** Configure native mobile UI: StatusBar, SplashScreen, Keyboard */
function MobileInitializer() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // StatusBar: transparent overlay so our dark UI fills the notch area
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});

    // SplashScreen: hide after app is ready (auto-hide is also configured in capacitor.config.ts)
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

    // Keyboard: resize body instead of native resize to avoid layout jumps
    Keyboard.setResizeMode({ mode: 'body' as any }).catch(() => {});
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
  }, []);
  return null;
}

/** Syncs battery-saver CSS class on <body> with the user's setting */
function BatterySaverSync() {
  const { settings } = useSettings();
  useEffect(() => {
    if (settings.batterySaverEnabled) {
      document.body.classList.add('battery-saver');
    } else {
      document.body.classList.remove('battery-saver');
    }
  }, [settings.batterySaverEnabled]);
  return null;
}

function LanguageGate({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [location] = useLocation();
  // Don't show language selection modal on auth pages — it blocks the login/register UI
  const isAuthPage = location === '/login' || location === '/register';

  return (
    <>
      {!settings.hasChosenLanguage && !isAuthPage && <LanguageSelectionModal />}
      {children}
    </>
  );
}

/**
 * MaintenanceGate — intercepts all routes except /admin when maintenance is active.
 * Admins bypass maintenance mode and can still access /admin.
 */
function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const meQuery = trpc.auth.me.useQuery();
  const { data: maintenanceStatus } = trpc.maintenance.status.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const isAdmin = meQuery.data?.role === 'admin';
  const isAdminRoute = location.startsWith('/admin');

  if (maintenanceStatus?.enabled && !isAdmin && !isAdminRoute) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SettingsProvider>
          <I18nProvider>
          <IAPInitializer />
          <AdMobInitializer />
          <MobileInitializer />
          <DeepLinkHandler />
          <PushInitializer />
          <BatterySaverSync />
          <LanguageGate>
          <MusicProvider>
            <SoundProvider>
              <TooltipProvider>
              <Toaster position="top-center" />
              <MaintenanceGate>
                <Router />
              </MaintenanceGate>
              </TooltipProvider>
            </SoundProvider>
          </MusicProvider>
          </LanguageGate>
          </I18nProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
