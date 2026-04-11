import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { getLoginUrl } from "@/const";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";

export default function Register() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: email.trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "email_exists") {
          setError(t("auth.emailExists"));
        } else if (data.error === "invalid_email") {
          setError(t("auth.invalidEmail"));
        } else if (data.error === "password_too_short") {
          setError(t("auth.passwordTooShort"));
        } else if (data.error === "invalid_name") {
          setError(t("auth.invalidName"));
        } else {
          setError(t("auth.serverError"));
        }
        return;
      }

      // Success — reload to pick up the session cookie
      window.location.href = "/";
    } catch {
      setError(t("auth.serverError"));
    } finally {
      setLoading(false);
    }
  };

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
            {t("auth.register")}
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
              <Label className="text-amber-200/80 text-sm">{t("auth.name")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                <Input
                  type="text"
                  placeholder={t("auth.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={12}
                  className="pl-10 bg-[#0f2035]/80 border-amber-700/30 text-amber-100 placeholder:text-amber-200/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

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
                  disabled={loading}
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
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 h-11 text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("auth.registerButton")
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-amber-700/20" />
            <span className="text-amber-200/40 text-xs uppercase">{t("auth.orLoginWith")}</span>
            <div className="flex-1 h-px bg-amber-700/20" />
          </div>

          {/* Manus OAuth button */}
          <Button
            variant="outline"
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-700/10 hover:text-amber-100 h-11"
            disabled={loading}
          >
            {t("auth.manus")}
          </Button>

          {/* Login link */}
          <p className="text-center mt-6 text-sm text-amber-200/50">
            {t("auth.hasAccount")}{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              {t("auth.login")}
            </button>
          </p>

          {/* Privacy policy link */}
          <p className="text-center mt-3 text-xs text-amber-200/30">
            <a href="/privacy" className="hover:text-amber-200/50 underline underline-offset-2 transition-colors">
              {t("privacy.link")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
