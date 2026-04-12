import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MusicProvider } from "./contexts/MusicContext";
import { SoundProvider } from "./contexts/SoundContext";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { I18nProvider } from "./i18n";
import { initIAP } from "./lib/iap";
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LanguageSelectionModal from "./components/LanguageSelectionModal";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/404"} component={NotFound} />
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

function LanguageGate({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  return (
    <>
      {!settings.hasChosenLanguage && <LanguageSelectionModal />}
      {children}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SettingsProvider>
          <I18nProvider>
          <IAPInitializer />
          <LanguageGate>
          <MusicProvider>
            <SoundProvider>
              <TooltipProvider>
              <Toaster position="top-center" />
              <Router />
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
