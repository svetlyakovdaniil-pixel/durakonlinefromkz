import "dotenv/config";
import express from "express";
import { Buffer } from "buffer";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { registerEmailAuthRoutes } from "../emailAuth";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { registerAppleAuthRoutes } from "../appleAuth";
import { registerIAPRoutes } from "../iap";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initSocketServer } from "../socketServer";
import { initGhostPlayers } from "../ghostPlayers";
import { seedDefaultPlaylist, seedChinesePlaylist, seedLoFiChillhopPlaylist, seedDarkTrapPlaylist, cleanupOldPlaylists, fixChinesePlaylistUrls, fixAllPlaylistCloudFrontUrls, getDb } from "../db";
import cron from "node-cron";
import { sendDailyQuestPushToAll, sendSeasonEndingPushToAll, sendShanyrakRefillPushToEligible } from "../pushNotifications";
import { sdk as nativeSdk } from "./sdk";
import { COOKIE_NAME as NATIVE_COOKIE_NAME, ONE_YEAR_MS as NATIVE_ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Restore static assets from persistent storage after each deploy
function copyDirRecursive(src: string, dest: string): number {
  let copied = 0;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copied += copyDirRecursive(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      copied++;
    }
  }
  return copied;
}

function restoreStaticAssets() {
  const persistentDir = "/root/static_assets";
  if (!fs.existsSync(persistentDir)) return;

  let totalCopied = 0;

  // Copy top-level files to dist/public/assets/static/
  const staticDir = path.join(process.cwd(), "dist", "public", "assets", "static");
  fs.mkdirSync(staticDir, { recursive: true });
  const entries = fs.readdirSync(persistentDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(persistentDir, entry.name);
    if (entry.isDirectory()) {
      // Subdirectories (e.g. cards/) are served at /assets/{name}/ not /assets/static/{name}/
      const destSubDir = path.join(process.cwd(), "dist", "public", "assets", entry.name);
      totalCopied += copyDirRecursive(srcPath, destSubDir);
    } else {
      const destPath = path.join(staticDir, entry.name);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        totalCopied++;
      }
    }
  }

  if (totalCopied > 0) {
    console.log(`[Static] Restored ${totalCopied} assets from ${persistentDir}`);
  }
}

