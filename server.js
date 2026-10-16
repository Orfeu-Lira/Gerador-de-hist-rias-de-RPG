// Mesa — backend Express preparado para Vercel com PostgreSQL/Supabase.
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const { query } = require('./postgres');
const { gerarAventura } = require('./ia');

const PRODUCAO = process.env.NODE_ENV === 'production';
const ORIGEM = (process.env.FRONTEND_ORIGIN || '').replace(/\/+$/, '');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Configure SESSION_SECRET com no mínimo 32 caracteres.');
}
if (PRODUCAO && (!ORIGEM || new URL(ORIGEM).origin !== ORIGEM || !ORIGEM.startsWith('https://'))) {
  throw new Error('Configure FRONTEND_ORIGIN com a origem HTTPS do GitHub Pages.');
}
if (PRODUCAO && (!process.env.ADMIN_BOOTSTRAP_TOKEN || process.env.ADMIN_BOOTSTRAP_TOKEN.length < 32)) {
  throw new Error('Configure ADMIN_BOOTSTRAP_TOKEN (32+ caracteres).');
}
if (!process.env.GEMINI_API_KEY) throw new Error('Configure GEMINI_API_KEY.');

class PostgresSessionStore extends session.Store {
  get(sid, cb) {
    query('SELECT sessao FROM public.sessoes WHERE sid=$1 AND expira_em>$2', [sid, Date.now()])
      .then(r => cb(null, r.rows[0] ? r.rows[0].sessao : null)).catch(cb);
  }
  set(sid, sessao, cb) {
    const cookie = sessao.cookie || {};
    const expira = cookie.expires ? new Date(cookie.expires).getTime() : Date.now() + (cookie.originalMaxAge || 604800000);
    query('INSERT INTO public.sessoes(sid,sessao,expira_em) VALUES($1,$2::jsonb,$3) ON CONFLICT(sid) DO UPDATE SET sessao=EXCLUDED.sessao, expira_em=EXCLUDED.expira_em',
      [sid, JSON.stringify(sessao), expira]).then(() => cb && cb(null)).catch(e => cb && cb(e));
  }
  destroy(sid, cb) {
    query('DELETE FROM public.sessoes WHERE sid=$1', [sid]).then(() => cb && cb(null)).catch(e => cb && cb(e));
  }
  touch(sid, sessao, cb) { this.set(sid, sessao, cb); }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use((req,res,next) => {
  const origin = req.get('Origin');
  res.vary('Origin');
  if (origin && origin !== ORIGEM) return res.status(403).json({ erro: 'Origem não permitida.' });
  if (origin && origin === ORIGEM) {
    res.set({
      'Access-Control-Allow-Origin': ORIGEM,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin === ORIGEM ? 204 : 403);
  if (PRODUCAO && ['POST', 'DELETE'].includes(req.method) && req.path.startsWith('/api/') && origin !== ORIGEM) {
    return res.status(403).json({ erro: 'Origem não permitida.' });
  }
  next();
});
app.use(express.json({ limit: '10kb' }));
app.use(session({
  name: 'mesa.sid', secret: process.env.SESSION_SECRET,
  store: new PostgresSessionStore(), resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, secure: PRODUCAO, sameSite: PRODUCAO ? 'none' : 'lax', maxAge: 604800000 }
}));

const GENEROS = ['Fantasia sombria','Fantasia épica','Ficção científica','Terror','Investigação','Piratas e mares'];
const TONS = ['Misterioso','Aventureiro','Sombrio','Leve e bem-humorado','Tenso'];
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-proteger-tempo-de-resposta', 12);
const emailValido = s => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const senhaValida = s => typeof s === 'string' && s.length >= 8 && s.length <= 72;
const asyncHandler = f => (req,res,next) => Promise.resolve(f(req,res,next)).catch(next);
const atual = async req => {
  if (!req.session.userId) return null;
  const r = await query('SELECT id,email,papel FROM public.usuarios WHERE id=$1', [req.session.userId]);
  return r.rows[0] || null;
};
const quotaKey = (req,u) => u
  ? 'usuario:' + u.id + ':' + new Date().toISOString().slice(0,10)
  : 'visitante:' + (req.ip || 'desconhecido');
const usadas = async chave => Number((await query('SELECT total FROM public.geracoes_limite WHERE identificador=$1',[chave])).rows[0]?.total || 0);
const restantes = async (req,u) => u && u.papel === 'admin' ? null : Math.max(0,(u ? 5 : 1) - await usadas(quotaKey(req,u)));
const refreshSession = (req, userId) => new Promise((resolve,reject) => req.session.regenerate(err => {
  if (err) return reject(err);
  req.session.userId = userId; req.session.save(err2 => err2 ? reject(err2) : resolve());
}));
const compareSecret = (received, secret) => {
  if (typeof received !== 'string' || !secret || !received) return false;
  const a = Buffer.from(received), b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a,b);
};

app.get('/api/health',(req,res)=>res.json({ok:true,service:'mesa-api'}));
app.get('/api/db-health',asyncHandler(async(req,res)=>{
  if (process.env.VERCEL_ENV === 'production') return res.status(404).json({erro:'Não encontrado.'});
  await query('SELECT 1'); res.json({ok:true,database:'connected'});
}));

app.post('/api/cadastro', asyncHandler(async(req,res) => {
  const {email,senha,tokenBootstrap} = req.body || {};
  if (!emailValido(email) || !senhaValida(senha)) return res.status(400).json({erro:'Use um e-mail válido e senha de 8 a 72 caracteres.'});
  const hash = await bcrypt.hash(senha,12);
  const { pool } = require('./postgres');
  const client = await pool.connect();
  let id;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(18452)');
    const {rows} = await client.query("SELECT 1 FROM public.usuarios WHERE papel='admin' LIMIT 1");
    const admin = !rows.length && compareSecret(tokenBootstrap,process.env.ADMIN_BOOTSTRAP_TOKEN);
    const r = await client.query('INSERT INTO public.usuarios(email,senha_hash,papel) VALUES($1,$2,$3) RETURNING id',
      [email.trim().toLowerCase(),hash,admin ? 'admin':'usuario']);
    id = Number(r.rows[0].id);
    await client.query('COMMIT');
  } catch(e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({erro:'Já existe uma conta com esse e-mail.'});
    throw e;
  } finally { client.release(); }
  await refreshSession(req,id);
  res.json({ok:true});
}));
app.post('/api/login',asyncHandler(async(req,res) => {
  const {email,senha} = req.body || {};
  const r = typeof email === 'string' && email.length <= 254
    ? await query('SELECT id,senha_hash FROM public.usuarios WHERE email=$1',[email.trim().toLowerCase()])
    : {rows:[]};
  const u = r.rows[0];
  const ok = await bcrypt.compare(typeof senha === 'string' ? senha : '',u ? u.senha_hash : HASH_FALSO);
  if (!u || !ok) return res.status(401).json({erro:'E-mail ou senha incorretos.'});
  await refreshSession(req,Number(u.id)); res.json({ok:true});
}));
app.post('/api/logout', (req,res,next) => {
  req.session.destroy(e => e ? next(e) : (res.clearCookie('mesa.sid',{sameSite:PRODUCAO?'none':'lax',secure:PRODUCAO}),res.json({ok:true})));
});
app.get('/api/eu',asyncHandler(async(req,res) => {
  const u = await atual(req);
  res.json({logado:!!u,email:u?.email||null,papel:u?.papel||null,restantes:await restantes(req,u)});
}));
app.post('/api/gerar',asyncHandler(async(req,res) => {
  const {genero,tom,ideia} = req.body || {};
  const jogadores=Number(req.body?.jogadores);
  if (!GENEROS.includes(genero)||!TONS.includes(tom)||!Number.isInteger(jogadores)||jogadores<1||jogadores>20) {
    return res.status(400).json({erro:'Dados inválidos.'});
  }
  const u=await atual(req);
  const key=quotaKey(req,u);
  const limit=u?5:1;
  const bypass=u?.papel==='admin';
  if (!bypass) {
    const claimed=await query(
      'INSERT INTO public.geracoes_limite(identificador,total) VALUES($1,1) ON CONFLICT(identificador) DO UPDATE SET total=public.geracoes_limite.total+1 WHERE public.geracoes_limite.total<$2 RETURNING total',
      [key,limit]);
    if (!claimed.rowCount) return res.status(403).json({erro:u?'Você usou todas as gerações de hoje.':'O teste grátis acabou. Crie uma conta para continuar.',codigo:u?'limite_diario':'limite_visitante'});
  }
  try {
    const aventura=await gerarAventura({genero,tom,jogadores,ideia:typeof ideia==='string'?ideia.trim().slice(0,200):''});
    if (u) await query('INSERT INTO public.aventuras(usuario_id,genero,tom,jogadores,conteudo) VALUES($1,$2,$3,$4,$5::jsonb)',
      [u.id,genero,tom,jogadores,JSON.stringify(aventura)]);
    res.json({aventura,restantes:await restantes(req,u)});
  } catch(e) {
    if (!bypass) await query('UPDATE public.geracoes_limite SET total=GREATEST(0,total-1) WHERE identificador=$1',[key]).catch(err=>console.error('Falha ao devolver cota',err.code));
    throw e;
  }
}));
app.get('/api/aventuras',asyncHandler(async(req,res)=>{
  const u=await atual(req);
  if (!u) return res.status(401).json({erro:'Entre para ver seu histórico.'});
  const r=await query('SELECT id,genero,tom,jogadores,conteudo,criado_em FROM public.aventuras WHERE usuario_id=$1 ORDER BY id DESC LIMIT 30',[u.id]);
  res.json(r.rows);
}));
app.delete('/api/aventuras/:id',asyncHandler(async(req,res)=>{
  const u=await atual(req);
  if(!u) return res.status(401).json({erro:'Entre para continuar.'});
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1) return res.status(400).json({erro:'Pedido inválido.'});
  await query('DELETE FROM public.aventuras WHERE id=$1 AND usuario_id=$2',[id,u.id]);
  res.json({ok:true});
}));
app.get('/api/admin/resumo',asyncHandler(async(req,res)=>{
  const u=await atual(req);
  if(u?.papel!=='admin') return res.status(403).json({erro:'Acesso negado.'});
  const r=await query("SELECT (SELECT COUNT(*) FROM public.usuarios)::int AS usuarios,(SELECT COUNT(*) FROM public.aventuras)::int AS aventuras,(SELECT COUNT(*) FROM public.aventuras WHERE criado_em::date=(now() AT TIME ZONE 'UTC')::date)::int AS hoje");
  res.json({usuarios:r.rows[0].usuarios,aventuras:r.rows[0].aventuras,aventurasHoje:r.rows[0].hoje});
}));
app.use('/api',(req,res)=>res.status(404).json({erro:'Rota não encontrada.'}));
app.use((err,req,res,next)=>{
  console.error('Mesa API error:',err.code||err.message);
  if(res.headersSent) return next(err);
  res.status(500).json({erro:'Não foi possível concluir a solicitação agora.'});
});
if (require.main === module) app.listen(process.env.PORT||3000,()=>console.log('Mesa API pronta.'));
module.exports=app;
