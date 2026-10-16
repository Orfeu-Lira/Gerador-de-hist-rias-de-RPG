// app.js — a parte que roda no NAVEGADOR. Ela só cuida da tela.
// Todas as regras de verdade (limites, permissões) ficam no servidor.
const $ = (id) => document.getElementById(id);
const API_BASE_URL = (window.MESA_CONFIG && window.MESA_CONFIG.apiBaseUrl || '').replace(/\/+$/, '');
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
  if (!API_BASE_URL) throw new Error('Configure a URL do backend em config.js antes de usar a API.');
  const r = await fetch(API_BASE_URL + url, {
    method: metodo,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(dados.erro || 'Algo deu errado.'), { dados });
  return dados;
}

function aviso(texto, bom) { const a = $('aviso'); a.textContent = texto || ''; a.className = bom ? 'bom' : ''; }

// ---- Navegação entre telas ----
const TELAS = ['gerador', 'dados', 'historico', 'personagens', 'assistente', 'conta', 'admin'];
function mostrar(tela) {
  document.body.classList.toggle('tela-acesso', tela === 'conta');
  TELAS.forEach((t) => { $('v-' + t).hidden = t !== tela; });
  document.querySelectorAll('#nav button[data-tela]').forEach((b) => b.setAttribute('aria-current', b.dataset.tela === tela));
  aviso('');
  if (tela === 'historico') carregarHistorico();
  if (tela === 'personagens') { carregarAventurasDaFicha().then(carregarPersonagens); }
  if (tela === 'admin') carregarResumo();
}

