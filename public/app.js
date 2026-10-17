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
  if (a.trilha) {
    f.appendChild(el('h3','Trilha sonora'));
    f.appendChild(el('p',a.trilha));
    const musica=el('section','','musica-recomendacao');
    musica.appendChild(el('p','Busque trilhas para a atmosfera da aventura. Links de busca disponíveis mesmo sem IA ou login.','suave'));
    // Links são PESQUISAS, não faixas verificadas. Não dependem da API Gemini.
    const termos=('RPG instrumental ambience playlist '+a.trilha).slice(0,170);
    const opcoes=el('div','','musica-buscas');
    for(const [nome,base] of [
      ['♫ Pesquisar no YouTube','https://www.youtube.com/results?search_query='],
      ['♫ Pesquisar no Spotify','https://open.spotify.com/search/'],
      ['⌕ Pesquisar no Google','https://www.google.com/search?q=']
    ]){
      const link=el('a',nome,'guia-abrir');
      link.href=base+encodeURIComponent(termos);
      link.target='_blank';
      link.rel='noopener noreferrer';
      opcoes.appendChild(link);
    }
    musica.appendChild(opcoes);
    musica.appendChild(el('p','Esses botões abrem buscas com termos sugeridos pelo Mesa; não são links de músicas verificadas.','suave'));
    const botao=el('button','✦ Refinar trilha com pesquisa por IA','guia-abrir');
    botao.type='button';
    const resultado=el('div','','musica-links');
    resultado.setAttribute('aria-live','polite');
    botao.onclick=async()=>{
      if(!eu.logado){
        resultado.replaceChildren(el('p','A pesquisa com IA requer login. Você já pode usar os três links de busca acima.','suave'));
        return;
      }
      botao.disabled=true;
      resultado.replaceChildren(el('p','Pesquisando playlists com a IA...','suave'));
      try{
        const dados=await api('/api/musicas','POST',{estilo:a.trilha,titulo:a.titulo||''});
        resultado.replaceChildren();
        if(dados.explicacao)resultado.appendChild(el('p',dados.explicacao));
        if(Array.isArray(dados.links)&&dados.links.length){
          const ul=el('ul');
          for(const item of dados.links){
            try{
              const url=new URL(item.url);
              if(url.protocol!=='https:')continue;
              const link=el('a',item.titulo||'Abrir resultado musical');
              link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
              const li=el('li');li.appendChild(link);ul.appendChild(li);
            }catch{}
          }
          resultado.appendChild(ul);
        }
        if(dados.aviso)resultado.appendChild(el('p',dados.aviso,'suave'));
      }catch(e){
        resultado.replaceChildren(el('p',e.message+' Você ainda pode pesquisar pelo YouTube, Spotify ou Google nos links acima.','suave'));
      }finally{botao.disabled=false;}
    };
    musica.append(botao,resultado);
    f.appendChild(musica);
  }
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
const kitsDnd={
'Bárbaro':['Arma marcial à escolha','Duas machadinhas ou arma simples','Mochila de aventureiro'],
'Bardo':['Instrumento musical','Arma simples','Armadura leve','Caderno de canções'],
'Bruxo':['Foco arcano ou bolsa de componentes','Arma simples','Armadura leve'],
'Clérigo':['Símbolo sagrado','Arma adequada à proficiência','Escudo se aplicável'],
'Druida':['Foco druídico','Cajado','Bolsa de ervas'],
'Feiticeiro':['Foco arcano ou componentes','Adaga','Bolsa de viagem'],
'Guerreiro':['Arma principal à escolha','Arma secundária','Armadura adequada à proficiência'],
'Ladino':['Arma de finesse ou à distância','Adaga','Ferramentas de ladrão','Armadura leve'],
'Mago':['Grimório','Foco arcano ou componentes','Adaga'],
'Monge':['Bastão ou arma simples apropriada','Roupas de viagem'],
'Paladino':['Arma marcial','Armadura adequada','Símbolo sagrado'],
'Patrulheiro':['Arma à distância ou duas armas leves','Armadura adequada','Kit de exploração']
};
const kitsPorPapel={
'Capitão':['Mapa náutico','Bússola','Luneta','Diário de bordo'],
'Navegador':['Bússola','Cartas náuticas','Sextante','Caderno de rotas'],
'Artilheiro':['Kit de manutenção de canhões','Ferramentas de carregamento','Caderno de munições'],
'Médico de bordo':['Estojo de primeiros socorros','Bandagens','Instrumentos médicos'],
'Espião do porto':['Documentos de cobertura','Kit de disfarce','Caderno codificado'],
'Caçador de tesouros':['Mapa antigo','Pá pequena','Corda e gancho'],
'Piloto':['Manual de navegação','Comunicador','Kit de emergência'],
'Engenheiro':['Ferramentas técnicas','Manual de manutenção','Peças de reposição'],
'Diplomata':['Credenciais','Comunicador ou pergaminhos','Caderno de acordos'],
'Batedor':['Binóculos','Mapa','Kit de sobrevivência'],
'Médico':['Estojo médico','Suprimentos de primeiros socorros'],
'Oficial de segurança':['Comunicador','Equipamento de proteção','Lanterna'],
'Detetive':['Bloco de anotações','Lupa','Lanterna'],
'Infiltrador':['Roupas discretas','Kit de disfarce'],
'Perito':['Maleta de análise','Luvas','Câmera'],
'Interrogador':['Gravador','Caderno de depoimentos'],
'Pesquisador':['Caderno de campo','Material de pesquisa'],
'Protetor da equipe':['Kit de proteção','Lanterna'],
'Sobrevivente':['Mochila de emergência','Cantil','Lanterna'],
'Especialista em rituais':['Anotações de símbolos','Velas','Kit de pesquisa'],
'Protetor':['Lanterna','Kit de sobrevivência'],
'Investigador':['Caderno de pistas','Equipamento fotográfico'],
'Socorrista':['Kit de primeiros socorros','Bolsa de suprimentos'],
'Explorador de ruínas':['Corda','Mapa','Lanterna'],
'Caçador de monstros':['Kit de rastreamento','Caderno de observações'],
'Ocultista':['Livro de símbolos','Kit de anotações'],
'Inquisidor':['Insígnia','Material de investigação'],
'Médico de campanha':['Bolsa de primeiros socorros','Bandagens'],
'Investigador de maldições':['Grimório de notas','Lanterna'],
'Cavaleiro':['Equipamento de montaria','Kit de manutenção'],
'Guardião':['Kit de vigia','Lanterna'],
'Erudito arcano':['Cadernos de estudo','Tinta e pena'],
'Curandeiro itinerante':['Bolsa de primeiros socorros','Ervas']
};
const kitPorCenario={
'Piratas e mares':['Cantil de água','Capa impermeável'],
'Fantasia épica':['Rações de viagem','Tocha ou lanterna'],
'Fantasia sombria':['Lanterna','Manta de viagem'],
'Investigação':['Bloco de pistas','Lanterna'],
'Terror':['Lanterna','Kit de emergência'],
'Ficção científica':['Comunicador do cenário','Identificação']
};
function sugerirEquipamentos(){
 const cenario=$('p-cenario').value, aventura=aventurasFicha.find(a=>String(a.id)===$('p-aventura').value);
 const nome=fichaNarrativa() ? $('p-especialidade').value : $('p-classe').value;
 const base=fichaNarrativa()?kitsPorPapel[nome]:kitsDnd[nome];
 if(!cenario || !base)return null;
 const itens=[...base,...(kitPorCenario[cenario]||[])];
 const local=aventura?.conteudo?.locais?.[0];
 if(typeof local==='string' && local.trim())itens.push('Anotações sobre '+local.trim().slice(0,70));
 return {itens:[...new Set(itens)],descricao:nome+' • '+cenario+(aventura?' • '+(aventura.conteudo?.titulo||'aventura'):'')};
}
function atualizarKit(){
 const kit=sugerirEquipamentos();
 $('p-gerar-kit').disabled=!kit;
 $('p-kit-origem').textContent=kit
 ? 'Sugestão para '+kit.descricao+'. Revise os itens com o mestre.'
 : 'Selecione cenário e classe ou especialidade para sugerir equipamentos.';
}
$('p-gerar-kit').onclick=()=>{
 const kit=sugerirEquipamentos();
 if(!kit)return;
 if($('p-equipamentos').value.trim()&&!confirm('Substituir os equipamentos atuais pela nova sugestão?'))return;
 $('p-equipamentos').value=kit.itens.join('\n');
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
  $('p-dnd-ressalva').hidden=!fantasia;
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
  atualizarKit();
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
  atualizarKit();
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
  atualizarKit();
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

// ---- Trilha ambiente: gravações medievais sob licenças Creative Commons ----
// As faixas permanecem hospedadas no Wikimedia Commons: crédito obrigatório e link ao original.
const trilhasAmbiente = {
  taverna:{
    titulo:'Medieval Story',artista:'Frank Schröter',licenca:'CC BY 4.0',
    fonte:'https://commons.wikimedia.org/wiki/File:Medieval_Story_by_Frank_Schr%C3%B6ter.ogg',
    audio:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Medieval_Story_by_Frank_Schr%C3%B6ter.ogg',
    termos:'Música medieval alegre, adequada à taverna'
  },
  floresta:{
    titulo:'Medieval Dream',artista:'Frank Schröter',licenca:'CC BY 4.0',
    fonte:'https://commons.wikimedia.org/wiki/File:Medieval_Dream_by_Frank_Schr%C3%B6ter.ogg',
    audio:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Medieval_Dream_by_Frank_Schr%C3%B6ter.ogg',
    termos:'Melodia medieval tranquila para exploração'
  },
  jornada:{
    titulo:'Chominciamento de Gioia',artista:'Ririkuku',licenca:'CC BY-SA 4.0',
    fonte:'https://commons.wikimedia.org/wiki/File:Chominciamento_de_Gioia1.ogg',
    audio:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chominciamento_de_Gioia1.ogg',
    termos:'Dança medieval com flautas, viela e percussão'
  }
};
const ambienteAudio=new Audio();
ambienteAudio.loop=true;
ambienteAudio.preload='none';
let ambienteFaixaAtiva=null;
function ambienteCreditos(){
  const dados=trilhasAmbiente[$('ambiente-estilo').value]||trilhasAmbiente.taverna;
  const caixa=$('ambiente-creditos');
  caixa.replaceChildren();
  caixa.append(document.createTextNode(dados.titulo+' — '+dados.artista+' · '+dados.licenca+' · '));
  const fonte=el('a','Fonte e licença ↗');fonte.href=dados.fonte;
  fonte.target='_blank';fonte.rel='noopener noreferrer';
  caixa.appendChild(fonte);
}
function ambienteParar(){
  ambienteAudio.pause();
  $('ambiente-tocar').textContent='▶ Tocar';
  $('ambiente-tocar').setAttribute('aria-pressed','false');
  $('ambiente-estado').textContent='Pausado. Clique em Tocar para continuar.';
}
function ambienteCarregar(){
  const key=$('ambiente-estilo').value;
  if(ambienteFaixaAtiva===key)return;
  ambienteAudio.pause();
  ambienteFaixaAtiva=key;
  ambienteAudio.src=trilhasAmbiente[key].audio;
  ambienteAudio.load();
  ambienteCreditos();
}
$('ambiente-tocar').onclick=async()=>{
  if(!ambienteAudio.paused){ambienteParar();return;}
  try{
    ambienteCarregar();
    await ambienteAudio.play();
    $('ambiente-tocar').textContent='❚❚ Pausar';
    $('ambiente-tocar').setAttribute('aria-pressed','true');
    $('ambiente-estado').textContent='Tocando: '+trilhasAmbiente[$('ambiente-estilo').value].titulo;
  }catch{
    ambienteParar();
    $('ambiente-estado').textContent='Não foi possível reproduzir a faixa online. Confira a conexão ou abra a fonte para ouvi-la.';
  }
};
$('ambiente-estilo').onchange=async()=>{
  try{localStorage.setItem('mesa-ambiente-estilo',$('ambiente-estilo').value);}catch{}
  const tocando=!ambienteAudio.paused;
  ambienteCarregar();
  if(tocando){
    try{await ambienteAudio.play();$('ambiente-tocar').textContent='❚❚ Pausar';$('ambiente-tocar').setAttribute('aria-pressed','true');}
    catch{ambienteParar();$('ambiente-estado').textContent='A faixa selecionada não pôde ser carregada.';}
  } else $('ambiente-estado').textContent='Pronto para tocar: '+trilhasAmbiente[$('ambiente-estilo').value].titulo;
};
$('ambiente-volume').oninput=()=>{
  ambienteAudio.volume=Number($('ambiente-volume').value)/100;
  try{localStorage.setItem('mesa-ambiente-volume',$('ambiente-volume').value);}catch{}
};
ambienteAudio.onerror=()=>{
  ambienteParar();
  $('ambiente-estado').textContent='Falha ao carregar o áudio do Wikimedia Commons. Você pode abrir a fonte no link ao lado.';
};
try{
  const estilo=localStorage.getItem('mesa-ambiente-estilo');
  if(Object.hasOwn(trilhasAmbiente,estilo))$('ambiente-estilo').value=estilo;
  const guardado=localStorage.getItem('mesa-ambiente-volume');
  if(guardado!==null&&Number.isFinite(Number(guardado)))$('ambiente-volume').value=String(Math.min(100,Math.max(0,Number(guardado))));
}catch{}
ambienteAudio.volume=Number($('ambiente-volume').value)/100;
ambienteCreditos();

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
// Avatares ficam em um bucket privado. Somente a própria conta pode carregá-los.
let avatarObjectUrl=null;
function limparPreviewAvatar(){
  if(avatarObjectUrl)URL.revokeObjectURL(avatarObjectUrl);
  avatarObjectUrl=null;
  $('p-avatar-img').removeAttribute('src');
  $('p-avatar-img').hidden=true;
  $('p-avatar-vazio').hidden=false;
  $('p-avatar-remover').hidden=true;
}
function atualizarEstadoAvatar(){
  const salvo=Boolean(fichaAbertaId);
  $('p-avatar-file').disabled=!salvo;
  $('p-avatar-info').textContent=salvo
    ? 'Envie um retrato. Ele será visível somente para você ao abrir esta ficha.'
    : 'Salve a ficha primeiro e reabra-a para enviar um avatar.';
}
async function carregarAvatar(){
  limparPreviewAvatar();
  atualizarEstadoAvatar();
  if(!fichaAbertaId)return;
  const id=fichaAbertaId;
  try{
    const response=await fetch(API_BASE_URL+'/api/personagens/'+id+'/avatar',{credentials:'include'});
    if(!response.ok)return;
    const blob=await response.blob();
    if(fichaAbertaId!==id)return;
    avatarObjectUrl=URL.createObjectURL(blob);
    $('p-avatar-img').src=avatarObjectUrl;
    $('p-avatar-img').hidden=false;
    $('p-avatar-vazio').hidden=true;
    $('p-avatar-remover').hidden=false;
  }catch{ /* Avatar é opcional; erro não impede edição da ficha. */ }
}
async function prepararWebpAvatar(arquivo){
  if(!['image/jpeg','image/png','image/webp'].includes(arquivo.type))
    throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  if(arquivo.size>8*1024*1024)throw new Error('Arquivo original acima de 8 MB.');
  const url=URL.createObjectURL(arquivo);
  try{
    const foto=new Image();
    foto.src=url;
    await foto.decode();
    if(foto.width<32||foto.height<32)throw new Error('Imagem pequena demais.');
    const tamanho=400;
    const canvas=document.createElement('canvas');
    canvas.width=tamanho;canvas.height=tamanho;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Seu navegador não suporta o processamento desta imagem.');
    const recorte=Math.min(foto.width,foto.height);
    ctx.drawImage(foto,(foto.width-recorte)/2,(foto.height-recorte)/2,recorte,recorte,0,0,tamanho,tamanho);
    const resultado=canvas.toDataURL('image/webp',0.8);
    if(!resultado.startsWith('data:image/webp;base64,'))throw new Error('Seu navegador não conseguiu converter a imagem para WebP.');
    const base64=resultado.split(',')[1];
    if(base64.length>525000)throw new Error('A imagem resultante ultrapassou 384 KB.');
    return base64;
  }finally{URL.revokeObjectURL(url);}
}
$('p-avatar-file').onchange=async()=>{
  const arquivo=$('p-avatar-file').files?.[0],id=fichaAbertaId;
  if(!arquivo||!id)return;
  $('p-avatar-file').disabled=true;
  $('p-avatar-info').textContent='Processando e enviando o retrato...';
  try{
    const imagem=await prepararWebpAvatar(arquivo);
    if(fichaAbertaId!==id)throw new Error('Reabra a ficha para concluir o envio.');
    await api('/api/personagens/'+id+'/avatar','POST',{imagem});
    await carregarAvatar();
    aviso('Avatar salvo com sucesso!',true);
  }catch(e){aviso(e.message);}
  finally{$('p-avatar-file').value='';atualizarEstadoAvatar();}
};
$('p-avatar-remover').onclick=async()=>{
  if(!fichaAbertaId||!confirm('Remover o avatar desta personagem?'))return;
  try{
    await api('/api/personagens/'+fichaAbertaId+'/avatar','DELETE');
    limparPreviewAvatar();
    aviso('Avatar removido.',true);
  }catch(e){aviso(e.message);}
};
// ---- Ficha em abas: preserva os campos e a compatibilidade com fichas antigas ----
const secoesFicha=['identidade','atributos','inventario','habilidades','historia'];
function abrirAbaFicha(nome){
  if(!secoesFicha.includes(nome))return;
  for(const secao of secoesFicha){
    const ativo=secao===nome;
    $('painel-'+secao).hidden=!ativo;
    const botao=$('aba-'+secao);
    botao.classList.toggle('ativa',ativo);
    botao.setAttribute('aria-selected',String(ativo));
    botao.tabIndex=ativo?0:-1;
  }
}
for(const nome of secoesFicha){
  $('aba-'+nome).onclick=()=>abrirAbaFicha(nome);
  $('aba-'+nome).onkeydown=e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();
    let pos=secoesFicha.indexOf(nome);
    if(e.key==='ArrowLeft')pos=(pos+secoesFicha.length-1)%secoesFicha.length;
    if(e.key==='ArrowRight')pos=(pos+1)%secoesFicha.length;
    if(e.key==='Home')pos=0;
    if(e.key==='End')pos=secoesFicha.length-1;
    abrirAbaFicha(secoesFicha[pos]);$('aba-'+secoesFicha[pos]).focus();
  };
}
const formularioFicha=$('f-personagem');
function moverPara(secao,elemento){if(elemento)$('painel-'+secao).appendChild(elemento);}
moverPara('identidade',formularioFicha.querySelector('.avatar-painel'));
moverPara('identidade',formularioFicha.querySelector('.cenario-ficha'));
moverPara('identidade',$('p-nome').closest('.grade'));
moverPara('atributos',$('p-regras-dnd'));
moverPara('atributos',$('p-perfil-narrativo'));
moverPara('atributos',$('p-dnd-ressalva'));
moverPara('inventario',formularioFicha.querySelector('.equipamento-ficha'));
moverPara('habilidades',$('p-habilidades-secao'));
moverPara('historia',$('p-evolucao-secao'));
moverPara('historia',formularioFicha.querySelector('label[for="p-notas"]'));
moverPara('historia',$('p-notas'));
formularioFicha.noValidate=true; // As abas ocultas têm campos; a validação será feita na tela correta.
abrirAbaFicha('identidade');

