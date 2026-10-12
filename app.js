// app.js — a parte que roda no NAVEGADOR. Ela só cuida da tela.
// Todas as regras de verdade (limites, permissões) ficam no servidor.
const $ = (id) => document.getElementById(id);
const GENEROS = ['Fantasia sombria', 'Fantasia épica', 'Ficção científica', 'Terror', 'Investigação', 'Piratas e mares'];
const TONS = ['Misterioso', 'Aventureiro', 'Sombrio', 'Leve e bem-humorado', 'Tenso'];
let eu = { logado: false };

// Cria um elemento com texto. Usar textContent (e não innerHTML) impede que
// um texto malicioso vire código na página (XSS).
function el(tag, texto, classe) {
  const e = document.createElement(tag);
  if (texto) e.textContent = texto;
  if (classe) e.className = classe;
  return e;
}

async function api(url, metodo = 'GET', corpo) {
  const r = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(dados.erro || 'Algo deu errado.'), { dados });
  return dados;
}

function aviso(texto, bom) { const a = $('aviso'); a.textContent = texto || ''; a.className = bom ? 'bom' : ''; }

// ---- Navegação entre telas ----
const TELAS = ['gerador', 'dados', 'historico', 'conta', 'admin'];
function mostrar(tela) {
  TELAS.forEach((t) => { $('v-' + t).hidden = t !== tela; });
  document.querySelectorAll('#nav button[data-tela]').forEach((b) => b.setAttribute('aria-current', b.dataset.tela === tela));
  aviso('');
  if (tela === 'historico') carregarHistorico();
  if (tela === 'admin') carregarResumo();
}

function montarNav() {
  const nav = $('nav');
  nav.replaceChildren();
  const itens = [['gerador', 'Gerador'], ['dados', 'Dados']];
  if (eu.logado) itens.push(['historico', 'Histórico']);
  if (eu.papel === 'admin') itens.push(['admin', 'Painel']);
  if (!eu.logado) itens.push(['conta', 'Entrar']);
  itens.forEach(([t, nome]) => { const b = el('button', nome); b.dataset.tela = t; b.onclick = () => mostrar(t); nav.appendChild(b); });
  if (eu.logado) {
    const s = el('button', 'Sair');
    s.onclick = async () => { await api('/api/logout', 'POST'); await atualizarEu(); mostrar('gerador'); };
    nav.appendChild(s);
  }
}

function textoInfo() {
  if (!eu.logado) return eu.restantes > 0 ? 'Teste grátis: ' + eu.restantes + ' geração. Crie uma conta para ter mais.' : 'O teste grátis acabou. Crie uma conta para continuar.';
  return eu.restantes === null ? 'Acesso total (administrador).' : 'Gerações restantes hoje: ' + eu.restantes;
}

async function atualizarEu() { eu = await api('/api/eu'); montarNav(); $('info').textContent = textoInfo(); }

// ---- Mostrar uma aventura na tela ----
function desenharAventura(a, alvo) {
  alvo.replaceChildren();
  const f = el('article', '', 'folha aventura');
  f.appendChild(el('h2', a.titulo || 'Aventura'));
  f.appendChild(el('p', a.gancho));
  if (a.locais && a.locais.length) { f.appendChild(el('h3', 'Locais')); const ul = el('ul'); a.locais.forEach((l) => ul.appendChild(el('li', l))); f.appendChild(ul); }
  if (a.npcs && a.npcs.length) { f.appendChild(el('h3', 'NPCs')); const ul = el('ul'); a.npcs.forEach((n) => ul.appendChild(el('li', n.nome + ': ' + n.descricao))); f.appendChild(ul); }
  if (a.vilao) { f.appendChild(el('h3', 'Vilão')); f.appendChild(el('p', a.vilao)); }
  if (a.trilha) { f.appendChild(el('h3', 'Trilha sonora')); f.appendChild(el('p', a.trilha)); }
  alvo.appendChild(f);
}

// ---- Gerador ----
GENEROS.forEach((g) => $('genero').appendChild(new Option(g, g)));
TONS.forEach((t) => $('tom').appendChild(new Option(t, t)));

$('f-gerar').onsubmit = async (ev) => {
  ev.preventDefault();
  $('b-gerar').disabled = true; aviso('Gerando...');
  try {
    const r = await api('/api/gerar', 'POST', {
      genero: $('genero').value, tom: $('tom').value,
      jogadores: Number($('jogadores').value), ideia: $('ideia').value
    });
    desenharAventura(r.aventura, $('saida'));
    await atualizarEu(); aviso('');
  } catch (e) {
    aviso(e.message);
    await atualizarEu();
  }
  $('b-gerar').disabled = false;
};

// ---- Dados ----
[4, 6, 8, 10, 12, 20, 100].forEach((lados) => {
  const b = el('button', 'd' + lados, 'dado');
  b.type = 'button';
  b.onclick = () => {
    const q = Math.min(20, Math.max(1, parseInt($('qtd').value, 10) || 1));
    const v = Array.from({ length: q }, () => 1 + Math.floor(Math.random() * lados));
    $('total').textContent = v.reduce((a, c) => a + c, 0);
    $('detalhe').textContent = q + 'd' + lados + ': ' + v.join(' + ');
  };
  $('dados').appendChild(b);
});

// ---- Histórico ----
async function carregarHistorico() {
  const lista = $('lista'); lista.replaceChildren(); $('saida-hist').replaceChildren();
  try {
    const itens = await api('/api/aventuras');
    if (!itens.length) { lista.appendChild(el('p', 'Nenhuma aventura ainda. Gere a primeira no Gerador.')); return; }
    itens.forEach((i) => {
      const linha = el('div', '', 'item');
      const abrir = el('button', (i.conteudo.titulo || 'Aventura') + ' (' + i.criado_em.slice(0, 10) + ')', 'abrir');
      abrir.onclick = () => desenharAventura(i.conteudo, $('saida-hist'));
      const apagar = el('button', 'Apagar', 'apagar');
      apagar.onclick = async () => { if (confirm('Apagar esta aventura?')) { await api('/api/aventuras/' + i.id, 'DELETE'); carregarHistorico(); } };
      linha.append(abrir, apagar); lista.appendChild(linha);
    });
  } catch (e) { aviso(e.message); }
}

// ---- Conta ----
$('ir-cadastro').onclick = () => { $('f-login').hidden = true; $('f-cadastro').hidden = false; };
$('ir-login').onclick = () => { $('f-cadastro').hidden = true; $('f-login').hidden = false; };
async function entrar(url, email, senha) {
  try { await api(url, 'POST', { email, senha }); await atualizarEu(); mostrar('gerador'); aviso('Tudo certo!', true); }
  catch (e) { aviso(e.message); }
}
$('f-login').onsubmit = (ev) => { ev.preventDefault(); entrar('/api/login', $('l-email').value, $('l-senha').value); };
$('f-cadastro').onsubmit = (ev) => { ev.preventDefault(); entrar('/api/cadastro', $('c-email').value, $('c-senha').value); };

// ---- Painel do dono ----
async function carregarResumo() {
  const alvo = $('resumo'); alvo.replaceChildren();
  try {
    const r = await api('/api/admin/resumo');
    alvo.appendChild(el('h2', 'Resumo'));
    alvo.appendChild(el('p', 'Usuários: ' + r.usuarios));
    alvo.appendChild(el('p', 'Aventuras geradas: ' + r.aventuras + ' (hoje: ' + r.aventurasHoje + ')'));
  } catch (e) { aviso(e.message); }
}

atualizarEu().then(() => mostrar('gerador'));
