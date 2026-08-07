/**
 * One-off script: rename "Dark trap electronic" playlist to "House" and
 * replace its tracks with the new House tracks.
 *
 * Usage (on the server, in /root/app):
 *   DATABASE_URL="mysql://..." npx tsx scripts/update_house_playlist.ts
 *
 * Tracks come from client/public/assets/static/ (uploaded to git). The server
 * serves them at /assets/static/<filename>. Each entry here must match a file
 * that exists in that folder (and lands in dist/public/assets/static on deploy).
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, or } from "drizzle-orm";
import { musicPlaylists } from "../drizzle/schema";

const NEW_NAME = "House";
const NEW_TRACKS = [
  '/assets/static/house-1.mp3',
  '/assets/static/house-2.mp3',
  '/assets/static/house-3.mp3',
  '/assets/static/house-4.mp3',
  '/assets/static/house-5.mp3',
  '/assets/static/house-6.mp3',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const pool = mysql.createPool({ uri: url });
  const db = drizzle(pool);

  // Find the current "Dark trap electronic" playlist OR an existing "House"
  // (idempotent: safe to re-run on every deploy)
  const rows = await db
    .select()
    .from(musicPlaylists)
    .where(or(
      eq(musicPlaylists.name, "Dark trap electronic"),
      eq(musicPlaylists.name, "House"),
    ));

  if (rows.length === 0) {
    console.error('Playlist "Dark trap electronic" not found — nothing to rename');
    process.exit(0);
  }

  if (NEW_TRACKS.length === 0) {
    console.error("NEW_TRACKS is empty — add the uploaded House track filenames first");
    process.exit(1);
  }

  const playlist = rows[0];
  console.log(`Found playlist id=${playlist.id} "${playlist.name}"`);
  console.log("Old tracks:", JSON.parse(playlist.tracksJson || "[]"));

  await db
    .update(musicPlaylists)
    .set({
      name: NEW_NAME,
      nameKk: NEW_NAME,
      nameEn: NEW_NAME,
      nameUk: NEW_NAME,
      nameKa: NEW_NAME,
      nameAz: NEW_NAME,
      nameUz: NEW_NAME,
      namePl: NEW_NAME,
      tracksJson: JSON.stringify(NEW_TRACKS),
      description: "House music — " + NEW_TRACKS.length + " треков",
      descriptionKk: "House музыка — " + NEW_TRACKS.length + " трек",
      descriptionEn: "House music — " + NEW_TRACKS.length + " tracks",
    })
    .where(eq(musicPlaylists.id, playlist.id));

  console.log(`Playlist renamed to "${NEW_NAME}" with ${NEW_TRACKS.length} tracks`);
  console.log("New tracks:", NEW_TRACKS);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