// --- Inventário persistente e editável ---
const categoriasInventario=['Arma','Armadura','Consumível','Ferramenta','Exploração','Outros'];
let inventarioFicha=[],habilidadesFicha=[],evolucaoFicha=[];
const textoLimitado=(valor,max)=>typeof valor==='string'?valor.trim().slice(0,max):'';
function normalizarInventario(dados){
  if(Array.isArray(dados.inventario))
    return dados.inventario.slice(0,32).filter(x=>x&&typeof x.nome==='string').map(x=>({
      nome:textoLimitado(x.nome,80),
      tipo:categoriasInventario.includes(x.tipo)?x.tipo:'Outros',
      quantidade:Math.max(1,Math.min(99,Math.round(Number(x.quantidade)||1))),
      equipado:Boolean(x.equipado),
      descricao:textoLimitado(x.descricao,120)
    })).filter(x=>x.nome);
  return String(dados.equipamentos||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,32)
    .map(nome=>({nome:nome.slice(0,80),tipo:'Outros',quantidade:1,equipado:false,descricao:''}));
}
function sincronizarInventario(){
  // Compatível com fichas anteriores: o texto antigo continua preservado.
  $('p-equipamentos').value=inventarioFicha.map(x=>x.nome).join('\n').slice(0,1800);
  $('p-inventario-resumo').textContent=inventarioFicha.length+' itens · '+inventarioFicha.reduce((n,x)=>n+x.quantidade,0)+' unidades · '+inventarioFicha.filter(x=>x.equipado).length+' equipados';
}
function pintarInventario(){
  const lista=$('p-inventario-lista');lista.replaceChildren();
  if(!inventarioFicha.length)lista.appendChild(el('p','Sua mochila ainda está vazia. Adicione itens ou gere um kit inicial.','suave'));
  inventarioFicha.forEach((item,i)=>{
    const card=el('div','','item-ficha');
    const titulo=el('strong',item.nome),linha=el('div','','item-ficha-linha');
    const tipo=document.createElement('select');tipo.setAttribute('aria-label','Categoria de '+item.nome);
    categoriasInventario.forEach(t=>tipo.add(new Option(t,t)));tipo.value=item.tipo;
    tipo.onchange=()=>{item.tipo=tipo.value;};
    const quantidade=document.createElement('input');
    quantidade.type='number';quantidade.min='1';quantidade.max='99';quantidade.value=item.quantidade;
    quantidade.setAttribute('aria-label','Quantidade de '+item.nome);
    quantidade.onchange=()=>{item.quantidade=Math.min(99,Math.max(1,Math.round(Number(quantidade.value)||1)));quantidade.value=item.quantidade;sincronizarInventario();};
    const equipado=document.createElement('label');equipado.className='item-ficha-equipado';
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=item.equipado;
    checkbox.onchange=()=>{item.equipado=checkbox.checked;sincronizarInventario();};
    equipado.append(checkbox,document.createTextNode(' Equipado'));
    const remover=el('button','Remover','link');remover.type='button';remover.onclick=()=>{inventarioFicha.splice(i,1);pintarInventario();};
    const desc=document.createElement('input');desc.type='text';desc.maxLength=120;
    desc.placeholder='Observações (opcional)';desc.value=item.descricao;
    desc.setAttribute('aria-label','Descrição de '+item.nome);desc.oninput=()=>{item.descricao=desc.value;};
    linha.append(tipo,quantidade,equipado,remover);
    card.append(titulo,linha,desc);lista.appendChild(card);
  });
  sincronizarInventario();
}
function adicionarItemFicha(nome,tipo='Outros'){
  const titulo=textoLimitado(nome,80);
  if(!titulo){aviso('Informe o nome do item.');return;}
  if(inventarioFicha.length>=32){aviso('Sua ficha atingiu o limite de 32 tipos de itens.');return;}
  inventarioFicha.push({nome:titulo,tipo,quantidade:1,equipado:false,descricao:''});
  $('p-item-nome').value='';pintarInventario();
}
$('p-item-adicionar').onclick=()=>adicionarItemFicha($('p-item-nome').value,$('p-item-tipo').value);
$('p-item-nome').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('p-item-adicionar').click();}};
const acaoKitOriginal=$('p-gerar-kit').onclick;
$('p-gerar-kit').onclick=()=>{
  // O botão antigo atualiza a lista textual; aproveitamos a mesma sugestão confirmada.
  const anterior=$('p-equipamentos').value;
  acaoKitOriginal();
  const novo=$('p-equipamentos').value;
  if(novo!==anterior){
    inventarioFicha=normalizarInventario({equipamentos:novo});
    pintarInventario();
  }
};

