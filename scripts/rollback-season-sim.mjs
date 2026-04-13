/**
 * Script: rollback-season-sim.mjs
 * Rolls back the simulate-season-end simulation:
 * - Deletes season_rewards for 2026-04 for admin/gm users
 * - Deletes season_ratings for 2026-04 for admin/gm users
 * - Removes the credited balances (shanyrak +500000, tenge +100)
 * - Deletes the season_reward notifications
 */

import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

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
const SHANYRAKS_TO_REMOVE = 500000;
const TENGE_TO_REMOVE = 100;

async function main() {
  const conn = await createConnection(parseDbUrl(DB_URL));
  console.log('Connected to DB');

  // Find admin profiles
  const [adminRows] = await conn.execute(`
    SELECT u.id as userId, u.name, u.role, pp.id as profileId, pp.gameId, pp.displayName,
           pp.balanceShanyrak, pp.balanceTenge
    FROM users u
    JOIN player_profiles pp ON pp.userId = u.id
    WHERE u.role IN ('admin', 'gm')
  `);

  console.log(`\nFound ${adminRows.length} admin/gm profile(s)`);

  for (const row of adminRows) {
    console.log(`\nRolling back profileId=${row.profileId} (${row.displayName})...`);

    // 1. Delete season_rewards
    const [delReward] = await conn.execute(`
      DELETE FROM season_rewards WHERE profileId = ? AND seasonKey = ?
    `, [row.profileId, SEASON_KEY]);
    console.log(`  ✓ Deleted season_rewards: ${delReward.affectedRows} row(s)`);

    // 2. Delete season_ratings
    const [delRating] = await conn.execute(`
      DELETE FROM season_ratings WHERE profileId = ? AND seasonKey = ?
    `, [row.profileId, SEASON_KEY]);
    console.log(`  ✓ Deleted season_ratings: ${delRating.affectedRows} row(s)`);

    // 3. Subtract credited shanyrak balance (floor at 0)
    await conn.execute(`
      UPDATE player_profiles
      SET balanceShanyrak = GREATEST(0, balanceShanyrak - ?)
      WHERE id = ?
    `, [SHANYRAKS_TO_REMOVE, row.profileId]);
    console.log(`  ✓ Removed ${SHANYRAKS_TO_REMOVE} шаныраков`);

    // 4. Subtract credited tenge balance (floor at 0)
    await conn.execute(`
      UPDATE player_profiles
      SET balanceTenge = GREATEST(0, balanceTenge - ?)
      WHERE id = ?
    `, [TENGE_TO_REMOVE, row.profileId]);
    console.log(`  ✓ Removed ${TENGE_TO_REMOVE} тенге`);

    // 5. Delete season_reward notifications
    const [delNotif] = await conn.execute(`
      DELETE FROM notifications
      WHERE profileId = ? AND type = 'season_reward'
        AND JSON_EXTRACT(data, '$.seasonKey') = ?
    `, [row.profileId, SEASON_KEY]);
    console.log(`  ✓ Deleted season_reward notifications: ${delNotif.affectedRows} row(s)`);
  }

  // Final state check
  console.log('\n=== Final balances ===');
  const [finalRows] = await conn.execute(`
    SELECT pp.gameId, pp.displayName, pp.balanceShanyrak, pp.balanceTenge
    FROM player_profiles pp
    JOIN users u ON u.id = pp.userId
    WHERE u.role IN ('admin', 'gm')
    ORDER BY pp.gameId
  `);
  for (const row of finalRows) {
    console.log(`  gameId=${row.gameId} ${row.displayName}: ${row.balanceShanyrak} шаныраков, ${row.balanceTenge} тенге`);
  }

  await conn.end();
  console.log('\nRollback complete ✓');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
