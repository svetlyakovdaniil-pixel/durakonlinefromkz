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
import DemoGame from "./pages/DemoGame";
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
 * Must be at App level (not Login page) to handle warm start:
 * app already running when deep link fires (e.g., after SFSafariViewController closes).
 * Handles durak://auth/success?token=... and durak://auth/error?reason=...
 */
function DeepLinkHandler() {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle warm start: app was already running when deep link fired
    const listenerPromise = CapApp.addListener('appUrlOpen', async (event) => {
      if (event.url.startsWith('durak://auth/')) {
        await handleDeepLink(event.url, utils);
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove()).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

async function handleDeepLink(url: string, utils: ReturnType<typeof trpc.useUtils>): Promise<void> {
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
        // Navigate to home page
        window.location.href = '/';
      } catch (err) {
        console.error('[DeepLink] Failed to save token:', err);
      }
    }
  } else if (url.startsWith('durak://auth/error')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const reason = params.get('reason') || 'unknown';
    console.error('[DeepLink] OAuth error:', reason);
    // Navigate to login page to show error
    window.location.href = '/login?error=' + encodeURIComponent(reason);
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