// --- Habilidades sugeridas como temas, nunca poder concedido automaticamente ---
const categoriasHabilidade=['Característica','Perícia','Magia','Talento','Narrativa'];
const temasHabilidades={
 'Bárbaro':['Resistência em campo','Intimidação'],
 'Bardo':['Performance','Diplomacia'],
 'Bruxo':['Pacto e conhecimento oculto','Investigação arcana'],
 'Clérigo':['Tradições religiosas','Apoio ao grupo'],
 'Druida':['Conhecimento natural','Sobrevivência'],
 'Feiticeiro':['Controle narrativo de magia','História da origem mágica'],
 'Guerreiro':['Tática de combate','Treinamento com armas'],
 'Ladino':['Furtividade','Percepção de armadilhas'],
 'Mago':['Pesquisa arcana','Leitura de grimórios'],
 'Monge':['Disciplina','Acrobacia'],
 'Paladino':['Juramento e valores','Liderança'],
 'Patrulheiro':['Rastreamento','Sobrevivência'],
 'Capitão':['Comando da tripulação','Navegação'],
 'Navegador':['Cartografia','Orientação'],
 'Artilheiro':['Manutenção de equipamentos','Precisão'],
 'Detetive':['Dedução','Entrevista'],
 'Piloto':['Navegação espacial','Manobras'],
 'Engenheiro':['Manutenção técnica','Análise de sistemas'],
 'Médico':['Primeiros socorros','Diagnóstico']
};
function pintarHabilidades(){
  const lista=$('p-habilidades-lista');lista.replaceChildren();
  if(!habilidadesFicha.length)lista.appendChild(el('p','Nenhuma habilidade cadastrada. Adicione uma aprovada pelo mestre.','suave'));
  habilidadesFicha.forEach((h,i)=>{
    const card=el('div','','item-ficha');
    const titulo=el('strong',h.nome);
    const linha=el('div','','item-ficha-linha');
    const tipo=document.createElement('select');tipo.setAttribute('aria-label','Tipo de '+h.nome);
    categoriasHabilidade.forEach(t=>tipo.add(new Option(t,t)));tipo.value=h.tipo;
    tipo.onchange=()=>{h.tipo=tipo.value;};
    const remover=el('button','Remover','link');remover.type='button';remover.onclick=()=>{habilidadesFicha.splice(i,1);pintarHabilidades();};
    linha.append(tipo,remover);
    const desc=document.createElement('textarea');desc.rows=2;desc.maxLength=200;desc.placeholder='Descrição, requisitos, usos ou referência às regras';desc.value=h.descricao;
    desc.setAttribute('aria-label','Descrição da habilidade '+h.nome);
    desc.oninput=()=>{h.descricao=desc.value;};
    card.append(titulo,linha,desc);lista.appendChild(card);
  });
}
$('p-habilidade-adicionar').onclick=()=>{
  const nome=textoLimitado($('p-habilidade-nome').value,80);
  if(!nome){aviso('Dê um nome à habilidade.');return;}
  if(habilidadesFicha.length>=24){aviso('Limite de 24 habilidades por ficha.');return;}
  habilidadesFicha.push({nome,tipo:$('p-habilidade-tipo').value,descricao:''});
  $('p-habilidade-nome').value='';pintarHabilidades();
};
$('p-habilidade-nome').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('p-habilidade-adicionar').click();}};
$('p-sugerir-habilidades').onclick=()=>{
  const nome=fichaNarrativa() ? $('p-especialidade').value : $('p-classe').value;
  if(!nome){aviso('Selecione antes uma classe ou especialidade na aba Identidade.');abrirAbaFicha('identidade');return;}
  const sugestoes=temasHabilidades[nome]||['Conhecimento do cenário','Trabalho em equipe'];
  const disponiveis=sugestoes.filter(x=>!habilidadesFicha.some(y=>y.nome===x));
  if(!disponiveis.length){aviso('As sugestões já estão na ficha.');return;}
  if(!confirm('Adicionar temas para revisar com seu mestre? Isso não concede poderes nem proficiências automaticamente.'))return;
  for(const titulo of disponiveis.slice(0,Math.max(0,24-habilidadesFicha.length))){
    habilidadesFicha.push({nome:titulo,tipo:'Narrativa',descricao:'Ideia narrativa para discutir com o mestre; efeitos e permissões ainda não definidos.'});
  }
  pintarHabilidades();
};

