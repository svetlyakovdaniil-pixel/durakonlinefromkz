import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { NATIVE_TOKEN_KEY } from "@shared/const";

/**
 * Returns the origin to use for OAuth redirect URIs.
 *
 * When running as a native Capacitor app (iOS/Android), window.location.origin
 * returns "capacitor://localhost" which is NOT a valid OAuth redirect URI.
 * In that case, we use the production domain so the OAuth callback goes to
 * the real server, which then redirects to durak:// deep link.
 */
function getOAuthOrigin(): string {
  if (Capacitor.isNativePlatform()) {
    return "https://durakonlinefromkz.online";
  }
  return window.location.origin;
}

/**
 * Fetch with a manual timeout using Promise.race.
 * Does NOT use AbortController (can cause issues on some iOS versions).
 * Instead uses a timeout promise that rejects after the specified ms.
 */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const fetchPromise = fetch(url, options);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([fetchPromise, timeoutPromise]);
}

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState("");

  // Warm up the server as soon as Login page mounts.
  // This prevents cold-start delays when the user taps a login button.
  // Use a simple fetch without timeout — fire-and-forget.
  useEffect(() => {
    const apiBase = Capacitor.isNativePlatform() ? "https://durakonlinefromkz.online" : "";
    fetch(`${apiBase}/api/health`, { method: "GET" }).catch(() => {});
  }, []);

  // Listen for browserFinished to clear loading state when user cancels OAuth
  // (deep link success/error handling is done globally in App.tsx DeepLinkHandler)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // When user closes the browser (presses X or Back) without completing auth,
    // clear the loading state so the buttons are usable again
    const handleBrowserFinished = Browser.addListener("browserFinished", () => {
      setGoogleLoading(false);
      setAppleLoading(false);
    });

    return () => {
      handleBrowserFinished.then((listener) => listener.remove());
    };
  }, []);

  // Show error from OAuth deep link redirect (e.g., /login?error=google_cancelled)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      setError(t('auth.serverError'));
    }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError(t("auth.invalidEmail"));
      return;
    }
    if (!password || password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const apiBase = Capacitor.isNativePlatform() ? "https://durakonlinefromkz.online" : "";

      // Retry logic: on iOS 26 WKWebView, the first fetch() can fail due to
      // network initialization delays. Retry once after a short delay.
      let res: Response | null = null;
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          res = await fetchWithTimeout(
            `${apiBase}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim(), password }),
              credentials: "include",
            },
            20000
          );
          break; // Success, exit retry loop
        } catch (fetchErr) {
          lastError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
          console.warn(`[Login] Attempt ${attempt + 1} failed:`, lastError.message);
        }
      }

      if (!res) {
        // Both attempts failed
        console.error('[Login] All attempts failed:', lastError);
        setError(t("auth.serverError"));
        return;
      }

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        // JSON parse failed — treat as server error
        setError(t("auth.serverError"));
        return;
      }

      if (res.ok || res.status === 200) {
        // Success
        if (Capacitor.isNativePlatform() && data.token) {
          localStorage.setItem(NATIVE_TOKEN_KEY, data.token as string);
        }
        window.location.href = '/';
        return;
      }

      // Handle error responses
      if (res.status === 401 || data.error === "invalid_credentials") {
        setError(t("auth.invalidCredentials"));
      } else if (res.status === 400) {
        setError((data.message as string) || t("auth.invalidCredentials"));
      } else {
        setError(t("auth.serverError"));
      }
    } catch (err) {
      console.error('[Login] Email login error:', err);
      setError(t("auth.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    const origin = getOAuthOrigin();

    try {
      if (Capacitor.isNativePlatform()) {
        // On native: open SFSafariViewController (iOS) / Chrome Custom Tab (Android)
        // Pass native=true so server redirects to durak:// URL scheme after auth
        const authUrl = `${origin}/api/auth/google/init?origin=${encodeURIComponent(origin)}&native=true`;
        await Browser.open({ url: authUrl, presentationStyle: "popover" });
        // Loading state will be cleared when deep link callback fires or browser closes
      } else {
        // On web: use server-side redirect flow
        window.location.href = `${origin}/api/auth/google/init?origin=${encodeURIComponent(origin)}`;
      }
    } catch (err) {
      console.error('[GoogleAuth] Sign-in failed:', err);
      setError(t("auth.serverError"));
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setAppleLoading(true);

    const origin = getOAuthOrigin();

    try {
      if (Capacitor.isNativePlatform()) {
        // On native: build Apple auth URL directly and open in SFSafariViewController.
        // IMPORTANT: We do NOT make a fetch() call here to get the URL.
        // Any fetch() before Browser.open() can hang on iOS 26.5.2 and cause infinite loading.
        // Instead, we construct the URL directly and let the server handle the OAuth flow.
        const authUrl = `${origin}/api/auth/apple/init?origin=${encodeURIComponent(origin)}&native=true`;
        await Browser.open({ url: authUrl, presentationStyle: "popover" });
        // Loading state will be cleared when deep link callback fires or browser closes
      } else {
        // On web: get Apple auth URL and redirect
        const res = await fetchWithTimeout(
          `${origin}/api/auth/apple/init?origin=${encodeURIComponent(origin)}`,
          { credentials: "include" },
          15000
        );
        if (!res.ok) {
          setError(t("auth.appleError"));
          setAppleLoading(false);
          return;
        }
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("[AppleAuth] Sign-in failed:", err);
      setError(t("auth.appleError"));
      setAppleLoading(false);
    }
  };

  const isAnyLoading = loading || googleLoading || appleLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-amber-200/60 hover:text-amber-200 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("auth.back")}
        </button>

        {/* Card */}
        <div className="bg-[#1a2d45]/80 border border-amber-700/30 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {/* Title */}
          <h1 className="text-3xl font-bold text-amber-100 text-center mb-2">
            {t("auth.login")}
          </h1>
          <p className="text-amber-200/50 text-center text-sm mb-8">
            Дурак онлайн from KZ
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-amber-200/80 text-sm">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                  autoComplete="email"
                  disabled={isAnyLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-amber-200/80 text-sm">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                <Input
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                  autoComplete="current-password"
                  disabled={isAnyLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isAnyLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 h-11 text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("auth.loginButton")
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-amber-700/20" />
            <span className="text-amber-200/40 text-xs uppercase">{t("auth.orLoginWith")}</span>
            <div className="flex-1 h-px bg-amber-700/20" />
          </div>

          {/* Social login buttons */}
          <div className="space-y-3">
            {/* Google Sign-In button */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-700/10 hover:text-amber-100 h-11"
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {t("auth.google")}
            </Button>

            {/* Apple Sign In button */}
            <Button
              variant="outline"
              onClick={handleAppleSignIn}
              className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-700/10 hover:text-amber-100 h-11"
              disabled={isAnyLoading}
            >
              {appleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
              {t("auth.apple")}
            </Button>
          </div>

          {/* Register link */}
          <p className="text-center mt-6 text-sm text-amber-200/50">
            {t("auth.noAccount")}{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              {t("auth.register")}
            </button>
          </p>

          {/* Privacy policy link */}
          <p className="text-center mt-3 text-xs text-amber-200/30">
            <a href="/privacy" className="hover:text-amber-200/60 transition-colors">
              {t("auth.privacyPolicy")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
