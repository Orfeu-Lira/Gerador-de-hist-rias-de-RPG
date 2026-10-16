// Conexão segura PostgreSQL/Supabase: TLS com autoridade certificadora do projeto.
const { Pool } = require('pg');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');

const url = new URL(process.env.DATABASE_URL);
// Os parâmetros ssl da URL podem sobrescrever a configuração TLS do pg.
url.searchParams.delete('sslmode');
url.searchParams.delete('sslrootcert');
url.searchParams.delete('sslcert');
url.searchParams.delete('sslkey');

const certificado = (process.env.DATABASE_CA_CERT || '').replace(/\\n/g, '\n');
const pool = new Pool({
  connectionString: url.toString(),
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: certificado
    ? { ca: certificado, rejectUnauthorized: true }
    : { rejectUnauthorized: true }
});
async function query(text, params = []) { return pool.query(text, params); }
module.exports = { pool, query };