async function startServer() {
  // Restore static assets if missing (happens after each deploy)
  if (process.env.NODE_ENV === "production") {
    restoreStaticAssets();
  }
  const app = express();
  const server = createServer(app);
  const isProduction = process.env.NODE_ENV === "production";

  // Keep browser hardening in one place. CSP is intentionally disabled here because
  // the mobile/Vite client still relies on its existing asset and inline-script setup.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: isProduction,
    })
  );

  // Keep request bodies bounded to reduce memory-exhaustion risk.
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "100kb", extended: true }));

  // ── Rate limiting (brute-force / spam protection) ──
  // Auth endpoints: tight limits (password brute force, OTP spam)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,                  // max 100 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limited", message: "Слишком много запросов. Попробуйте позже." },
  });
  // IAP verification: tight limits (economy protection)
  const iapLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limited", message: "Слишком много запросов. Попробуйте позже." },
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limited", message: "Слишком много запросов. Попробуйте позже." },
  });

  // Apply limiters
  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter);
  app.use("/api/iap", iapLimiter);

  // Email/password auth routes
  registerEmailAuthRoutes(app);
  // Google Sign-In routes
  registerGoogleAuthRoutes(app);
  // Apple Sign In routes
  registerAppleAuthRoutes(app);
  // IAP verification endpoint
  registerIAPRoutes(app);

  // Native app session endpoint: receives JWT token from deep link and sets session cookie
  // This is called by the Capacitor app after OAuth completes via SFSafariViewController
  app.post("/api/auth/native/session", async (req, res) => {
    try {
      const { token } = req.body as { token?: string };
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "missing_token" });
      }
      // Verify the token is valid before setting the cookie
      const session = await nativeSdk.verifySession(token);
      if (!session) {
        return res.status(401).json({ error: "invalid_token" });
      }
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(NATIVE_COOKIE_NAME, token, { ...cookieOptions, maxAge: NATIVE_ONE_YEAR_MS });
      return res.json({ ok: true });
    } catch (err) {
      console.error("[NativeSession] Failed to set session:", err);
      return res.status(401).json({ error: "invalid_token" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Initialize Socket.IO for real-time multiplayer
  initSocketServer(server);

  // Seed music playlists
  cleanupOldPlaylists().catch(e => console.warn('[Music] Failed to cleanup old playlists:', e));
  seedDefaultPlaylist().catch(e => console.warn('[Music] Failed to seed default playlist:', e));
  seedChinesePlaylist().catch(e => console.warn('[Music] Failed to seed Chinese playlist:', e));
  seedLoFiChillhopPlaylist().catch((e: unknown) => console.warn('[Music] Failed to seed Lo-Fi Chillhop playlist:', e));
  seedDarkTrapPlaylist().catch((e: unknown) => console.warn('[Music] Failed to seed Dark Trap playlist:', e));
  fixChinesePlaylistUrls().catch(e => console.warn('[Music] Failed to fix Chinese playlist URLs:', e));
  fixAllPlaylistCloudFrontUrls().catch((e: unknown) => console.warn('[Music] Failed to fix CloudFront URLs:', e));

  // Cron jobs for push notifications (all times in UTC, Almaty = UTC+5)
  // Daily quest notification — every day at 00:00 Almaty (19:00 UTC prev day)
  cron.schedule('0 19 * * *', () => {
    sendDailyQuestPushToAll().catch((e: unknown) => console.warn('[Cron] Daily quest push failed:', e));
  });

  // Shanyrak refill notification — every day at 09:00 Almaty (04:00 UTC)
  cron.schedule('0 4 * * *', () => {
    sendShanyrakRefillPushToEligible().catch((e: unknown) => console.warn('[Cron] Shanyrak refill push failed:', e));
  });

  // Season ending notification — every day at 12:00 Almaty (07:00 UTC)
  // Sends push if active season ends within 3 days
  cron.schedule('0 7 * * *', async () => {
    try {
      const { getCurrentSeasonKey, getSeasonBounds } = await import('../../shared/seasons');
      const seasonKey = getCurrentSeasonKey();
      const bounds = getSeasonBounds(seasonKey);
      const now = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const msLeft = bounds.end.getTime() - now;
      if (msLeft > 0 && msLeft <= threeDaysMs) {
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
        await sendSeasonEndingPushToAll(daysLeft);
      }
    } catch (e: unknown) {
      console.warn('[Cron] Season ending push failed:', e);
    }
  });

  console.log('[Cron] Push notification cron jobs scheduled');

  // Remote auth diagnostics are development-only. Exposing them in production would
  // leak authentication flow details and allow unauthenticated log manipulation.
  if (!isProduction) {
    const authLogBuffer: string[] = [];
    app.post("/api/auth/log", (req, res) => {
      const { step, detail, ts, platform } = req.body || {};
      const line = `[AuthLog] step=${String(step).slice(0, 64)} platform=${String(platform).slice(0, 32)} detail=${String(detail).slice(0, 500)} ts=${String(ts).slice(0, 32)}`;
      console.log(line);
      authLogBuffer.push(line);
      if (authLogBuffer.length > 500) authLogBuffer.shift();
      res.json({ ok: true });
    });

    app.get("/api/auth/logs", (_req, res) => {
      res.json({ entries: authLogBuffer.slice(-200) });
    });

    app.post("/api/auth/logs/clear", (_req, res) => {
      authLogBuffer.length = 0;
      res.json({ ok: true });
    });
  }

  // Health check endpoint — used by Login page to warm up the server on mount
  // Also used by Manus Heartbeat keep-alive pings
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // Keep-alive endpoint: called by Manus Heartbeat every 5 minutes to prevent cold starts
  // This ensures the server is always warm when Apple reviewers or real users connect
  app.post("/api/scheduled/keepalive", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Keep-alive settings to prevent proxy/load-balancer from closing idle connections
  server.keepAliveTimeout = 65000; // 65s — must be > proxy timeout (usually 60s)
  server.headersTimeout = 66000;   // slightly higher than keepAliveTimeout

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start ghost players after server is ready (only in production or when enabled)
    const ghostCount = parseInt(process.env.GHOST_PLAYER_COUNT || '0');
    if (ghostCount > 0) {
      // Small delay to let the server fully initialize before ghost connections
      setTimeout(() => {
        initGhostPlayers(port, ghostCount).catch(e => console.error('[Ghost] Init error:', e));
      }, 3000);
    }
  });
}

startServer().catch(console.error);
