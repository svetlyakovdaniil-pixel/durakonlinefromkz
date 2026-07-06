import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { Loader2, Mail, Lock, User, ArrowLeft, Gift, ShieldCheck } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { NATIVE_TOKEN_KEY } from "@shared/const";

/**
 * Fetch with a manual timeout using Promise.race.
 * Does NOT use AbortController (can cause issues on some iOS versions).
 */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const fetchPromise = fetch(url, options);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Returns the origin to use for OAuth redirect URIs.
 * When running as a native Capacitor app (iOS/Android), window.location.origin
 * returns "capacitor://localhost" which is NOT a valid OAuth redirect URI.
 * In that case, we use the production domain instead.
 */
function getOAuthOrigin(): string {
  if (Capacitor.isNativePlatform()) {
    return "https://durakonlinefromkz.online";
  }
  return window.location.origin;
}

type Step = "form" | "verify";

export default function Register() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<Step>("form");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 12) {
      setError(t("auth.invalidName"));
      return;
    }
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
      const res = await fetchWithTimeout(`${apiBase}/api/auth/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: email.trim(),
          password,
          referralCode: referralCode.trim().toUpperCase() || undefined,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "email_exists") setError(t("auth.emailExists"));
        else if (data.error === "invalid_email") setError(t("auth.invalidEmail"));
        else if (data.error === "password_too_short") setError(t("auth.passwordTooShort"));
        else if (data.error === "invalid_name") setError(t("auth.invalidName"));
        else if (data.error === "email_send_failed") setError(t("auth.emailSendFailed"));
        else setError(t("auth.serverError"));
        return;
      }
      setStep("verify");
      setResendCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError(t("auth.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    setVerifyError("");
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === 5) {
      const fullCode = [...newDigits.slice(0, 5), digit].join("");
      if (fullCode.length === 6) submitCode(fullCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCodeDigits(pasted.split(""));
      setVerifyError("");
      submitCode(pasted);
    }
  };

  const submitCode = async (code: string) => {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      const apiBase = Capacitor.isNativePlatform() ? "https://durakonlinefromkz.online" : "";
      const res = await fetchWithTimeout(`${apiBase}/api/auth/register/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "code_expired") setVerifyError(t("auth.codeExpired"));
        else if (data.error === "too_many_attempts") setVerifyError(t("auth.tooManyAttempts"));
        else if (data.error === "invalid_code") setVerifyError(data.message || t("auth.codeInvalid"));
        else setVerifyError(t("auth.serverError"));
        setCodeDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }
      // On native iOS/Android: save token to localStorage so tRPC can send it via Authorization header
      if (Capacitor.isNativePlatform() && data.token) {
        localStorage.setItem(NATIVE_TOKEN_KEY, data.token);
      }
      // Navigate to home — on native the tRPC client will pick up the token
      // from localStorage on next request (no full reload needed)
      window.location.href = '/';
    } catch {
      setVerifyError(t("auth.serverError"));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length !== 6) return;
    submitCode(code);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setVerifyError("");
    try {
      const apiBase = Capacitor.isNativePlatform() ? "https://durakonlinefromkz.online" : "";
      const res = await fetchWithTimeout(`${apiBase}/api/auth/register/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "rate_limited") setVerifyError(data.message);
        else setVerifyError(t("auth.emailSendFailed"));
        return;
      }
      setCodeDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setVerifyError(t("auth.emailSendFailed"));
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const origin = getOAuthOrigin();
    const ref = referralCode.trim().toUpperCase();
    const params = new URLSearchParams({ origin });
    if (ref) params.set("referralCode", ref);
    try {
      if (Capacitor.isNativePlatform()) {
        const authUrl = `${origin}/api/auth/google/init?${params.toString()}&native=true`;
        await Browser.open({ url: authUrl, presentationStyle: "popover" });
      } else {
        window.location.href = `${origin}/api/auth/google/init?${params.toString()}`;
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
    const params = new URLSearchParams({ origin });
    if (referralCode.trim()) params.set("referralCode", referralCode.trim().toUpperCase());
    try {
      if (Capacitor.isNativePlatform()) {
        // On native: build URL directly and open in SFSafariViewController.
        // Do NOT use fetch() before Browser.open() — it can hang on iOS 26.5.2.
        const authUrl = `${origin}/api/auth/apple/init?${params.toString()}&native=true`;
        await Browser.open({ url: authUrl, presentationStyle: "popover" });
      } else {
        const res = await fetchWithTimeout(`${origin}/api/auth/apple/init?${params.toString()}`, { credentials: "include" }, 15000);
        if (!res.ok) { setError(t("auth.appleError")); setAppleLoading(false); return; }
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {
      setError(t("auth.appleError"));
      setAppleLoading(false);
    }
  };

  const isAnyLoading = loading || googleLoading || appleLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => step === "verify" ? setStep("form") : setLocation("/")}
          className="flex items-center gap-1 text-amber-200/60 hover:text-amber-200 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("auth.back")}
        </button>

        <div className="bg-[#1a2d45]/80 border border-amber-700/30 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

          {step === "form" && (
            <>
              <h1 className="text-3xl font-bold text-amber-100 text-center mb-2">{t("auth.register")}</h1>
              <p className="text-amber-200/50 text-center text-sm mb-8">Дурак онлайн from KZ</p>
              {error && (
                <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm text-center">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-amber-200/80 text-sm">{t("auth.name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                    <Input type="text" placeholder={t("auth.namePlaceholder")} value={name}
                      onChange={(e) => setName(e.target.value)} maxLength={12}
                      className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                      autoComplete="username" disabled={isAnyLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-200/80 text-sm">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                    <Input type="email" placeholder={t("auth.emailPlaceholder")} value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                      autoComplete="email" disabled={isAnyLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-200/80 text-sm">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                    <Input type="password" placeholder={t("auth.passwordPlaceholder")} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                      autoComplete="new-password" disabled={isAnyLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-200/80 text-sm flex items-center gap-2">
                    {t("auth.referralCode")}
                    <span className="text-amber-200/40 text-xs font-normal">({t("auth.optional")})</span>
                  </Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                    <Input type="text" placeholder={t("auth.referralCodePlaceholder")} value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())} maxLength={8}
                      className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20 tracking-widest font-mono uppercase"
                      disabled={isAnyLoading} />
                  </div>
                  <p className="text-amber-200/40 text-xs">{t("auth.referralCodeHint")}</p>
                </div>
                <Button type="submit" disabled={isAnyLoading}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 h-11 text-base">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.registerButton")}
                </Button>
              </form>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-amber-700/20" />
                <span className="text-amber-200/40 text-xs uppercase">{t("auth.orLoginWith")}</span>
                <div className="flex-1 h-px bg-amber-700/20" />
              </div>
              <div className="space-y-3">
                <Button variant="outline" onClick={handleGoogleSignIn}
                  className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-700/10 hover:text-amber-100 h-11" disabled={isAnyLoading}>
                  {googleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {t("auth.google")}
                </Button>
                <Button variant="outline" onClick={handleAppleSignIn}
                  className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-700/10 hover:text-amber-100 h-11" disabled={isAnyLoading}>
                  {appleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  )}
                  {t("auth.apple")}
                </Button>
              </div>
              <p className="text-center mt-6 text-sm text-amber-200/50">
                {t("auth.hasAccount")}{" "}
                <button onClick={() => setLocation("/login")} className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
                  {t("auth.login")}
                </button>
              </p>
              <p className="text-center mt-3 text-xs text-amber-200/30">
                <a href="/privacy" className="hover:text-amber-200/50 underline underline-offset-2 transition-colors">
                  {t("privacy.link")}
                </a>
              </p>
            </>
          )}

          {step === "verify" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-amber-100 text-center mb-2">{t("auth.verifyEmail")}</h1>
              <p className="text-amber-200/50 text-center text-sm mb-1">{t("auth.verifyEmailDesc")}</p>
              <p className="text-amber-400 text-center text-sm font-medium mb-8 break-all">{email.trim()}</p>
              {verifyError && (
                <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm text-center">
                  {verifyError}
                </div>
              )}
              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-amber-200/80 text-sm text-center block">{t("auth.verifyCode")}</Label>
                  <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                    {codeDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeInput(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        disabled={verifyLoading}
                        className="w-12 h-14 text-center text-2xl font-bold font-mono bg-[#0f2035]/80 border border-amber-700/30 rounded-lg text-amber-100 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all disabled:opacity-50 caret-transparent"
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit"
                  disabled={verifyLoading || codeDigits.join("").length !== 6}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 h-11 text-base">
                  {verifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.verifyButton")}
                </Button>
              </form>
              <div className="mt-6 text-center">
                {resendCooldown > 0 ? (
                  <p className="text-amber-200/40 text-sm">
                    {t("auth.resendCodeIn")} <span className="text-amber-400 font-mono">{resendCooldown}с</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t("auth.resendCode")}
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
