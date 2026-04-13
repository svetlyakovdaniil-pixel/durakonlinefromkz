/**
 * Script: simulate-season-end.mjs
 * 
 * 1. Find all admin users' player profiles
 * 2. Set their season rating to 15000 for the current season (2026-04)
 * 3. Run processSeasonEnd for the current season
 * 
 * Usage: node scripts/simulate-season-end.mjs
 */

import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse mysql2 connection from URL
// Format: mysql://user:pass@host:port/dbname
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || '3306'),
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };
}

const SEASON_KEY = '2026-04';
const RATING_TO_SET = 15000;

async function main() {
  const conn = await createConnection(parseDbUrl(DB_URL));
  console.log('Connected to DB');

  // 1. Find all admin users and their profiles
  const [adminRows] = await conn.execute(`
    SELECT u.id as userId, u.name, u.role, pp.id as profileId, pp.gameId, pp.displayName
    FROM users u
    JOIN player_profiles pp ON pp.userId = u.id
    WHERE u.role IN ('admin', 'gm')
  `);

  if (adminRows.length === 0) {
    console.log('No admin users with profiles found.');
    await conn.end();
    return;
  }

  console.log(`\nFound ${adminRows.length} admin profile(s):`);
  for (const row of adminRows) {
    console.log(`  - gameId=${row.gameId} | displayName="${row.displayName}" | role=${row.role} | profileId=${row.profileId}`);
  }

  // 2. Upsert season rating = 15000 for each admin
  console.log(`\nSetting season rating to ${RATING_TO_SET} for season ${SEASON_KEY}...`);
  for (const row of adminRows) {
    await conn.execute(`
      INSERT INTO season_ratings (profileId, seasonKey, seasonRating, gamesPlayed, wins, losses, createdAt, updatedAt)
      VALUES (?, ?, ?, 50, 30, 10, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        seasonRating = VALUES(seasonRating),
        gamesPlayed = VALUES(gamesPlayed),
        wins = VALUES(wins),
        losses = VALUES(losses),
        updatedAt = NOW()
    `, [row.profileId, SEASON_KEY, RATING_TO_SET]);
    console.log(`  ✓ Set rating=${RATING_TO_SET} for profileId=${row.profileId} (${row.displayName})`);
  }

  // 3. Determine rank for each admin at 15000 rating
  // Ranks: steppe_hare(0-200), mountain_ram(201-500), golden_falcon(501-800),
  //        winged_horse(801-1200), sky_eagle(1201-2000), steppe_khan(2001-4000),
  //        golden_horde_warrior(4001-10000), great_khan(10001+)
  // 15000 → great_khan
  const rankKey = 'great_khan';
  const shanyraks = 500000;
  const tenge = 100;

  console.log(`\nRank at ${RATING_TO_SET}: ${rankKey} (${shanyraks} шаныраков, ${tenge} тенге)`);

  // 4. Simulate processSeasonEnd: create season_rewards + credit balances + notifications
  console.log(`\nSimulating season end for ${SEASON_KEY}...`);
  for (const row of adminRows) {
    // Check if reward already exists
    const [existing] = await conn.execute(`
      SELECT id FROM season_rewards WHERE profileId = ? AND seasonKey = ?
    `, [row.profileId, SEASON_KEY]);

    if (existing.length > 0) {
      console.log(`  ⚠ Reward already exists for profileId=${row.profileId}, deleting old one first...`);
      await conn.execute(`DELETE FROM season_rewards WHERE profileId = ? AND seasonKey = ?`, [row.profileId, SEASON_KEY]);
    }

    // Insert season reward
    await conn.execute(`
      INSERT INTO season_rewards (profileId, seasonKey, finalRating, rankKey, shanyraksAwarded, tengeAwarded, claimed, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
    `, [row.profileId, SEASON_KEY, RATING_TO_SET, rankKey, shanyraks, tenge]);

    // Credit shanyrak balance
    await conn.execute(`
      UPDATE player_profiles SET balanceShanyrak = balanceShanyrak + ? WHERE id = ?
    `, [shanyraks, row.profileId]);

    // Credit tenge balance
    await conn.execute(`
      UPDATE player_profiles SET balanceTenge = balanceTenge + ? WHERE id = ?
    `, [tenge, row.profileId]);

    // Send season_reward notification
    const notifData = JSON.stringify({
      seasonKey: SEASON_KEY,
      rankKey,
      rankNameRu: 'Великий хан',
      shanyraks,
      tenge,
    });
    await conn.execute(`
      INSERT INTO notifications (profileId, type, data, isRead, createdAt)
      VALUES (?, 'season_reward', ?, 0, NOW())
    `, [row.profileId, notifData]);

    console.log(`  ✓ Season reward created for profileId=${row.profileId} (${row.displayName})`);
    console.log(`    → +${shanyraks} шаныраков, +${tenge} тенге, notification sent`);
  }

  // 5. Show final state
  console.log('\n=== Final state ===');
  const [finalRows] = await conn.execute(`
    SELECT pp.gameId, pp.displayName, pp.balanceShanyrak, pp.balanceTenge,
           sr.seasonRating, sr.seasonKey,
           srw.rankKey, srw.shanyraksAwarded, srw.tengeAwarded, srw.claimed
    FROM player_profiles pp
    JOIN users u ON u.id = pp.userId
    LEFT JOIN season_ratings sr ON sr.profileId = pp.id AND sr.seasonKey = ?
    LEFT JOIN season_rewards srw ON srw.profileId = pp.id AND srw.seasonKey = ?
    WHERE u.role IN ('admin', 'gm')
  `, [SEASON_KEY, SEASON_KEY]);

  for (const row of finalRows) {
    console.log(`\n  Player: ${row.displayName} (gameId=${row.gameId})`);
    console.log(`    Season rating: ${row.seasonRating} (${SEASON_KEY})`);
    console.log(`    Rank: ${row.rankKey}`);
    console.log(`    Reward: ${row.shanyraksAwarded} шаныраков, ${row.tengeAwarded} тенге (claimed=${row.claimed})`);
    console.log(`    Balance: ${row.balanceShanyrak} шаныраков, ${row.balanceTenge} тенге`);
  }

  await conn.end();
  console.log('\nDone! ✓');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
