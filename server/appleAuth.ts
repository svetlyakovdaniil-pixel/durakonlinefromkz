import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { importPKCS8, SignJWT } from "jose";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Apple Sign In configuration
const APPLE_TEAM_ID = "CMP7AQ6386";
const APPLE_KEY_ID = "SHTMB76CNK";
const APPLE_SERVICE_ID = "com.durakonlinefromkz.web"; // Service ID (used for web OAuth)
const APPLE_BUNDLE_ID = "com.durakonlinefromkz.app"; // Bundle ID (used for native ASAuthorizationController)
const APPLE_PRIVATE_KEY = `***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***`;

// Apple's public JWKS endpoint
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

/**
 * Generate a client_secret JWT for Apple Sign In
 * This is a short-lived JWT signed with our private key
 */
async function generateClientSecret(): Promise<string> {
  const privateKey = await importPKCS8(APPLE_PRIVATE_KEY, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_ID)
    .setIssuedAt(now)
    .setExpirationTime(now + 300) // 5 minutes
    .setAudience("https://appleid.apple.com")
    .setSubject(APPLE_SERVICE_ID)
    .sign(privateKey);
}

/**
 * Exchange authorization code for tokens from Apple
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ id_token: string; access_token: string }> {
  const clientSecret = await generateClientSecret();
  const params = new URLSearchParams({
    client_id: APPLE_SERVICE_ID,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apple token exchange failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Verify Apple ID token and extract user info
 * @param idToken - The identity token from Apple
 * @param audience - The audience to verify against (Service ID for web, Bundle ID for native)
 */
async function verifyAppleIdToken(idToken: string, audience: string = APPLE_SERVICE_ID): Promise<{
  sub: string;
  email: string | null;
  email_verified: boolean;
}> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience,
  });

  return {
    sub: payload.sub as string,
    email: (payload.email as string) || null,
    email_verified: payload.email_verified === true || payload.email_verified === "true",
  };
}

/**
 * Returns an HTML page that opens a deep link (durak://) in the native app.
 *
 * WHY HTML INSTEAD OF DIRECT REDIRECT:
 * SFSafariViewController (used by the Capacitor Browser plugin on iOS/iPadOS)
 * CANNOT open custom URL schemes (durak://) via a server-side 302 redirect.
 * When the server redirects to durak://, SFSafariViewController shows an error
 * page ("Safari cannot open the page") instead of returning to the app.
 *
 * The fix: return an HTML page that uses window.location to open the deep link.
 * iOS intercepts window.location changes to custom URL schemes and routes them
 * to the registered app, closing SFSafariViewController in the process.
 *
 * This is the standard approach used by Auth0, Firebase, and other OAuth providers
 * for native app callbacks.
 */
