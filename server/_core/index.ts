import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerEmailAuthRoutes } from "../emailAuth";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { registerAppleAuthRoutes } from "../appleAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initSocketServer } from "../socketServer";
import { seedDefaultPlaylist, seedChinesePlaylist, seedLoFiChillhopPlaylist, cleanupOldPlaylists, fixChinesePlaylistUrls } from "../db";

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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Email/password auth routes
  registerEmailAuthRoutes(app);
  // Google Sign-In routes
  registerGoogleAuthRoutes(app);
  // Apple Sign In routes
  registerAppleAuthRoutes(app);
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
  fixChinesePlaylistUrls().catch(e => console.warn('[Music] Failed to fix Chinese playlist URLs:', e));

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
  });
}

startServer().catch(console.error);
