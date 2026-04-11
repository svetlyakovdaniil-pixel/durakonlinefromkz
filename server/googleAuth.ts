import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";

import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

/**
 * Verify a Firebase ID token using Google's public keys.
 * We use a lightweight approach: verify the token by calling
 * Google's tokeninfo endpoint, which avoids needing firebase-admin SDK
 * and its heavy dependencies on the server.
 */
async function verifyGoogleIdToken(idToken: string): Promise<{
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}> {
  // Use Google's OAuth2 tokeninfo endpoint to verify the token
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error("Invalid Google ID token");
  }

  const payload = await response.json();

  // Verify the audience matches our Firebase project
  if (payload.aud !== "825855589810-q3rtiofrl81c24kop4s3ar5bu35dp7u6.apps.googleusercontent.com") {
    throw new Error("Token audience mismatch");
  }

  return {
    uid: payload.sub,
    email: payload.email || null,
    name: payload.name || null,
    picture: payload.picture || null,
  };
}

export function registerGoogleAuthRoutes(app: Express) {
  /**
   * POST /api/auth/google
   * Body: { idToken }
   * 
   * Client sends Firebase ID token after Google Sign-In popup.
   * Server verifies the token, creates/updates user, sets session cookie.
   */
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;

      if (!idToken || typeof idToken !== "string") {
        res.status(400).json({ error: "missing_token", message: "ID token is required" });
        return;
      }

      // Verify the Google ID token
      let googleUser: { uid: string; email: string | null; name: string | null; picture: string | null };
      try {
        googleUser = await verifyGoogleIdToken(idToken);
      } catch (err) {
        console.error("[GoogleAuth] Token verification failed:", err);
        res.status(401).json({ error: "invalid_token", message: "Invalid Google token" });
        return;
      }

      // Use Google UID as the unique identifier
      const openId = `google_${googleUser.uid}`;

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(openId);

      if (existingUser) {
        // Update last signed in
        await db.upsertUser({
          openId,
          lastSignedIn: new Date(),
        });

        // Create session token and set cookie
        const sessionToken = await sdk.createSessionToken(openId, {
          name: existingUser.name || googleUser.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        res.status(200).json({ success: true, openId, isNew: false });
      } else {
        // Create new user
        const displayName = googleUser.name || googleUser.email?.split("@")[0] || "Player";
        // Truncate name to 12 chars to match our limits
        const truncatedName = displayName.substring(0, 12);

        await db.upsertUser({
          openId,
          name: truncatedName,
          email: googleUser.email,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });

        // Create session token and set cookie
        const sessionToken = await sdk.createSessionToken(openId, {
          name: truncatedName,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        res.status(201).json({ success: true, openId, isNew: true });
      }
    } catch (error) {
      console.error("[GoogleAuth] Login failed:", error);
      res.status(500).json({ error: "server_error", message: "Server error" });
    }
  });
}
