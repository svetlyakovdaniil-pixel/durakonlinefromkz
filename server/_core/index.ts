import "dotenv/config";
import express from "express";
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
  // Security headers — help browsers and Safe Browsing identify the site as legitimate
  app.use((_req, res, next) => {
    // Strict Transport Security (HTTPS only, 1 year)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Email/password auth routes
  registerEmailAuthRoutes(app);
  // Google Sign-In routes
  registerGoogleAuthRoutes(app);
  // Apple Sign In routes
  registerAppleAuthRoutes(app);
  // IAP verification endpoint
  registerIAPRoutes(app);
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
