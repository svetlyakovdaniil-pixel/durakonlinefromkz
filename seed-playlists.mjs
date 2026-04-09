import mysql from 'mysql2/promise';

async function seed() {
  // Parse DATABASE_URL
  const url = new URL(process.env.DATABASE_URL || 'mysql://root@localhost/kazakh_durak');
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
  });

  const RULES_HOUSE_TRACKS = [
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№1_fd1382d6.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№2_97b3c0a9.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№3_9c1cf3b0.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№4_3882b329.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№5_79e63061.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№6_2a64f936.mp3',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663508367403/JjIAoPpnRIxeEDFN.mp3',
  ];

  try {
    // Insert Rules house playlist
    const [result] = await connection.execute(
      'INSERT INTO music_playlists (name, price, isDefault, tracksJson, previewTrackUrl) VALUES (?, ?, ?, ?, ?)',
      ['Rules house', 0, true, JSON.stringify(RULES_HOUSE_TRACKS), RULES_HOUSE_TRACKS[0]]
    );
    console.log('✓ Rules house playlist created with ID:', result.insertId);

    // Get all player profiles
    const [profiles] = await connection.execute('SELECT id FROM player_profiles');
    
    // Add Rules house to all players
    for (const profile of profiles) {
      await connection.execute(
        'INSERT INTO owned_music_playlists (profileId, playlistId) VALUES (?, ?)',
        [profile.id, result.insertId]
      );
    }
    console.log(`✓ Added Rules house to ${profiles.length} players`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

seed();
