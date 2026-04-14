/**
 * Force rollback ALL season_rewards and season_ratings for admin/gm accounts.
 * Also reverts credited balances.
 * Run: node scripts/force-rollback-seasons.mjs
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq, inArray, and, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Inline schema references to avoid TS compilation
const { users, playerProfiles, seasonRatings, seasonRewards, notifications } = await import('../drizzle/schema.ts').catch(async () => {
  // Try compiled version
  return import('../drizzle/schema.js');
});

console.log('=== Force Rollback: ALL season data for admin/gm accounts ===\n');

// 1. Get all admin/gm profiles
const adminProfiles = await db
  .select({ profileId: playerProfiles.id, displayName: playerProfiles.displayName, userId: playerProfiles.userId })
  .from(users)
  .innerJoin(playerProfiles, eq(playerProfiles.userId, users.id))
  .where(inArray(users.role, ['admin', 'gm']));

console.log(`Found ${adminProfiles.length} admin/gm profiles`);

// 2. Get all season_rewards for these profiles
const profileIds = adminProfiles.map(p => p.profileId);

if (profileIds.length === 0) {
  console.log('No admin/gm profiles found. Exiting.');
  await connection.end();
  process.exit(0);
}

const allRewards = await db
  .select()
  .from(seasonRewards)
  .where(inArray(seasonRewards.profileId, profileIds));

console.log(`Found ${allRewards.length} season_rewards records to roll back`);

// 3. Revert balances and delete rewards
let rewardCount = 0;
for (const reward of allRewards) {
  const profile = adminProfiles.find(p => p.profileId === reward.profileId);
  console.log(`  Rolling back: profile ${reward.profileId} (${profile?.displayName ?? '?'}), season ${reward.seasonKey}, shanyrak=${reward.shanyraksAwarded}, tenge=${reward.tengeAwarded}`);

  if (reward.shanyraksAwarded > 0) {
    await db.update(playerProfiles)
      .set({ balanceShanyrak: sql`GREATEST(0, ${playerProfiles.balanceShanyrak} - ${reward.shanyraksAwarded})` })
      .where(eq(playerProfiles.id, reward.profileId));
  }
  if (reward.tengeAwarded > 0) {
    await db.update(playerProfiles)
      .set({ balanceTenge: sql`GREATEST(0, ${playerProfiles.balanceTenge} - ${reward.tengeAwarded})` })
      .where(eq(playerProfiles.id, reward.profileId));
  }

  await db.delete(seasonRewards)
    .where(and(eq(seasonRewards.profileId, reward.profileId), eq(seasonRewards.seasonKey, reward.seasonKey)));

  rewardCount++;
}

// 4. Delete all season_ratings for admin/gm
const ratingsResult = await db
  .select({ id: seasonRatings.id, profileId: seasonRatings.profileId, seasonKey: seasonRatings.seasonKey })
  .from(seasonRatings)
  .where(inArray(seasonRatings.profileId, profileIds));

console.log(`\nFound ${ratingsResult.length} season_ratings records to delete`);

for (const r of ratingsResult) {
  const profile = adminProfiles.find(p => p.profileId === r.profileId);
  console.log(`  Deleting rating: profile ${r.profileId} (${profile?.displayName ?? '?'}), season ${r.seasonKey}`);
  await db.delete(seasonRatings)
    .where(and(eq(seasonRatings.profileId, r.profileId), eq(seasonRatings.seasonKey, r.seasonKey)));
}

// 5. Delete season_reward notifications for admin/gm
const allNotifs = await db
  .select({ id: notifications.id, profileId: notifications.profileId, data: notifications.data })
  .from(notifications)
  .where(and(
    inArray(notifications.profileId, profileIds),
    eq(notifications.type, 'season_reward'),
  ));

console.log(`\nFound ${allNotifs.length} season_reward notifications to delete`);
let notifCount = 0;
for (const n of allNotifs) {
  await db.delete(notifications).where(eq(notifications.id, n.id));
  notifCount++;
}

console.log(`\n=== Done ===`);
console.log(`  Rewards rolled back: ${rewardCount}`);
console.log(`  Ratings deleted: ${ratingsResult.length}`);
console.log(`  Notifications deleted: ${notifCount}`);

await connection.end();
