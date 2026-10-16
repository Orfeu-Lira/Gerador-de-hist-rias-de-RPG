// Diagnóstico privado da conexão PostgreSQL, sem divulgar credenciais.
const { query } = require('../postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Método não permitido.' });
  }
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(404).json({ erro: 'Não encontrado.' });
  }
  try {
    await query('SELECT 1');
    return res.status(200).json({ ok: true, database: 'connected' });
  } catch (err) {
    console.error('PostgreSQL health check failure', err.code || 'unknown');
    return res.status(503).json({ ok: false, database: 'unavailable' });
  }
};
