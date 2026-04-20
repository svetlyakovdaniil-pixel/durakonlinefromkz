import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute('SELECT * FROM shop_price_overrides ORDER BY item_type, item_id');
console.log('shop_price_overrides rows:', JSON.stringify(rows, null, 2));

const [rows2] = await conn.execute('SELECT item_type, item_id, is_available FROM shop_price_overrides WHERE is_available = 0');
console.log('\nDISABLED items:', JSON.stringify(rows2, null, 2));

await conn.end();