function buildDeepLinkHtml(deepLinkUrl: string, isError: boolean): string {
  const encodedUrl = deepLinkUrl.replace(/'/g, "\\'");
  const title = isError ? "Authentication Error" : "Signing you in...";
  const message = isError
    ? "Something went wrong. Please return to the app and try again."
    : "Please wait while we sign you in...";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a1628;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 24px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 15px; color: rgba(255,255,255,0.7); margin-bottom: 32px; }
    .btn {
      display: inline-block;
      background: #ffffff;
      color: #0a1628;
      font-size: 16px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 12px;
      text-decoration: none;
      cursor: pointer;
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
  <div id="fallback" class="hidden">
    <h1>Return to App</h1>
    <p>Tap the button below to continue in the Durak app.</p>
    <a class="btn" href="${encodedUrl}">Open Durak App</a>
  </div>
  <script>
    // Immediately try to open the deep link via window.location
    // iOS intercepts custom URL scheme changes and routes them to the registered app,
    // automatically closing SFSafariViewController.
    try {
      window.location.href = '${encodedUrl}';
    } catch(e) {}

    // Show fallback button after 2 seconds in case the automatic redirect didn't work
    // (e.g., app not installed, or browser blocked the redirect)
    setTimeout(function() {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('fallback').classList.remove('hidden');
    }, 2000);
  </script>
</body>
</html>`;
}

export function registerAppleAuthRoutes(app: Express) {
  /**
   * POST /api/auth/apple/native
   * Native Sign in with Apple endpoint.
   * Called by @capacitor-community/apple-sign-in plugin after ASAuthorizationController succeeds.
   * The plugin returns an identityToken (JWT) signed by Apple — we verify it server-side.
   * Unlike the web OAuth flow, there is no SFSafariViewController or deep link involved.
   * The audience for native tokens is the Bundle ID (com.durakonlinefromkz.app).
   */
  app.post("/api/auth/apple/native", async (req: Request, res: Response) => {
    try {
      const { identityToken, user: appleUserId, givenName, familyName, email: emailFromPlugin, referralCode } = req.body;

      if (!identityToken) {
        return res.status(400).json({ success: false, error: "No identity token provided" });
      }

      console.log("[AppleAuth/Native] Received native sign-in request");

      // Verify the identity token from the native plugin
      // Native tokens use Bundle ID as audience, not Service ID
      let appleUser: { sub: string; email: string | null; email_verified: boolean };
      try {
        appleUser = await verifyAppleIdToken(identityToken, APPLE_BUNDLE_ID);
        console.log("[AppleAuth/Native] Token verified, sub:", appleUser.sub?.substring(0, 8) + "...");
      } catch (err) {
        console.error("[AppleAuth/Native] Token verification failed:", err);
        return res.status(401).json({ success: false, error: "Invalid Apple identity token" });
      }

      const openId = `apple_${appleUser.sub}`;

      // Determine display name: plugin provides it on first sign-in only
      const firstName = givenName || "";
      const lastName = familyName || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(openId);
      if (existingUser) {
        await db.upsertUser({ openId, lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(openId, {
          name: existingUser.name || fullName || "Player",
          expiresInMs: ONE_YEAR_MS,
        });
        console.log("[AppleAuth/Native] Existing user signed in:", openId.substring(0, 16) + "...");
        return res.json({ success: true, token: sessionToken });
      }

      // New user — create account
      const email = appleUser.email || emailFromPlugin || null;
      const displayName = fullName || email?.split("@")[0] || "Player";
      const truncatedName = displayName.substring(0, 12);

      await db.upsertUser({
        openId,
        name: truncatedName,
        email,
        loginMethod: "apple",
        lastSignedIn: new Date(),
      });

      const newUser = await db.getUserByOpenId(openId);
      if (newUser) {
        const profile = await db.getOrCreateProfile(newUser.id, truncatedName);
        if (referralCode && profile) {
          await db.activateReferralCode(profile.id, referralCode.trim().toUpperCase()).catch(err => {
            console.warn("[AppleAuth/Native] Referral activation failed (non-fatal):", err);
          });
        }
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: truncatedName,
        expiresInMs: ONE_YEAR_MS,
      });

      console.log("[AppleAuth/Native] New user created and signed in:", openId.substring(0, 16) + "...");
      return res.json({ success: true, token: sessionToken });
    } catch (error) {
      console.error("[AppleAuth/Native] Error:", error);
      return res.status(500).json({ success: false, error: "Authentication failed" });
    }
  });

  /**
   * GET /api/auth/apple/init
   * Returns the Apple authorization URL for the frontend to redirect to
   */
  app.get("/api/auth/apple/init", (req: Request, res: Response) => {
    const origin = req.query.origin as string || "https://durakonlinefromkz.online";
    const referralCode = req.query.referralCode as string || "";
    const native = req.query.native === "true";
    const state = Buffer.from(JSON.stringify({ origin, referralCode, native })).toString("base64url");
    // For native apps, always use production domain as redirect_uri (must be registered with Apple)
    const webOrigin = "https://durakonlinefromkz.online";
    const redirectUri = `${webOrigin}/api/auth/apple/callback`;

    const params = new URLSearchParams({
      client_id: APPLE_SERVICE_ID,
      redirect_uri: redirectUri,
      response_type: "code id_token",
      scope: "name email",
      response_mode: "form_post",
      state,
    });

    const authUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    // For native apps: instead of a bare 302 redirect to Apple, return an HTML page.
    // A bare server-side redirect from an unknown domain to Apple's sign-in page is a
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
  <div class="sub">Продолжить вход через Apple</div>
  <a class="btn" href="${authUrl.replace(/"/g, '&quot;')}">Продолжить с Apple</a>
  <div class="note">Перенаправляем на страницу авторизации Apple…</div>
  <script>
    setTimeout(function() { window.location.href = ${JSON.stringify(authUrl)}; }, 1500);
  </script>
</body>
</html>`);
    } else {
      res.json({ url: authUrl });
    }
  });

  /**
   * POST /api/auth/apple/callback
   * Apple sends a form_post to this endpoint after user authenticates.
   *
   * IMPORTANT: For native apps, we return an HTML page that opens the deep link
   * via window.location instead of a server-side 302 redirect.
   * SFSafariViewController cannot follow 302 redirects to custom URL schemes (durak://).
   */
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    let isNative = false;
    try {
      const { code, id_token, state, user: userJson } = req.body;
      console.log("[AppleAuth] Callback received:", {
        hasCode: !!code,
        hasIdToken: !!id_token,
        hasState: !!state,
        hasUser: !!userJson,
      });

      if (!code && !id_token) {
        console.error("[AppleAuth] Missing both code and id_token in callback");
        res.redirect("/?error=apple_missing_token");
        return;
      }

      // Parse state to get origin, referral code and native flag
      let origin = "https://durakonlinefromkz.online";
      let referralCode = "";
      try {
        if (state) {
          const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
          origin = parsed.origin || origin;
          referralCode = parsed.referralCode || "";
          isNative = parsed.native === true;
        }
      } catch {
        // Use defaults
      }

      console.log("[AppleAuth] State parsed:", { origin, isNative, hasReferralCode: !!referralCode });

      // For native apps, always use production domain for redirect_uri
      const webOrigin = "https://durakonlinefromkz.online";

      // Parse user info from first-time sign in (Apple only sends this once)
      let appleUserName: string | null = null;
      try {
        if (userJson) {
          const parsedUser = typeof userJson === "string" ? JSON.parse(userJson) : userJson;
          const firstName = parsedUser?.name?.firstName || "";
          const lastName = parsedUser?.name?.lastName || "";
          appleUserName = [firstName, lastName].filter(Boolean).join(" ") || null;
        }
      } catch {
        // Ignore
      }

      // Verify the id_token directly (Apple sends it in form_post)
      let appleUser: { sub: string; email: string | null; email_verified: boolean };
      try {
        if (id_token) {
          appleUser = await verifyAppleIdToken(id_token);
          console.log("[AppleAuth] id_token verified successfully, sub:", appleUser.sub?.substring(0, 8) + "...");
        } else {
          // Exchange code for tokens
          const redirectUri = `${webOrigin}/api/auth/apple/callback`;
          console.log("[AppleAuth] Exchanging code for tokens with redirectUri:", redirectUri);
          const tokens = await exchangeCodeForTokens(code, redirectUri);
          appleUser = await verifyAppleIdToken(tokens.id_token);
          console.log("[AppleAuth] Code exchanged and token verified, sub:", appleUser.sub?.substring(0, 8) + "...");
        }
      } catch (err) {
        console.error("[AppleAuth] Token verification failed:", err);
        if (isNative) {
          return res.send(buildDeepLinkHtml(`durak://auth/error?reason=apple_invalid_token`, true));
        }
        res.redirect(`${origin}/?error=apple_invalid_token`);
        return;
      }

      const openId = `apple_${appleUser.sub}`;

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(openId);
      if (existingUser) {
        await db.upsertUser({ openId, lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(openId, {
          name: existingUser.name || appleUserName || "Player",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        if (isNative) {
          // Return HTML page that opens the deep link via window.location
          // This is required because SFSafariViewController cannot follow 302 redirects
          // to custom URL schemes (durak://) — it shows an error page instead.
          const deepLink = `durak://auth/success?token=${encodeURIComponent(sessionToken)}`;
          console.log("[AppleAuth] Returning HTML deep link page for native (existing user)");
          return res.send(buildDeepLinkHtml(deepLink, false));
        }
        res.redirect(`${origin}/`);
      } else {
        // New user
        const displayName = appleUserName || appleUser.email?.split("@")[0] || "Player";
        const truncatedName = displayName.substring(0, 12);

        await db.upsertUser({
          openId,
          name: truncatedName,
          email: appleUser.email,
          loginMethod: "apple",
          lastSignedIn: new Date(),
        });

        const newUser = await db.getUserByOpenId(openId);
        if (newUser) {
          const profile = await db.getOrCreateProfile(newUser.id, truncatedName);
          if (referralCode && profile) {
            await db.activateReferralCode(profile.id, referralCode.trim().toUpperCase()).catch(err => {
              console.warn("[AppleAuth] Referral activation failed (non-fatal):", err);
            });
          }
        }

        const sessionToken = await sdk.createSessionToken(openId, {
          name: truncatedName,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        if (isNative) {
          // Return HTML page that opens the deep link via window.location
          const deepLink = `durak://auth/success?token=${encodeURIComponent(sessionToken)}`;
          console.log("[AppleAuth] Returning HTML deep link page for native (new user)");
          return res.send(buildDeepLinkHtml(deepLink, false));
        }
        res.redirect(`${origin}/`);
      }
    } catch (error) {
      console.error("[AppleAuth] Login failed:", error);
      if (isNative) {
        return res.send(buildDeepLinkHtml(`durak://auth/error?reason=apple_server_error`, true));
      }
      res.redirect("/?error=apple_server_error");
    }
  });
}
