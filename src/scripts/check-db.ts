import { Client } from 'pg';
import 'dotenv/config';

async function checkDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as result');
    if (res.rows[0].result === 1) {
      console.log('Database connection successful.');
    }
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await client.end();
  }
}

checkDb();
