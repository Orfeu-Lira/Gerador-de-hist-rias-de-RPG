const { X509Certificate } = require('node:crypto');
const { query } = require('../postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido.' });
  if (process.env.VERCEL_ENV === 'production') return res.status(404).json({ erro: 'Não encontrado.' });

  const pem = (process.env.DATABASE_CA_CERT || '').replace(/\\n/g, '\n').trim();
  let certificateValid = false;
  try {
    if (pem) {
      new X509Certificate(pem);
      certificateValid = true;
    }
  } catch (_) { certificateValid = false; }

  const diagnostic = { caPresent: !!pem, caValid: certificateValid };
  try {
    await query('SELECT 1');
    return res.status(200).json({ ok: true, database: 'connected', diagnostic });
  } catch (err) {
    console.error('PostgreSQL health check failure', err.code || 'unknown');
    return res.status(503).json({ ok: false, database: 'unavailable', diagnostic });
  }
};