function montarNav() {
  const nav = $('nav');
  nav.replaceChildren();
  const itens = [['gerador', '✦', 'Gerador'], ['dados', '◇', 'Dados']];
  if (eu.logado) itens.push(['historico', '▤', 'Histórico'], ['personagens', '♙', 'Personagens'], ['assistente', '✧', 'Tutor D&D']);
  if (eu.papel === 'admin') itens.push(['admin', '⚙', 'Painel']);
  if (!eu.logado) itens.push(['conta', '↪', 'Entrar']);
  itens.forEach(([t, simbolo, nome]) => { const b = el('button', simbolo + '   ' + nome); b.dataset.tela = t; b.onclick = () => mostrar(t); nav.appendChild(b); });
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

// ---- Dados e tutorial para iniciantes ----
$('abrir-guia-dados').onclick = () => {
  const painel = $('guia-dados');
  painel.hidden = !painel.hidden;
  $('abrir-guia-dados').setAttribute('aria-expanded', String(!painel.hidden));
  $('abrir-guia-dados').textContent = painel.hidden ? 'Ver tutorial dos dados ↓' : 'Fechar tutorial ↑';
};
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

// Cenários e especialidades NARRATIVAS: não são classes, talentos ou proficiências oficiais.
const contextosDnd = {
  'Piratas e mares': {
    papeis: ['Capitão', 'Navegador', 'Artilheiro', 'Médico de bordo', 'Espião do porto', 'Caçador de tesouros'],
    dicas: {
      'Capitão': ['Bardo','Paladino','Guerreiro'], 'Navegador':['Patrulheiro','Druida','Ladino'],
      'Artilheiro':['Guerreiro','Patrulheiro'], 'Médico de bordo':['Clérigo','Druida','Bardo'],
      'Espião do porto':['Ladino','Bardo'], 'Caçador de tesouros':['Ladino','Patrulheiro']
    }, texto:'Uma tripulação pode contar com líder, navegação, combate, cura ou investigação. Essas funções são opções de história, não regras de classe.'
  },
  'Fantasia épica': {
    papeis:['Cavaleiro', 'Guardião', 'Batedor', 'Diplomata', 'Erudito arcano', 'Curandeiro itinerante'],
    dicas:{'Cavaleiro':['Paladino','Guerreiro'],'Guardião':['Guerreiro','Bárbaro'],'Batedor':['Patrulheiro','Ladino'],'Diplomata':['Bardo','Paladino'],'Erudito arcano':['Mago','Feiticeiro'],'Curandeiro itinerante':['Clérigo','Druida']},
    texto:'Escolha uma função no reino ou na jornada para dar personalidade ao herói.'
  },
  'Fantasia sombria': {
    papeis:['Caçador de monstros', 'Ocultista', 'Inquisidor', 'Sobrevivente', 'Médico de campanha', 'Investigador de maldições'],
    dicas:{'Caçador de monstros':['Patrulheiro','Guerreiro'],'Ocultista':['Bruxo','Mago'],'Inquisidor':['Clérigo','Paladino'],'Sobrevivente':['Ladino','Bárbaro'],'Médico de campanha':['Clérigo','Druida'],'Investigador de maldições':['Mago','Ladino']},
    texto:'A especialidade descreve o papel do personagem perante os perigos, não concede poderes extras.'
  },
  'Investigação': {
    papeis:['Detetive', 'Infiltrador', 'Perito', 'Interrogador', 'Pesquisador', 'Protetor da equipe'],
    dicas:{'Detetive':['Ladino','Patrulheiro'],'Infiltrador':['Ladino','Monge'],'Perito':['Mago','Ladino'],'Interrogador':['Bardo','Paladino'],'Pesquisador':['Mago','Clérigo'],'Protetor da equipe':['Guerreiro','Paladino']},
    texto:'Um mistério funciona melhor com perfis complementares de análise, exploração e negociação.'
  },
  'Terror': {
    papeis:['Sobrevivente', 'Especialista em rituais', 'Protetor', 'Investigador', 'Socorrista', 'Explorador de ruínas'],
    dicas:{'Sobrevivente':['Ladino','Patrulheiro'],'Especialista em rituais':['Clérigo','Mago'],'Protetor':['Guerreiro','Paladino'],'Investigador':['Ladino','Mago'],'Socorrista':['Clérigo','Bardo'],'Explorador de ruínas':['Patrulheiro','Druida']},
    texto:'Destaque o papel dramático de cada pessoa do grupo para criar tensão e cooperação.'
  },
  'Ficção científica': {
    papeis:['Piloto', 'Engenheiro', 'Diplomata', 'Batedor', 'Médico', 'Oficial de segurança'],
    dicas:{'Piloto':['Ladino','Patrulheiro'],'Engenheiro':['Mago','Ladino'],'Diplomata':['Bardo','Paladino'],'Batedor':['Patrulheiro','Monge'],'Médico':['Clérigo','Druida'],'Oficial de segurança':['Guerreiro','Paladino']},
    texto:'Tema futurista com adaptação narrativa de D&D 2024. Tecnologia, armas de fogo e veículos precisam de regras específicas aprovadas pelo mestre.'
  }
};
let aventurasFicha = [];
function definirOpcoes(select, valores, vazio) {
  select.replaceChildren(new Option(vazio,''));
  for (const valor of valores) select.appendChild(new Option(valor,valor));
}
definirOpcoes($('p-cenario'),Object.keys(contextosDnd),'Escolha um cenário');
function atualizarContextoDnd() {
  const contexto=contextosDnd[$('p-cenario').value];
  const atual=$('p-especialidade').value;
  definirOpcoes($('p-especialidade'),contexto?.papeis||[],'Escolha a especialidade');
  if (contexto?.papeis.includes(atual)) $('p-especialidade').value=atual;
  atualizarRecomendacaoNarrativa();
}
// Fantasia usa as classes e atributos D&D 2024. Outros gêneros usam só papel narrativo.
const generosNarrativos = new Set(['Piratas e mares','Investigação','Terror','Ficção científica']);
const fichaNarrativa = () => generosNarrativos.has($('p-cenario').value);
function atualizarModoFicha() {
  const narrativa=fichaNarrativa();
  const fantasia=['Fantasia épica','Fantasia sombria'].includes($('p-cenario').value);
  for(const campo of document.querySelectorAll('.campo-dnd')) campo.hidden=!fantasia;
  $('p-regras-dnd').hidden=!fantasia;
  $('p-perfil-narrativo').hidden=!narrativa;
  $('campo-especialidade').hidden=!narrativa;
  $('p-selecione-cenario').hidden=Boolean(fantasia||narrativa);
  $('campo-funcao').hidden=true;
  if(narrativa) {
    $('p-classe').value='';
    $('p-nivel').value=1;
    $('p-especie').value='';
    $('p-antecedente').value='';
  }
  atualizarSugestaoClasse();
  atualizarPontosDnd();
}
function atualizarRecomendacaoNarrativa(){
  const contexto=contextosDnd[$('p-cenario').value];
  const especialidade=$('p-especialidade').value;
  const narrativa=fichaNarrativa();
  let texto=contexto?.texto||'Escolha uma aventura ou cenário para definir seu personagem.';
  if(narrativa) texto=especialidade
    ? 'Seu papel na história é '+especialidade+'. '+texto+' Esse papel não impõe uma classe de D&D.'
    : 'Escolha uma especialidade da história. '+texto;
  else if(contexto) texto='Esta aventura usa o caminho D&D 2024. Escolha sua classe acima; não precisa selecionar outra especialidade.';
  $('p-contexto').textContent=texto;
  $('p-aplicar-contexto').hidden=true;
  $('p-aplicar-contexto').disabled=true;
  atualizarModoFicha();
}
$('p-cenario').onchange=atualizarContextoDnd;
$('p-especialidade').onchange=atualizarRecomendacaoNarrativa;
$('p-aventura').onchange=()=>{
  const a=aventurasFicha.find(x=>String(x.id)===$('p-aventura').value);
  if (a && contextosDnd[a.genero]) {
    $('p-cenario').value=a.genero;
    atualizarContextoDnd();
  }
};
async function carregarAventurasDaFicha(){
  const op=$('p-aventura');
  const escolhido=op.value;
  try{
    aventurasFicha=await api('/api/aventuras');
    op.replaceChildren(new Option('Nenhuma aventura vinculada',''));
    for(const a of aventurasFicha) op.appendChild(new Option((a.conteudo?.titulo||a.genero||'Aventura').slice(0,70),String(a.id)));
    if([...op.options].some(o=>o.value===escolhido))op.value=escolhido;
  }catch(e){aventurasFicha=[];op.replaceChildren(new Option('Aventuras indisponíveis',''));}
}

// ---- Fichas D&D 5e 2024: atributos-base e compra com 27 pontos ----
const atributosDnd = [['for','Força'],['des','Destreza'],['con','Constituição'],['int','Inteligência'],['sab','Sabedoria'],['car','Carisma']];
const custosDnd = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
let fichaAbertaId = null;
const pontosDnd = () => atributosDnd.reduce((s,[sigla]) => s + custosDnd[Number($('at-'+sigla).value)],0);
const modDnd = n => Math.floor((n - 10)/2);
// Dados de vida do D&D 5e revisado 2024 (classe única; avanço com valor fixo).
const classesVidaDnd = {
  'Bárbaro':[12,7], 'Guerreiro':[10,6], 'Paladino':[10,6], 'Patrulheiro':[10,6],
  'Bardo':[8,5], 'Clérigo':[8,5], 'Druida':[8,5], 'Monge':[8,5],
  'Ladino':[8,5], 'Bruxo':[8,5], 'Feiticeiro':[6,4], 'Mago':[6,4]
};
// Sugestões não obrigatórias: distribuição padrão da criação 2024 (15,14,13,12,10,8).
// Ordem: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma.
const sugestoesDnd = {
  'Bárbaro':   {valores:[15,13,14,10,12,8], dica:'Força para ataques e Constituição para resistência. Destreza também ajuda na defesa.'},
  'Bardo':     {valores:[8,14,12,13,10,15], dica:'Carisma melhora a conjuração e habilidades sociais. Destreza é útil para defesa.'},
  'Clérigo':   {valores:[14,8,13,10,15,12], dica:'Sabedoria alimenta suas magias. Força pode ajudar clérigos mais voltados ao combate físico.'},
  'Druida':    {valores:[8,12,14,13,15,10], dica:'Sabedoria impulsiona as magias; Constituição ajuda a suportar danos e a manter concentração.'},
  'Guerreiro': {valores:[15,14,13,8,10,12], dica:'Força favorece uma construção corpo a corpo; guerreiros de arco ou armas de Finesse podem preferir Destreza.'},
  'Monge':     {valores:[12,15,13,10,14,8], dica:'Destreza é central para ataques e defesa; Sabedoria também é importante para várias habilidades de monge.'},
  'Paladino':  {valores:[15,10,13,8,12,14], dica:'Força favorece combate com armas e Carisma sustenta suas habilidades mágicas.'},
  'Patrulheiro':{valores:[12,15,13,8,14,10], dica:'Destreza costuma ajudar nos ataques; Sabedoria apoia conjuração e percepção.'},
  'Ladino':    {valores:[12,15,13,14,10,8], dica:'Destreza facilita ataques com armas adequadas, furtividade e defesa. Inteligência ajuda em perícias investigativas.'},
  'Feiticeiro':{valores:[10,13,14,8,12,15], dica:'Carisma é o atributo mágico principal. Constituição ajuda a resistir e a manter a concentração.'},
  'Bruxo':     {valores:[8,14,13,12,10,15], dica:'Carisma é a principal escolha mágica. Destreza e Constituição contribuem para a sobrevivência.'},
  'Mago':      {valores:[8,12,13,15,14,10], dica:'Inteligência é essencial às magias de mago. Constituição e Destreza ajudam na sobrevivência.'}
};
function atualizarSugestaoClasse() {
  const classe = $('p-classe').value;
  const sugerida = sugestoesDnd[classe];
  $('p-aplicar-sugestao').disabled = fichaNarrativa() || !sugerida;
  $('p-recomendacao').textContent = sugerida
    ? sugerida.dica+' A sugestão usa os 27 pontos e ainda não inclui bônus de antecedente. Você pode modificá-la.'
    : 'Escolha uma classe para ver os atributos que vale a pena priorizar.';
}
$('p-aplicar-sugestao').onclick = () => {
  const classe = $('p-classe').value;
  const sugerida = sugestoesDnd[classe];
  if (fichaNarrativa() || !sugerida) return;
  const atual = atributosDnd.map(([sigla]) => Number($('at-'+sigla).value));
  if (atual.some((valor,i) => valor !== 8 && valor !== sugerida.valores[i]) &&
      !confirm('Aplicar a sugestão substituirá os atributos atuais. Continuar?')) return;
  atributosDnd.forEach(([sigla],i) => { $('at-'+sigla).value = String(sugerida.valores[i]); });
  atualizarPontosDnd();
};
$('p-classe').addEventListener('change', atualizarSugestaoClasse);
function atualizarResumoDnd() {
  const gastos = pontosDnd();
  $('p-gastos').textContent = gastos + ' / 27';
  const nivel = Number($('p-nivel').value);
  $('p-proficiencia').textContent = Number.isInteger(nivel) && nivel>=1 && nivel<=20
    ? '+' + (2 + Math.floor((nivel-1)/4)) : '—';
  const config = classesVidaDnd[$('p-classe').value];
  const pv = $('p-pv'), dado = $('p-dado-vida'), nota = $('p-pv-nota');
  if (!config || !Number.isInteger(nivel) || nivel<1 || nivel>20) {
    pv.textContent = 'Selecione classe e nível'; dado.textContent='—';
    nota.textContent = 'Escolha uma das classes disponíveis e um nível de 1 a 20.';
    return;
  }
  const [faces,fixo] = config;
  const con = Number($('at-con').value);
  const mod = modDnd(con);
  const vidaInicial = Math.max(1,faces+mod);
  const porNivel = Math.max(1,fixo+mod);
  pv.textContent = String(vidaInicial + (nivel-1)*porNivel);
  dado.textContent='d'+faces;
  nota.textContent = 'PV: '+vidaInicial+' no nível 1 + '+(nivel-1)+' × '+porNivel+' por nível seguinte. CON '+con+' (modificador '+(mod>=0?'+':'')+mod+'). Cálculo base, sem talentos, bônus de antecedente, multiclasses ou rolagens de PV.';
}
$('p-classe').addEventListener('change',atualizarResumoDnd);
$('p-nivel').addEventListener('input',atualizarResumoDnd);
function atualizarPontosDnd() {
  const usados = pontosDnd();
  const restante = 27-usados;
  $('p-pontos').textContent = usados + ' gastos • ' + restante + ' restantes';
  $('p-pontos').classList.toggle('invalido', restante < 0);
  for(const [sigla] of atributosDnd) {
    const valor = Number($('at-'+sigla).value);
    $('mod-'+sigla).textContent = 'Mod. '+(modDnd(valor)>=0?'+':'')+modDnd(valor);
  }
  $('f-personagem').querySelector('button[type="submit"]').disabled = restante < 0 || !$('p-cenario').value;
  atualizarResumoDnd();
}
for (const [sigla,nome] of atributosDnd) {
  const item=el('div','','atributo-item');
  const rotulo=el('label',nome);
  rotulo.htmlFor='at-'+sigla;
  const campo=document.createElement('select');campo.id='at-'+sigla;
  for(let n=8;n<=15;n++){const opt=new Option(n+' • '+custosDnd[n]+' pt'+(custosDnd[n]!==1?'s':''),String(n));campo.appendChild(opt);}
  campo.value='8';campo.onchange=atualizarPontosDnd;
  const modificador=el('span','Mod. -1','atributo-mod');modificador.id='mod-'+sigla;
  item.append(rotulo,campo,modificador);$('p-atributos').appendChild(item);
}
function limparFicha(){
  fichaAbertaId=null;
  $('f-personagem').reset();
  atributosDnd.forEach(([sigla])=>$('at-'+sigla).value='8');
  $('ficha-form-titulo').textContent='Nova personagem';
  $('p-remover').hidden=true;
  atualizarPontosDnd();
  atualizarSugestaoClasse();
  $('p-cenario').value='';atualizarContextoDnd();$('p-aventura').value='';$('p-funcao').value='';
}
$('nova-ficha').onclick=limparFicha;
async function carregarPersonagens(){
  const lista=$('personagens-lista');lista.replaceChildren();
  try{
    const itens=await api('/api/personagens');
    if(!itens.length){lista.appendChild(el('p','Nenhuma ficha salva ainda. Comece criando sua primeira personagem.','suave'));return;}
    for(const item of itens) {
      const botao=el('button',(item.nome||'Personagem')+(item.dados.metodo==='livre'?' · '+(item.dados.especialidade||'Narrativa'):' · Nível '+item.dados.nivel),'personagem-item');
      botao.type='button';
      botao.onclick=()=>{
        fichaAbertaId=item.id;
        const d=item.dados;
        $('p-nome').value=d.nome||'';
        $('p-classe').value=d.classe||'';
        $('p-especie').value=d.especie||'';
        $('p-antecedente').value=d.antecedente||'';
        $('p-nivel').value=d.nivel||1;
        $('p-notas').value=d.notas||'';
        $('p-cenario').value=contextosDnd[d.cenario]?d.cenario:'';
        atualizarContextoDnd();
        $('p-especialidade').value=contextosDnd[d.cenario]?.papeis.includes(d.especialidade)?d.especialidade:'';
        $('p-funcao').value=d.funcao||'';
        $('p-aventura').value=String(d.aventuraId||'');
        atualizarRecomendacaoNarrativa();
        for(const [sigla] of atributosDnd) $('at-'+sigla).value=String(d.atributos?.[sigla]||8);
        $('ficha-form-titulo').textContent='Editar personagem';
        $('p-remover').hidden=false;
        atualizarPontosDnd();
        atualizarSugestaoClasse();
        $('f-personagem').scrollIntoView({behavior:'smooth',block:'start'});
      };
      lista.appendChild(botao);
    }
  }catch(e){aviso(e.message);}
}
$('f-personagem').onsubmit=async ev=>{
  ev.preventDefault();
  const narrativa=fichaNarrativa();
  if(!$('p-cenario').value){aviso('Escolha primeiro o cenário da personagem.');return;}
  if(!narrativa && pontosDnd()>27){aviso('Você ultrapassou 27 pontos. Ajuste os atributos.');return;}
  if(narrativa && !$('p-especialidade').value){aviso('Selecione a especialidade da personagem neste cenário.');return;}
  const dados={
    edicao:narrativa?'narrativo':'2024',metodo:narrativa?'livre':'compra27',
    nome:$('p-nome').value.trim(),classe:narrativa?'':$('p-classe').value.trim(),
    especie:narrativa?'':$('p-especie').value.trim(),antecedente:narrativa?'':$('p-antecedente').value.trim(),
    nivel:narrativa?1:Number($('p-nivel').value),notas:$('p-notas').value.trim(),
    cenario:$('p-cenario').value,especialidade:narrativa?$('p-especialidade').value:'',
    funcao:'',aventuraId:$('p-aventura').value?Number($('p-aventura').value):null
  };
  if(!narrativa){
    dados.atributos={};
    for(const [sigla] of atributosDnd)dados.atributos[sigla]=Number($('at-'+sigla).value);
  }
  const botao=$('f-personagem').querySelector('button[type="submit"]');botao.disabled=true;
  try{
    await api(fichaAbertaId?'/api/personagens/'+fichaAbertaId:'/api/personagens',fichaAbertaId?'PUT':'POST',{dados});
    aviso('Ficha salva com sucesso!',true);
    limparFicha();await carregarPersonagens();
  }catch(e){aviso(e.message);}
  finally{botao.disabled=false;}
};
$('p-remover').onclick=async()=>{
  if(!fichaAbertaId || !confirm('Excluir permanentemente esta ficha?'))return;
  try{await api('/api/personagens/'+fichaAbertaId,'DELETE');limparFicha();await carregarPersonagens();aviso('Ficha excluída.',true);}
  catch(e){aviso(e.message);}
};
atualizarPontosDnd();
atualizarSugestaoClasse();
atualizarContextoDnd();
// ---- Tutor com IA, sem execução automática de mudanças nas fichas ----
$('f-ajuda-dnd').onsubmit=async ev=>{
  ev.preventDefault();
  const botao=$('ajuda-enviar');botao.disabled=true;
  const alvo=$('resposta-dnd');alvo.textContent='Consultando o tutor...';
  try{
    const r=await api('/api/dnd/ajuda','POST',{pergunta:$('pergunta-dnd').value.trim()});
    alvo.textContent=r.resposta;
  }catch(e){alvo.textContent=e.message;}
  finally{botao.disabled=false;}
};

// ---- Conta e recuperação de acesso ----
const formulariosConta = ['f-login','f-cadastro','f-recuperar','f-redefinir'];
function abrirFormularioConta(id) {
  formulariosConta.forEach(chave => { $(chave).hidden = chave !== id; });
}
function limparTokenDaUrl() {
  const u = new URL(window.location.href);
  if (u.searchParams.has('reset_token')) {
    u.searchParams.delete('reset_token');
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }
}
$('voltar-inicio').onclick = () => { limparTokenDaUrl(); abrirFormularioConta('f-login'); mostrar('gerador'); };
$('ir-cadastro').onclick = () => abrirFormularioConta('f-cadastro');
$('ir-login').onclick = () => abrirFormularioConta('f-login');
$('ir-recuperar').onclick = () => { $('r-email').value = $('l-email').value; abrirFormularioConta('f-recuperar'); aviso(''); };
$('recuperar-voltar').onclick = () => { abrirFormularioConta('f-login'); aviso(''); };
$('redefinir-voltar').onclick = () => { limparTokenDaUrl(); abrirFormularioConta('f-login'); aviso(''); };
$('f-recuperar').onsubmit = async ev => {
  ev.preventDefault();
  const botao = $('f-recuperar').querySelector('button[type="submit"]');
  botao.disabled = true;
  try {
    const resultado = await api('/api/senha/solicitar', 'POST', { email: $('r-email').value.trim() });
    aviso(resultado.mensagem || 'Se houver uma conta, enviaremos as instruções por e-mail.', true);
  } catch (e) { aviso(e.message); }
  finally { botao.disabled = false; }
};
$('f-redefinir').onsubmit = async ev => {
  ev.preventDefault();
  if ($('nova-senha').value !== $('nova-senha-confirmacao').value) { aviso('As senhas digitadas não coincidem.'); return; }
  const botao = $('f-redefinir').querySelector('button[type="submit"]');
  botao.disabled = true;
  try {
    await api('/api/senha/redefinir', 'POST', { token: new URL(location.href).searchParams.get('reset_token'), senha: $('nova-senha').value });
    $('nova-senha').value = ''; $('nova-senha-confirmacao').value = '';
    limparTokenDaUrl(); abrirFormularioConta('f-login');
    aviso('Senha atualizada. Entre com sua nova senha.', true);
  } catch (e) { aviso(e.message); }
  finally { botao.disabled = false; }
};
async function entrar(url, email, senha, tokenBootstrap) {
  try { await api(url, 'POST', { email, senha, ...(tokenBootstrap ? { tokenBootstrap } : {}) }); await atualizarEu(); mostrar('gerador'); aviso('Tudo certo!', true); }
  catch (e) { aviso(e.message); }
  finally { if (tokenBootstrap) $('c-token-bootstrap').value = ''; }
}
$('f-login').onsubmit = (ev) => { ev.preventDefault(); entrar('/api/login', $('l-email').value, $('l-senha').value); };
$('f-cadastro').onsubmit = (ev) => { ev.preventDefault(); entrar('/api/cadastro', $('c-email').value, $('c-senha').value, $('c-token-bootstrap').value); };

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

atualizarEu().then(() => {
  if (new URL(location.href).searchParams.has('reset_token')) {
    abrirFormularioConta('f-redefinir'); mostrar('conta');
  } else mostrar('gerador');
}).catch((e) => {
  montarNav();
  if (new URL(location.href).searchParams.has('reset_token')) {
    abrirFormularioConta('f-redefinir'); mostrar('conta');
  }
  aviso(e.message);
});
