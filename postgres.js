// Conexão PostgreSQL para Supabase. Apenas código de servidor.
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: true }
});

async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = { pool, query };
