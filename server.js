// server.js — o "cérebro" do site. Aqui ficam as regras que o navegador NÃO pode burlar:
// login, limites de uso, permissões e a chamada à IA.
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { gerarAventura } = require('./ia');

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('Defina SESSION_SECRET (32+ caracteres) no arquivo .env');
  process.exit(1);
}
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const LIMITE_USUARIO_DIA = 5; // gerações por dia no plano grátis
const LIMITE_VISITANTE = 1;   // gerações de quem testa sem login
const GENEROS = ['Fantasia sombria', 'Fantasia épica', 'Ficção científica', 'Terror', 'Investigação', 'Piratas e mares'];
const TONS = ['Misterioso', 'Aventureiro', 'Sombrio', 'Leve e bem-humorado', 'Tenso'];
// Hash falso, usado para o login demorar o mesmo tempo quando o e-mail não existe.
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-igualar-o-tempo', 12);

const app = express();

// --- Camadas de proteção (middlewares) ---
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }));
app.use(express.json({ limit: '10kb' }));
app.use(session({
  name: 'mesa.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // httpOnly: o JavaScript da página não consegue ler o cookie. sameSite: ajuda contra CSRF.
  // Ao colocar o site na internet com HTTPS, troque secure para true.
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 3600 * 1000 }
}));
const limiteLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { erro: 'Muitas tentativas. Aguarde alguns minutos.' } });
const limiteGerar = rateLimit({ windowMs: 60 * 1000, limit: 10, message: { erro: 'Muitos pedidos. Aguarde um minuto.' } });

// --- Funções de apoio ---
const usuarioAtual = (req) =>
  req.session.userId ? db.prepare('SELECT id, email, papel FROM usuarios WHERE id = ?').get(req.session.userId) : null;

const usadasHoje = (id) =>
  db.prepare("SELECT COUNT(*) AS n FROM aventuras WHERE usuario_id = ? AND date(criado_em) = date('now')").get(id).n;

const visitanteUsou = (req) => {
  const linha = db.prepare('SELECT total FROM testes_visitante WHERE ip = ?').get(req.ip);
  return Math.max(req.session.testes || 0, linha ? linha.total : 0); // vale o maior: cookie OU IP
};

function restantes(req, usuario) {
  if (usuario) return usuario.papel === 'admin' ? null : Math.max(0, LIMITE_USUARIO_DIA - usadasHoje(usuario.id));
  return Math.max(0, LIMITE_VISITANTE - visitanteUsou(req));
}

const emailValido = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const senhaValida = (s) => typeof s === 'string' && s.length >= 8 && s.length <= 72; // bcrypt só usa 72 caracteres

function exigirAdmin(req, res, next) {
  const u = usuarioAtual(req);
  if (!u || u.papel !== 'admin') return res.status(403).json({ erro: 'Acesso negado.' });
  next();
}

// --- Rotas de conta ---
app.post('/api/cadastro', limiteLogin, (req, res) => {
  const { email, senha } = req.body || {};
  if (!emailValido(email) || !senhaValida(senha)) {
    return res.status(400).json({ erro: 'Use um e-mail válido e uma senha de 8 a 72 caracteres.' });
  }
  const emailLimpo = email.trim().toLowerCase();
  const papel = ADMIN_EMAIL && emailLimpo === ADMIN_EMAIL ? 'admin' : 'usuario';
  try {
    // "?" = parâmetro: o valor vai separado do SQL. Isso impede SQL injection.
    const r = db.prepare('INSERT INTO usuarios (email, senha_hash, papel) VALUES (?, ?, ?)')
      .run(emailLimpo, bcrypt.hashSync(senha, 12), papel);
    req.session.regenerate(() => { req.session.userId = Number(r.lastInsertRowid); res.json({ ok: true }); });
  } catch (e) {
    res.status(409).json({ erro: 'Não foi possível criar a conta com esses dados.' });
  }
});

app.post('/api/login', limiteLogin, (req, res) => {
  const { email, senha } = req.body || {};
  const u = typeof email === 'string' ? db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.trim().toLowerCase()) : null;
  const ok = bcrypt.compareSync(typeof senha === 'string' ? senha : '', u ? u.senha_hash : HASH_FALSO);
  if (!u || !ok) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' }); // mensagem genérica de propósito
  req.session.regenerate(() => { req.session.userId = u.id; res.json({ ok: true }); });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => { res.clearCookie('mesa.sid'); res.json({ ok: true }); });
});

