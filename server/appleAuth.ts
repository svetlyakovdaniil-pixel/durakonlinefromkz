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
const APPLE_SERVICE_ID = "com.durakonlinefromkz.web";
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
 */
async function verifyAppleIdToken(idToken: string): Promise<{
  sub: string;
  email: string | null;
  email_verified: boolean;
}> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: APPLE_SERVICE_ID,
  });

  return {
    sub: payload.sub as string,
    email: (payload.email as string) || null,
    email_verified: payload.email_verified === true || payload.email_verified === "true",
  };
}

export function registerAppleAuthRoutes(app: Express) {
  /**
   * GET /api/auth/apple/init
   * Returns the Apple authorization URL for the frontend to redirect to
   */
  app.get("/api/auth/apple/init", (req: Request, res: Response) => {
    const origin = req.query.origin as string || "https://durakonlinefromkz.vip";
    const referralCode = req.query.referralCode as string || "";
    const state = Buffer.from(JSON.stringify({ origin, referralCode })).toString("base64url");
    const redirectUri = `${origin}/api/auth/apple/callback`;

    const params = new URLSearchParams({
      client_id: APPLE_SERVICE_ID,
      redirect_uri: redirectUri,
      response_type: "code id_token",
      scope: "name email",
      response_mode: "form_post",
      state,
    });

    const authUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  /**
   * POST /api/auth/apple/callback
   * Apple sends a form_post to this endpoint after user authenticates
   */
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    try {
      const { code, id_token, state, user: userJson } = req.body;

      if (!code && !id_token) {
        res.redirect("/?error=apple_missing_token");
        return;
      }

      // Parse state to get origin and referral code
      let origin = "https://durakonlinefromkz.vip";
      let referralCode = "";
      try {
        if (state) {
          const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
          origin = parsed.origin || origin;
          referralCode = parsed.referralCode || "";
        }
      } catch {
        // Use defaults
      }

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
        } else {
          // Exchange code for tokens
          const redirectUri = `${origin}/api/auth/apple/callback`;
          const tokens = await exchangeCodeForTokens(code, redirectUri);
          appleUser = await verifyAppleIdToken(tokens.id_token);
        }
      } catch (err) {
        console.error("[AppleAuth] Token verification failed:", err);
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
        res.redirect(`${origin}/`);
      }
    } catch (error) {
      console.error("[AppleAuth] Login failed:", error);
      res.redirect("/?error=apple_server_error");
    }
  });
}
