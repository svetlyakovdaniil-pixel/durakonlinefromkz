import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const GOOGLE_CLIENT_ID = "825855589810-q3rtiofrl81c24kop4s3ar5bu35dp7u6.apps.googleusercontent.com";
// Native iOS client ID (GoogleSignIn SDK) — audience for native id_token verification
const GOOGLE_NATIVE_CLIENT_ID = "825855589810-imptgdssbi1h963uftlvo69ea80cr3ll.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

/**
 * Exchange authorization code for tokens using Google OAuth2
 */
async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  id_token: string;
}> {
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[GoogleAuth] Token exchange failed:", err);
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

/**
 * Get user info from Google using access token
 */
async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }

  const data = await response.json();
  return {
    sub: data.sub,
    email: data.email || null,
    name: data.name || null,
    picture: data.picture || null,
  };
}

export function registerGoogleAuthRoutes(app: Express) {
  /**
   * GET /api/auth/google/init
   * Redirects user to Google OAuth consent screen
   */
  app.get("/api/auth/google/init", (req: Request, res: Response) => {
    const origin = (req.query.origin as string) || "https://durakonlinefromkz.online";
    const referralCode = (req.query.referralCode as string) || "";
    const native = req.query.native === "true";

    // For native apps, always use production domain as redirect_uri (must be registered in Google Console)
    const webOrigin = "https://durakonlinefromkz.online";
    const redirectUri = `${webOrigin}/api/auth/google/callback`;

    const state = Buffer.from(JSON.stringify({ origin, referralCode, native })).toString("base64url");

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // For native apps: instead of a bare 302 redirect to Google, return an HTML page.
    // A bare server-side redirect from an unknown domain to Google's sign-in page is a
    // classic phishing pattern that Google Safe Browsing flags ("fraudulent website"
    // warning in Safari). Serving a visible branded page with an explicit button and a
    // delayed auto-redirect avoids that signal.
    if (native) {
      res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Durak Online — Вход</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a1628;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px; text-align: center;
    }
    .logo { font-size: 28px; font-weight: 700; color: #f0c040; margin-bottom: 8px; }
    .sub { font-size: 15px; color: rgba(255,255,255,0.7); margin-bottom: 32px; }
    .btn {
      display: inline-block; background: #ffffff; color: #0a1628;
      font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px;
      text-decoration: none; cursor: pointer; margin-bottom: 16px;
    }
    .note { font-size: 12px; color: rgba(255,255,255,0.4); }
  </style>
</head>
<body>
  <div class="logo">♠ Durak Online</div>
  <div class="sub">Продолжить вход через Google</div>
  <a class="btn" href="${authUrl.replace(/"/g, '&quot;')}">Продолжить с Google</a>
  <div class="note">Перенаправляем на страницу авторизации Google…</div>
  <script>
    setTimeout(function() { window.location.href = ${JSON.stringify(authUrl)}; }, 1500);
  </script>
</body>
</html>`);
      return;
    }

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  /**
   * GET /api/auth/google/callback
   * Handles the OAuth callback from Google
   */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;

    // Decode state
    let origin = "https://durakonlinefromkz.online";
    let referralCode = "";
    let isNative = false;
    try {
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        origin = decoded.origin || origin;
        referralCode = decoded.referralCode || "";
        isNative = decoded.native === true;
      }
    } catch {
      console.warn("[GoogleAuth] Failed to decode state");
    }

    // For native apps, always use production domain for redirect_uri (registered in Google Console)
    const webOrigin = "https://durakonlinefromkz.online";

    if (error) {
      console.error("[GoogleAuth] OAuth error:", error);
      if (isNative) {
        return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location="durak://auth/error?reason=google_cancelled";</script></body></html>`);
      }
      return res.redirect(`${origin}/login?error=google_cancelled`);
    }

    if (!code) {
      if (isNative) {
        return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location="durak://auth/error?reason=google_no_code";</script></body></html>`);
      }
      return res.redirect(`${origin}/login?error=google_no_code`);
    }

    try {
      const redirectUri = `${webOrigin}/api/auth/google/callback`;

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, redirectUri);

      // Get user info
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      const openId = `google_${googleUser.sub}`;

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(openId);
      let sessionToken: string;

      if (existingUser) {
        await db.upsertUser({ openId, lastSignedIn: new Date() });

        sessionToken = await sdk.createSessionToken(openId, {
          name: existingUser.name || googleUser.name || "Player",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      } else {
        const displayName = googleUser.name || googleUser.email?.split("@")[0] || "Player";
        const truncatedName = displayName.substring(0, 12);

        await db.upsertUser({
          openId,
          name: truncatedName,
          email: googleUser.email,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });

        const newUser = await db.getUserByOpenId(openId);
        if (newUser) {
          const profile = await db.getOrCreateProfile(newUser.id, truncatedName);
          if (referralCode && referralCode.trim().length > 0 && profile) {
            await db.activateReferralCode(profile.id, referralCode.trim().toUpperCase()).catch(err => {
              console.warn("[GoogleAuth] Referral activation failed (non-fatal):", err);
            });
          }
        }

        sessionToken = await sdk.createSessionToken(openId, {
          name: truncatedName,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      }

      // For native apps: use an HTML page that sets window.location to the custom URL scheme.
      // iOS SFSafariViewController blocks res.redirect() to custom schemes (durak://),
      // but a JavaScript window.location assignment works correctly.
      if (isNative) {
        const deepLinkUrl = `durak://auth/success?token=${encodeURIComponent(sessionToken)}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing in...</title></head>
<body>
<script>
  window.location = ${JSON.stringify(deepLinkUrl)};
</script>
<p>Redirecting back to app...</p>
</body>
</html>`);
      }

      // Web: redirect to home after successful login
      res.redirect(`${origin}/`);
    } catch (err) {
      console.error("[GoogleAuth] Callback failed:", err);
      if (isNative) {
        return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location="durak://auth/error?reason=google_server_error";</script></body></html>`);
      }
      res.redirect(`${origin}/login?error=google_server_error`);
    }
  });

  /**
   * POST /api/auth/google (legacy — kept for backward compatibility)
   * Body: { idToken }
   */
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    res.status(410).json({ error: "deprecated", message: "Use /api/auth/google/init redirect flow instead" });
  });

  /**
   * POST /api/auth/google/native
   * Native Google Sign-In via @capawesome/capacitor-google-sign-in (GIDSignIn SDK).
   * The plugin returns an id_token (JWT signed by Google) — we verify it server-side
   * with the native iOS client ID as audience, then create/find the user and issue a
   * session token. No SFSafariViewController, no durak:// deep link, no fraud warning.
   */
  app.post("/api/auth/google/native", async (req: Request, res: Response) => {
    try {
      const { idToken, referralCode } = req.body as { idToken?: string; referralCode?: string };

      if (!idToken || typeof idToken !== "string") {
        return res.status(400).json({ success: false, error: "No id_token provided" });
      }

      // Verify the ID token signed by Google. Audience must be the native iOS client ID.
      let payload: { sub?: string; email?: string | null; email_verified?: boolean; name?: string | null; picture?: string | null };
      try {
        const jwtVerify = (await import("jose")).jwtVerify;
        const createRemoteJWKSet = (await import("jose")).createRemoteJWKSet;
        const { payload: verified } = await jwtVerify(
          idToken,
          createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")),
          {
            issuer: ["https://accounts.google.com", "accounts.google.com"],
            audience: GOOGLE_NATIVE_CLIENT_ID,
          }
        );
        payload = verified as typeof payload;
      } catch (err) {
        console.error("[GoogleAuth/Native] Token verification failed:", err);
        return res.status(401).json({ success: false, error: "Invalid Google id_token" });
      }

      const sub = payload.sub;
      if (!sub) {
        return res.status(401).json({ success: false, error: "Missing sub claim" });
      }

      const openId = `google_${sub}`;
      const email = payload.email || null;
      const name = payload.name || email?.split("@")[0] || "Player";
      const truncatedName = name.substring(0, 12);

      const existingUser = await db.getUserByOpenId(openId);
      if (existingUser) {
        await db.upsertUser({ openId, lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(openId, {
          name: existingUser.name || truncatedName,
          expiresInMs: ONE_YEAR_MS,
        });
        console.log("[GoogleAuth/Native] Existing user signed in:", openId.substring(0, 16) + "...");
        return res.json({ success: true, token: sessionToken });
      }

      await db.upsertUser({
        openId,
        name: truncatedName,
        email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const newUser = await db.getUserByOpenId(openId);
      if (newUser) {
        const profile = await db.getOrCreateProfile(newUser.id, truncatedName);
        if (referralCode && profile) {
          await db.activateReferralCode(profile.id, referralCode.trim().toUpperCase()).catch(err => {
            console.warn("[GoogleAuth/Native] Referral activation failed (non-fatal):", err);
          });
        }
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: truncatedName,
        expiresInMs: ONE_YEAR_MS,
      });

      console.log("[GoogleAuth/Native] New user created and signed in:", openId.substring(0, 16) + "...");
      return res.json({ success: true, token: sessionToken });
    } catch (error) {
      console.error("[GoogleAuth/Native] Error:", error);
      return res.status(500).json({ success: false, error: "Authentication failed" });
    }
  });
}
