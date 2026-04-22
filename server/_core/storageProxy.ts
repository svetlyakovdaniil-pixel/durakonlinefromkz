import type { Express } from "express";
import { ENV } from "./env";

// In-memory cache: key -> { url, expiresAt }
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes (presigned URLs valid for 1 hour)

export function registerStorageProxy(app: Express) {
  app.get("/storage-proxy/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0] ?? req.path.replace(/^\/storage-proxy\//, '');
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    // Check cache first
    const cached = urlCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      res.set("Cache-Control", "public, max-age=2400"); // 40 min browser cache
      res.redirect(307, cached.url);
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Cache the presigned URL
      urlCache.set(key, { url, expiresAt: Date.now() + CACHE_TTL_MS });

      res.set("Cache-Control", "public, max-age=2400"); // 40 min browser cache
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
