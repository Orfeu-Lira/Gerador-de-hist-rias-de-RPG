// Endpoint de diagnóstico sem banco de dados nem chave de IA.
module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Método não permitido.' });
  }
  return res.status(200).json({ ok: true, servico: 'mesa-api', banco: 'pendente', ia: 'gemini' });
};
