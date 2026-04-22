import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const GOOGLE_CLIENT_ID = "825855589810-q3rtiofrl81c24kop4s3ar5bu35dp7u6.apps.googleusercontent.com";
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
    const redirectUri = `${origin}/api/auth/google/callback`;

    const state = Buffer.from(JSON.stringify({ origin, referralCode })).toString("base64url");

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });

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
    try {
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        origin = decoded.origin || origin;
        referralCode = decoded.referralCode || "";
      }
    } catch {
      console.warn("[GoogleAuth] Failed to decode state");
    }

    if (error) {
      console.error("[GoogleAuth] OAuth error:", error);
      return res.redirect(`${origin}/login?error=google_cancelled`);
    }

    if (!code) {
      return res.redirect(`${origin}/login?error=google_no_code`);
    }

    try {
      const redirectUri = `${origin}/api/auth/google/callback`;

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, redirectUri);

      // Get user info
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      const openId = `google_${googleUser.sub}`;

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(openId);

      if (existingUser) {
        await db.upsertUser({ openId, lastSignedIn: new Date() });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: existingUser.name || googleUser.name || "",
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

        const sessionToken = await sdk.createSessionToken(openId, {
          name: truncatedName,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      }

      // Redirect to home after successful login
      res.redirect(`${origin}/`);
    } catch (err) {
      console.error("[GoogleAuth] Callback failed:", err);
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
}