app.get('/api/eu', (req, res) => {
  const u = usuarioAtual(req);
  res.json({ logado: !!u, email: u ? u.email : null, papel: u ? u.papel : null, restantes: restantes(req, u) });
});

// --- Gerador ---
const ocupados = new Set(); // impede dois pedidos ao mesmo tempo da mesma pessoa (burlaria o limite)

app.post('/api/gerar', limiteGerar, async (req, res) => {
  const { genero, tom, ideia } = req.body || {};
  const jogadores = Number((req.body || {}).jogadores);
  // Nunca confie no que vem do navegador: valide tudo de novo aqui.
  if (!GENEROS.includes(genero) || !TONS.includes(tom) || !Number.isInteger(jogadores) || jogadores < 1 || jogadores > 20) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }
  const ideiaLimpa = typeof ideia === 'string' ? ideia.trim().slice(0, 200) : '';

  const usuario = usuarioAtual(req);
  if (restantes(req, usuario) === 0) {
    return res.status(403).json({ erro: usuario ? 'Você usou todas as gerações de hoje.' : 'O teste grátis acabou. Crie uma conta para continuar.', codigo: usuario ? 'limite_diario' : 'limite_visitante' });
  }
  const chave = usuario ? 'u' + usuario.id : 'ip' + req.ip;
  if (ocupados.has(chave)) return res.status(429).json({ erro: 'Aguarde a geração anterior terminar.' });

  ocupados.add(chave);
  try {
    const aventura = await gerarAventura({ genero, tom, jogadores, ideia: ideiaLimpa });
    if (usuario) {
      db.prepare('INSERT INTO aventuras (usuario_id, genero, tom, jogadores, conteudo) VALUES (?, ?, ?, ?, ?)')
        .run(usuario.id, genero, tom, jogadores, JSON.stringify(aventura));
    } else {
      req.session.testes = (req.session.testes || 0) + 1;
      db.prepare('INSERT INTO testes_visitante (ip, total) VALUES (?, 1) ON CONFLICT(ip) DO UPDATE SET total = total + 1').run(req.ip);
    }
    res.json({ aventura, restantes: restantes(req, usuario) });
  } catch (e) {
    console.error('Falha ao gerar:', e.message); // o detalhe fica no servidor, não vai para o usuário
    res.status(502).json({ erro: 'Não consegui gerar agora. Tente novamente.' });
  } finally {
    ocupados.delete(chave);
  }
});

// --- Histórico (só do próprio usuário) ---
app.get('/api/aventuras', (req, res) => {
  const u = usuarioAtual(req);
  if (!u) return res.status(401).json({ erro: 'Entre para ver seu histórico.' });
  const linhas = db.prepare('SELECT id, genero, tom, jogadores, conteudo, criado_em FROM aventuras WHERE usuario_id = ? ORDER BY id DESC LIMIT 30').all(u.id);
  res.json(linhas.map((l) => ({ ...l, conteudo: JSON.parse(l.conteudo) })));
});

app.delete('/api/aventuras/:id', (req, res) => {
  const u = usuarioAtual(req);
  if (!u) return res.status(401).json({ erro: 'Entre para continuar.' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erro: 'Pedido inválido.' });
  db.prepare('DELETE FROM aventuras WHERE id = ? AND usuario_id = ?').run(id, u.id); // "AND usuario_id" = só apaga o que é seu
  res.json({ ok: true });
});

// --- Painel do dono ---
app.get('/api/admin/resumo', exigirAdmin, (req, res) => {
  res.json({
    usuarios: db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n,
    aventuras: db.prepare('SELECT COUNT(*) AS n FROM aventuras').get().n,
    aventurasHoje: db.prepare("SELECT COUNT(*) AS n FROM aventuras WHERE date(criado_em) = date('now')").get().n
  });
});

app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => { // qualquer erro inesperado cai aqui, sem vazar detalhes
  console.error(err.message);
  res.status(err.status || 500).json({ erro: 'Pedido inválido.' });
});

app.listen(process.env.PORT || 3000, () => console.log('Mesa rodando em http://localhost:' + (process.env.PORT || 3000)));