// --- Diário permanente de conquistas ---
function pintarEvolucao(){
  const lista=$('p-evolucao-lista');lista.replaceChildren();
  if(!evolucaoFicha.length)lista.appendChild(el('p','Nenhuma conquista registrada ainda.','suave'));
  evolucaoFicha.forEach((e,i)=>{
    const card=el('div','','evolucao-item');
    card.append(el('strong','Nível '+e.nivel+' · '+e.data),el('p',e.nota));
    const remover=el('button','Excluir registro','link');remover.type='button';
    remover.onclick=()=>{evolucaoFicha.splice(i,1);pintarEvolucao();};
    card.appendChild(remover);lista.appendChild(card);
  });
}
$('p-evolucao-adicionar').onclick=()=>{
  const nota=textoLimitado($('p-evolucao-nota').value,160);
  if(!nota){aviso('Escreva o que aconteceu com o personagem.');return;}
  if(evolucaoFicha.length>=30){aviso('Limite de 30 registros de evolução por ficha.');return;}
  evolucaoFicha.push({nota,nivel:fichaNarrativa()?1:Math.min(20,Math.max(1,Number($('p-nivel').value)||1)),data:new Date().toISOString().slice(0,10)});
  $('p-evolucao-nota').value='';pintarEvolucao();
};
$('p-evolucao-nota').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('p-evolucao-adicionar').click();}};
function restaurarExtrasFicha(d){
  inventarioFicha=normalizarInventario(d||{});
  habilidadesFicha=Array.isArray(d?.habilidades)?d.habilidades.slice(0,24).filter(x=>x&&typeof x.nome==='string').map(x=>({
    nome:textoLimitado(x.nome,80),tipo:categoriasHabilidade.includes(x.tipo)?x.tipo:'Narrativa',descricao:textoLimitado(x.descricao,200)
  })).filter(x=>x.nome):[];
  evolucaoFicha=Array.isArray(d?.evolucao)?d.evolucao.slice(0,30).filter(x=>x&&typeof x.nota==='string').map(x=>({
    nota:textoLimitado(x.nota,160),nivel:Math.max(1,Math.min(20,Number(x.nivel)||1)),
    data:/^\d{4}-\d{2}-\d{2}$/.test(x.data)?x.data:new Date().toISOString().slice(0,10)
  })).filter(x=>x.nota):[];
  pintarInventario();pintarHabilidades();pintarEvolucao();
}
function limparFicha(){
  fichaAbertaId=null;
  limparPreviewAvatar();
  atualizarEstadoAvatar();
  $('f-personagem').reset();
  restaurarExtrasFicha({});
  abrirAbaFicha('identidade');
  atributosDnd.forEach(([sigla])=>$('at-'+sigla).value='8');
  $('ficha-form-titulo').textContent='Nova personagem';
  $('p-remover').hidden=true;
  atualizarPontosDnd();
  atualizarSugestaoClasse();
  $('p-cenario').value='';atualizarContextoDnd();$('p-aventura').value='';$('p-funcao').value='';
  atualizarKit();
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
        carregarAvatar();
        const d=item.dados;
        $('p-nome').value=d.nome||'';
        $('p-classe').value=d.classe||'';
        $('p-especie').value=d.especie||'';
        $('p-antecedente').value=d.antecedente||'';
        $('p-nivel').value=d.nivel||1;
        $('p-notas').value=d.notas||'';
        restaurarExtrasFicha(d);
        abrirAbaFicha('identidade');
        $('p-cenario').value=contextosDnd[d.cenario]?d.cenario:'';
        atualizarContextoDnd();
        $('p-especialidade').value=contextosDnd[d.cenario]?.papeis.includes(d.especialidade)?d.especialidade:'';
        $('p-funcao').value=d.funcao||'';
        $('p-aventura').value=String(d.aventuraId||'');
        atualizarRecomendacaoNarrativa();
        atualizarKit();
        for(const [sigla] of atributosDnd) $('at-'+sigla).value=String(d.atributos?.[sigla]||8);
        $('ficha-form-titulo').textContent='Editar personagem';
        $('p-remover').hidden=false;
        atualizarPontosDnd();
        atualizarSugestaoClasse();
        atualizarKit();
        $('f-personagem').scrollIntoView({behavior:'smooth',block:'start'});
      };
      lista.appendChild(botao);
    }
  }catch(e){aviso(e.message);}
}
$('f-personagem').onsubmit=async ev=>{
  ev.preventDefault();
  const narrativa=fichaNarrativa();
  if(!$('p-nome').value.trim()){aviso('Informe o nome da personagem.');abrirAbaFicha('identidade');$('p-nome').focus();return;}
  if(!$('p-cenario').value){aviso('Escolha primeiro o cenário da personagem.');abrirAbaFicha('identidade');return;}
  if(!narrativa && pontosDnd()>27){aviso('Você ultrapassou 27 pontos. Ajuste os atributos.');abrirAbaFicha('atributos');return;}
  if(narrativa && !$('p-especialidade').value){aviso('Selecione a especialidade da personagem neste cenário.');abrirAbaFicha('identidade');return;}
  const dados={
    edicao:narrativa?'narrativo':'2024',metodo:narrativa?'livre':'compra27',
    nome:$('p-nome').value.trim(),classe:narrativa?'':$('p-classe').value.trim(),
    especie:narrativa?'':$('p-especie').value.trim(),antecedente:narrativa?'':$('p-antecedente').value.trim(),
    nivel:narrativa?1:Number($('p-nivel').value),notas:$('p-notas').value.trim(),
    equipamentos:$('p-equipamentos').value.trim(),
    inventario:inventarioFicha.map(x=>({...x})),
    habilidades:habilidadesFicha.map(x=>({...x})),
    evolucao:evolucaoFicha.map(x=>({...x})),
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
restaurarExtrasFicha({});
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
async function entrar(url, email, senha, tokenBootstrap, manterConectado = false) {
  try {
    await api(url, 'POST', { email, senha, manterConectado, ...(tokenBootstrap ? { tokenBootstrap } : {}) });
    await atualizarEu(); mostrar('gerador'); aviso('Tudo certo!', true);
  }
  catch (e) { aviso(e.message); }
  finally { if (tokenBootstrap) $('c-token-bootstrap').value = ''; }
}
$('f-login').onsubmit = (ev) => { ev.preventDefault(); entrar('/api/login', $('l-email').value, $('l-senha').value, undefined, $('l-manter').checked); };
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
