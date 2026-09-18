import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

// Configure PostgreSQL connection pool
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'expensetracker',
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Initialize PostgreSQL Tables & Indexes
export const initDB = async () => {
  try {
    const client = await pool.connect();
    console.log('🐘 Connected to PostgreSQL database successfully');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Transactions table with user_id foreign key
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount NUMERIC(12, 2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_cat ON transactions(user_id, category);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // 4. Seed demo user if no users exist
    const userCountRes = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding demo user into PostgreSQL...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userRes = await client.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['Demo User', 'demo@vaultflow.app', hashedPassword]
      );
      const demoUserId = userRes.rows[0].id;

      const now = new Date();
      const yesterday = new Date(Date.now() - 86400000);
      const twoDaysAgo = new Date(Date.now() - 172800000);

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, reason, category, date) VALUES 
         ($1, 'income', 4500.00, 'Monthly Salary', 'Salary', $2),
         ($1, 'income', 750.00, 'Design Consultation', 'Freelance', $3),
         ($1, 'expense', 145.20, 'Whole Foods Grocery', 'Food', $2),
         ($1, 'expense', 35.00, 'Uber Ride', 'Transport', $2),
         ($1, 'expense', 18.99, 'Streaming Subscription', 'Entertainment', $3),
         ($1, 'expense', 95.00, 'Electricity & Utilities', 'Bills', $4)`,
        [demoUserId, now, yesterday, twoDaysAgo]
      );
      console.log('Demo user seeded: email: demo@vaultflow.app, password: password123');
    }

    client.release();
  } catch (err) {
    console.error('⚠️ PostgreSQL connection failed:', err.message);
    console.log('👉 Please ensure PostgreSQL server is running and connection details in .env are correct.');
  }
};

export const query = (text, params) => pool.query(text, params);

export default {
  pool,
  query,
  initDB
};
