import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then((client) => {
    console.log('PostgreSQL connected successfully');
    client.release();
  })
  .catch((error) => {
    console.error('PostgreSQL connection error:', error.message);
  });

export { pool };
