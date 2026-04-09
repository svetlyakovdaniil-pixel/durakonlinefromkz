import mysql from 'mysql2/promise';

async function seed() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root@localhost/kazakh_durak');
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
  });

  const CHINESE_TRACKS = [
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives1_d22bf6ad.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives2_c7eb07a6.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives3_c8055486.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives4_74578e4d.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives5_7ee965b9.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives6_8069fa5b.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill+hiphopmotives7_b7997b7b.mp3',
  ];

  try {
    // Insert Chinese chill+hiphop motives playlist
    const [result] = await connection.execute(
      'INSERT INTO music_playlists (name, price, isDefault, tracksJson, previewTrackUrl) VALUES (?, ?, ?, ?, ?)',
      ['Chinese chill+hiphop motives', 100000, false, JSON.stringify(CHINESE_TRACKS), CHINESE_TRACKS[0]]
    );
    console.log('✓ Chinese chill+hiphop motives playlist created with ID:', result.insertId);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

seed();
