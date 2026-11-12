// app.js — a parte que roda no NAVEGADOR. Ela só cuida da tela.
// Todas as regras de verdade (limites, permissões) ficam no servidor.
const $ = (id) => document.getElementById(id);
const API_BASE_URL = (window.MESA_CONFIG && window.MESA_CONFIG.apiBaseUrl || '').replace(/\/+$/, '');
const GENEROS = ['Fantasia sombria', 'Fantasia épica', 'D&D clássico', 'Ficção científica', 'Terror', 'Investigação', 'Piratas e mares'];
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
const TELAS = ['gerador','solo','dados','historico','personagens','assistente','tutorial','novidades','suporte','instalar','conta','admin','privacidade','termos'];
const estadoNavegacao={
  ler(chave){try{return sessionStorage.getItem('mesa:'+chave);}catch{return null;}},
  gravar(chave,valor){try{if(valor===null)sessionStorage.removeItem('mesa:'+chave);else sessionStorage.setItem('mesa:'+chave,String(valor));}catch{}}
};

$('dnd-tutorial-mesa').onclick=()=>{mostrar('tutorial');tutorialMostrarPasso(0);};
const tutorialEtapas = [
 {titulo:'Bem-vindo ao Mesa',sub:'Seu espaço de histórias',texto:'O Mesa reúne aventuras, dados e fichas em um só lugar. Use o menu lateral para alternar de ferramenta. Você pode deixá-lo expandido ou compacto, e no celular basta tocar em Menu.',dicas:['O tutorial fica disponível sempre no menu lateral.','Sua conta guarda o histórico e as fichas privadas.'],tela:'gerador',rotulo:'Conhecer o gerador'},
 {titulo:'Crie sua primeira aventura',sub:'Gerador de histórias',texto:'Escolha o gênero, defina o tom e o número de jogadores. Escreva uma ideia opcional, como uma vila cercada por névoa, e clique em Gerar minha aventura. O Mesa usa IA e aplica limites de uso.',dicas:['Uma ideia curta pode orientar toda a aventura.','Leia a história gerada e adapte-a livremente à sua mesa.'],tela:'gerador',rotulo:'Ir ao gerador'},
 {titulo:'Role os dados',sub:'Oráculo dos dados',texto:'Os dados introduzem sorte no jogo. Um d20 tem 20 faces; d4, d6, d8, d10 e d12 possuem as quantidades de faces indicadas. No Oráculo dos dados você encontra botões para rolar e um tutorial ilustrado para iniciantes.',dicas:['O mestre determina quando uma rolagem é necessária.','Os efeitos de cada resultado dependem das regras da campanha.'],tela:'dados',rotulo:'Abrir os dados'},
 {titulo:'Crie uma conta',sub:'Acesso ao seu espaço',texto:'Ao entrar ou criar uma conta, você pode guardar aventuras, fichas e preferências. A opção Manter conectado preserva a sessão por até 30 dias. Se perder sua senha, use o link de recuperação da tela de entrada.',dicas:['Nunca compartilhe sua senha.','O login e o cadastro ficam em Entrar, no menu.'],tela:'conta',rotulo:'Abrir acesso'},
 {titulo:'Recupere o acesso quando precisar',sub:'Segurança da conta',texto:'Na tela Entrar, toque em Esqueceu sua senha? e siga as instruções para solicitar a recuperação. Você também pode criar uma conta nova se ainda não tiver registro. Não compartilhe sua senha com o mestre ou outros jogadores.',dicas:['Use um e-mail ao qual você tenha acesso.','Se o envio de e-mail não estiver configurado pelo administrador, a recuperação poderá ficar indisponível.'],tela:'conta',rotulo:'Ver tela de acesso'},
 {titulo:'Consulte suas aventuras',sub:'Histórico',texto:'Após entrar na conta, abra Histórico para rever histórias anteriores. Dessa forma, você pode reutilizar locais, personagens e ideias sem precisar gerar tudo novamente.',dicas:['O histórico requer login.','Se a seção não aparecer, entre primeiro na sua conta.'],tela:'historico',rotulo:'Abrir histórico',requerLogin:true},
 {titulo:'Monte sua ficha',sub:'Personagens',texto:'Acesse Personagens, clique em Nova ficha e selecione o cenário. Para fantasia, o Mesa oferece a ficha D&D 2024 com atributos de compra de 27 pontos; nos outros mundos, a ficha usa uma abordagem narrativa.',dicas:['As abas dividem a ficha em Identidade, Atributos, Inventário, Habilidades e História.','Salve a ficha antes de enviar um retrato.'],tela:'personagens',rotulo:'Criar personagem',requerLogin:true},
 {titulo:'Personalize o retrato e a ficha',sub:'Identidade do personagem',texto:'Depois de salvar a ficha, abra o personagem pela Minha biblioteca. Na aba Identidade, envie um retrato JPG, PNG ou WebP, selecione o cenário e associe a história, se desejar. O retrato fica privado na sua conta.',dicas:['O botão de geração de avatar por IA está desativado por enquanto.','O personagem selecionado recebe destaque verde e dourado, e a seleção volta após atualizar a página.'],tela:'personagens',rotulo:'Abrir personagens',requerLogin:true},
 {titulo:'Organize a mochila',sub:'Inventário',texto:'Na ficha, abra a aba Inventário. Você pode sugerir um kit inicial, adicionar itens, definir categorias, quantidades, descrição e marcar o que está equipado. Salve a ficha para preservar as alterações.',dicas:['Equipado é uma marcação manual, não calcula automaticamente dano ou defesa.','Confira itens e proficiências com as regras da campanha.'],tela:'personagens',rotulo:'Abrir personagens',requerLogin:true},
 {titulo:'Escreva habilidades e conquistas',sub:'Grimório e evolução',texto:'Na aba Habilidades, registre perícias, magias, talentos e características, com suas descrições. Na aba História, registre missões, conquistas, mudanças e anotações do personagem.',dicas:['Temas sugeridos não liberam poderes nem proficiências automaticamente.','O mestre valida as regras utilizadas.'],tela:'personagens',rotulo:'Abrir fichas',requerLogin:true},
 {titulo:'Peça ajuda ao tutor',sub:'Tutor D&D',texto:'O Tutor D&D responde dúvidas sobre conceitos e regras, com base de referência na SRD 5.2.1. Abra a ferramenta, descreva a dúvida e examine a resposta. Existem limites de perguntas por conta.',dicas:['Uma pergunta específica costuma render uma explicação mais útil.','O tutor não substitui a decisão do mestre.'],tela:'assistente',rotulo:'Abrir tutor',requerLogin:true},
 {titulo:'Entenda as regras de D&D do zero',sub:'Material gratuito oficial',texto:'No Tutor D&D você encontra o guia oficial para começar a jogar e o livro eletrônico gratuito das regras de 2024. Aprenda testes, rolagens, atributos, combate, classes, espécies, antecedentes, magias, equipamentos e progressão. Depois, use o Tutor para dúvidas específicas.',dicas:['Comece pelo guia introdutório e avance para o compêndio de regras.','O conteúdo do D&D Beyond está em inglês e pode ser traduzido pelo navegador.'],tela:'assistente',rotulo:'Ver trilha oficial de D&D',requerLogin:true},
 {titulo:'Administração do Mesa',sub:'Painel do administrador',texto:'Quando a conta tem perfil de administrador, o menu inclui Painel, onde é possível consultar informações gerais como número de usuários e aventuras geradas. Usuários comuns não têm acesso a essa área.',dicas:['O painel não dá acesso às fichas privadas de outras pessoas.','Se você não for administrador, essa área não aparecerá no seu menu.'],tela:'admin',rotulo:'Abrir painel (administrador)',requerAdmin:true},
 {titulo:'Crie a atmosfera da mesa',sub:'Música e ajustes finais',texto:'O botão ♫ Música fica no canto inferior direito, inclusive no login. Abra-o para escolher entre três gravações medievais licenciadas, controlar volume e pausar. A reprodução começa somente quando você solicitar.',dicas:['O player mostra autor, licença e fonte das gravações.','Se preferir silêncio, deixe o player pausado. Pronto: sua aventura pode começar!'],tela:'gerador',rotulo:'Começar aventura'}
];
let tutorialPasso=0;
function tutorialMostrarPasso(indice){
  tutorialPasso=Math.max(0,Math.min(tutorialEtapas.length-1,indice));
  const etapa=tutorialEtapas[tutorialPasso];
  $('tutorial-contagem').textContent='Passo '+(tutorialPasso+1)+' de '+tutorialEtapas.length;
  $('tutorial-progresso').value=tutorialPasso+1;
  $('tutorial-progresso').max=tutorialEtapas.length;
  const conteudo=$('tutorial-conteudo');conteudo.replaceChildren();
  conteudo.append(el('span',etapa.sub,'sobretitulo'),el('h2',etapa.titulo),el('p',etapa.texto));
  const ul=el('ul');etapa.dicas.forEach(d=>ul.appendChild(el('li',d)));conteudo.append(ul);
  $('tutorial-anterior').disabled=tutorialPasso===0;
  $('tutorial-proximo').textContent=tutorialPasso===tutorialEtapas.length-1?'✓ Concluir tutorial':'Próximo capítulo →';
  $('tutorial-ir').textContent=etapa.rotulo+' ↗';
  try{localStorage.setItem('mesa-tutorial-etapa',String(tutorialPasso));}catch{}
}
$('tutorial-anterior').onclick=()=>tutorialMostrarPasso(tutorialPasso-1);
$('tutorial-proximo').onclick=()=>{if(tutorialPasso===tutorialEtapas.length-1){mostrar('gerador');return;}tutorialMostrarPasso(tutorialPasso+1);};
$('tutorial-recomecar').onclick=()=>tutorialMostrarPasso(0);
$('tutorial-ir').onclick=()=>{
  const etapa=tutorialEtapas[tutorialPasso];
  if(etapa.requerLogin&&!eu.logado){mostrar('conta');aviso('Entre na sua conta primeiro para usar essa ferramenta.');return;}
  if(etapa.requerAdmin&&eu.papel!=='admin'){aviso('O painel é exclusivo para administradores.');return;}
  mostrar(etapa.tela);
};
try{const guardado=Number(localStorage.getItem('mesa-tutorial-etapa'));if(Number.isInteger(guardado))tutorialPasso=Math.max(0,Math.min(tutorialEtapas.length-1,guardado));}catch{}
tutorialMostrarPasso(tutorialPasso);

// Menu lateral: recolhível no computador e gaveta no celular.
const preferirMobile=()=>window.matchMedia('(max-width:850px)').matches;
function menuRecolher(recolher){
  if(preferirMobile()){menuMobile(false);return;}
  document.body.classList.toggle('menu-compacto',recolher);
  $('menu-retrair').textContent=recolher?'›':'‹';
  $('menu-retrair').setAttribute('aria-expanded',String(!recolher));
  $('menu-retrair').setAttribute('aria-label',recolher?'Expandir menu lateral':'Recolher menu lateral');
  $('menu-retrair').title=recolher?'Expandir menu':'Recolher menu';
  try{localStorage.setItem('mesa-menu-compacto',recolher?'1':'0');}catch{}
}
function menuMobile(aberto){
  const ativo=Boolean(aberto)&&preferirMobile();
  document.body.classList.toggle('menu-mobile-aberto',ativo);
  $('menu-fundo').hidden=!ativo;
  $('menu-abrir-mobile').setAttribute('aria-expanded',String(ativo));
  $('menu-abrir-mobile').setAttribute('aria-label',ativo?'Fechar menu lateral':'Abrir menu lateral');
  if(!ativo&&preferirMobile()&&document.activeElement?.closest('#menu-lateral'))$('menu-abrir-mobile').focus();
}
$('menu-retrair').onclick=()=>preferirMobile()?menuMobile(false):menuRecolher(!document.body.classList.contains('menu-compacto'));
$('menu-abrir-mobile').onclick=()=>menuMobile(!document.body.classList.contains('menu-mobile-aberto'));
$('menu-fundo').onclick=()=>menuMobile(false);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&document.body.classList.contains('menu-mobile-aberto'))menuMobile(false);});
window.addEventListener('resize',()=>{if(!preferirMobile())menuMobile(false);});
try{menuRecolher(localStorage.getItem('mesa-menu-compacto')==='1');}catch{menuRecolher(false);}
function mostrar(tela) {
  if(!TELAS.includes(tela))return;
  pararJornada();
  if(!eu.logado&&['historico','personagens','assistente','admin'].includes(tela))tela='conta';
  if(tela==='admin'&&eu.papel!=='admin')tela='gerador';
  estadoNavegacao.gravar('tela',tela);
  document.body.classList.toggle('tela-acesso', tela === 'conta');
  TELAS.forEach((t) => { $('v-' + t).hidden = t !== tela; });
  document.querySelectorAll('#nav button[data-tela]').forEach((b) => b.setAttribute('aria-current', b.dataset.tela === tela?'page':'false'));
  if(tela==='tutorial')tutorialMostrarPasso(tutorialPasso);
  menuMobile(false);
  aviso('');
  if (tela === 'gerador' && !$('f-gerar-npc').hidden) { carregarOrigensNPC(); if(eu.logado)carregarBibliotecaNPC(); }
  if (tela === 'solo') soloAtualizarInicio();
  if (tela === 'historico') carregarHistorico();
  if (tela === 'personagens') { carregarAventurasDaFicha().then(carregarPersonagens); }
  if (tela === 'admin') {carregarResumo();notificacoesAtualizar();}
  if (tela === 'suporte') suporteListar();
  if (tela === 'novidades') noticiasMesa();
}
$('abrir-tutorial-menu').onclick=()=>mostrar('tutorial');
$('solo-ir-gerador')?.addEventListener('click',()=>mostrar('gerador'));
// Notificações internas do administrador: novos chamados de suporte e feedback.
let notificacoesAberto=false;
let notificacoesUltimoCarregamento=0;
let notificacoesEmAndamento=false;
function notificacoesFechar(devolverFoco=false){
 const painel=$('notificacoes-painel');
 painel.hidden=true;notificacoesAberto=false;
 $('notificacoes-abrir').setAttribute('aria-expanded','false');
 if(devolverFoco)$('notificacoes-abrir').focus();
}
async function notificacoesAtualizar(force=false){
 if(eu.papel!=='admin'||!eu.logado)return;
 if(notificacoesEmAndamento)return;
 if(!force&&Date.now()-notificacoesUltimoCarregamento<45000)return;
 notificacoesEmAndamento=true;
 try{
  const data=await api('/api/admin/notificacoes');
  notificacoesUltimoCarregamento=Date.now();
  if(eu.papel!=='admin')return;
  const contador=$('notificacoes-contador'),quantidade=Number(data.naoLidas)||0;
  contador.hidden=quantidade<1;
  contador.textContent=quantidade>99?'99+':String(quantidade);
  $('notificacoes-abrir').setAttribute('aria-label',quantidade?quantidade+' notificações não lidas de suporte':'Abrir notificações de suporte');
  $('notificacoes-abrir').title=quantidade?quantidade+' notificações não lidas':'Nenhuma notificação pendente';
  const estado=$('notificacoes-estado');
  estado.textContent=quantidade?quantidade+' chamado(s) ainda não lido(s).':'Tudo em dia! Nenhum chamado novo.';
  const lista=$('notificacoes-lista');lista.replaceChildren();
  if(!data.itens.length)add('p',lista,'Ainda não recebemos mensagens de suporte.','suave');
  for(const item of data.itens){
   const card=add('article',lista,'','notificacoes-item'+(item.lido?'':' nao-lida'));
   add('strong',card,item.assunto);
   add('p',card,item.email+' · '+dataBR(item.criado_em),'suave');
   const linha=add('div',card,'','notificacoes-item-acoes');
   if(!item.lido)botaoAdmin(linha,'Marcar como lida',async()=>{
    try{await api('/api/admin/notificacoes/'+item.id+'/ler','POST',{});notificacoesUltimoCarregamento=0;await notificacoesAtualizar(true);}
    catch(e){estado.textContent=e.message;}
   });
   botaoAdmin(linha,'Atender ↗',async()=>{
    try{
     if(!item.lido)await api('/api/admin/notificacoes/'+item.id+'/ler','POST',{});
     notificacoesFechar();adminSecao='suporte';mostrar('admin');notificacoesUltimoCarregamento=0;notificacoesAtualizar(true);
    }catch(e){estado.textContent=e.message;}
   });
  }
  $('notificacoes-ler-todas').disabled=quantidade===0;
 }catch(e){
  $('notificacoes-estado').textContent='Não foi possível atualizar os avisos. '+e.message;
 }finally{notificacoesEmAndamento=false;}
}
$('notificacoes-abrir').onclick=()=>{
 notificacoesAberto=!notificacoesAberto;
 $('notificacoes-painel').hidden=!notificacoesAberto;
 $('notificacoes-abrir').setAttribute('aria-expanded',String(notificacoesAberto));
 if(notificacoesAberto)notificacoesAtualizar(true);
};
$('notificacoes-fechar').onclick=()=>notificacoesFechar(true);
$('notificacoes-ler-todas').onclick=async()=>{
 try{await api('/api/admin/notificacoes/ler-todas','POST',{});notificacoesUltimoCarregamento=0;await notificacoesAtualizar(true);}
 catch(e){$('notificacoes-estado').textContent=e.message;}
};
$('notificacoes-ir-suporte').onclick=()=>{notificacoesFechar();adminSecao='suporte';mostrar('admin');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&notificacoesAberto)notificacoesFechar(true);});
document.addEventListener('pointerdown',e=>{if(notificacoesAberto&&!e.target.closest('#mesa-notificacoes'))notificacoesFechar();});
function notificacoesSessao(){
 const ativo=eu.logado&&eu.papel==='admin';
 $('mesa-notificacoes').hidden=!ativo;
 if(!ativo){
  notificacoesFechar();notificacoesUltimoCarregamento=0;
  $('notificacoes-contador').hidden=true;
 }else notificacoesAtualizar(true);
}
// Consulta de 60 em 60 segundos enquanto o documento estiver visível e autenticado.
window.setInterval(()=>{if(!document.hidden)notificacoesAtualizar();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&eu.papel==='admin')notificacoesAtualizar();});
function montarNav() {
  const nav = $('nav');
  nav.replaceChildren();
  const itens = [['gerador', '✦', 'Gerador'], ['solo', '✧', 'RPG Solo · IA'], ['dados', '◇', 'Dados']];
  if (eu.logado) itens.push(['historico', '▤', 'Histórico'], ['personagens', '♙', 'Personagens'], ['assistente', '✧', 'Tutor D&D']);
  itens.push(['tutorial','❖','Tutorial'],['novidades','✦','Novidades'],['instalar','⬇','Instalar Mesa']);
  if(eu.logado)itens.push(['suporte','✉','Suporte']);
  if (eu.papel === 'admin') itens.push(['admin', '⚙', 'Painel']);
  if (!eu.logado) itens.push(['conta', '↪', 'Entrar']);
  itens.forEach(([t,simbolo,nome])=>{
    const botao=el('button','','menu-item');botao.dataset.tela=t;botao.type='button';
    botao.title=nome;botao.setAttribute('aria-label',nome);
    const icone=el('span',simbolo,'menu-item-icone');icone.setAttribute('aria-hidden','true');
    botao.append(icone,el('span',nome,'menu-item-texto'));
    botao.onclick=()=>mostrar(t);nav.appendChild(botao);
  });
  if(eu.logado){
    const sair=el('button','','menu-item');sair.type='button';sair.title='Sair';sair.setAttribute('aria-label','Sair');
    const icone=el('span','↪','menu-item-icone');icone.setAttribute('aria-hidden','true');
    sair.append(icone,el('span','Sair','menu-item-texto'));
    sair.onclick=async()=>{
      await api('/api/logout','POST');
      estadoNavegacao.gravar('personagem',null);
      estadoNavegacao.gravar('aba-ficha',null);
      estadoNavegacao.gravar('tela',null);
      fichaAbertaId=null;
      await atualizarEu();mostrar('gerador');
    };
    nav.appendChild(sair);
  }
}
function textoInfo() {
  if (!eu.logado) return eu.restantes > 0 ? 'Teste grátis: ' + eu.restantes + ' geração. Crie uma conta para ter mais.' : 'O teste grátis acabou. Crie uma conta para continuar.';
  return eu.restantes === null ? 'Acesso total (administrador).' : 'Gerações restantes hoje: ' + eu.restantes;
}

async function atualizarEu() {
  // Não substitua o estado de login antes que o servidor confirme a sessão.
  const resposta=await api('/api/eu');
  eu=resposta;
  montarNav();
  notificacoesSessao();
  $('info').textContent=textoInfo();
}

// ---- Mostrar uma aventura na tela ----
function desenharAventura(a, alvo, aventuraId=null, genero='', tom='') {
  alvo.replaceChildren();
  const f = el('article', '', 'folha aventura');
  f.appendChild(el('h2', a.titulo || 'Aventura'));
  f.appendChild(el('p', a.gancho));
  acessibilidadeBotaoLer(f,()=>f.innerText.replace(/🔊 Ouvir texto/g,''));
  if (a.locais && a.locais.length) { f.appendChild(el('h3', 'Locais')); const ul = el('ul'); a.locais.forEach((l) => ul.appendChild(el('li', l))); f.appendChild(ul); }
  if (a.npcs && a.npcs.length) { f.appendChild(el('h3', 'NPCs')); const ul = el('ul'); a.npcs.forEach((n) => ul.appendChild(el('li', n.nome + ': ' + n.descricao))); f.appendChild(ul); }
  if (a.vilao) { f.appendChild(el('h3', 'Vilão')); f.appendChild(el('p', a.vilao)); }
  playerDaHistoria(f,genero,tom,a.trilha||'');
  if(eu.logado){const b=el('button','✦ Iniciar jornada com personagem','principal');b.type='button';
    b.onclick=()=>{soloOrigemPreferida=Number(aventuraId)||null;soloTituloPreferido=a.titulo||'';mostrar('solo');};
    const area=el('div','','jornada-inicio');area.append(b);f.append(area);
  }else f.append(el('p','Entre na sua conta para iniciar uma campanha com personagem e progresso salvo.','suave'));
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
    desenharAventura(r.aventura, $('saida'),r.aventuraId,$('genero').value,$('tom').value);
    await atualizarEu(); aviso('');
  } catch (e) {
    aviso(e.message);
    await atualizarEu();
  }
  $('b-gerar').disabled = false;
};

// ---- Gerador independente de NPCs, a partir de campanhas salvas ou de descrição livre ----
GENEROS.forEach(g=>$('npc-genero').appendChild(new Option(g,g)));
TONS.forEach(t=>$('npc-tom').appendChild(new Option(t,t)));
function modoGeradorNPC(ativar){
 $('f-gerar').hidden=ativar;
 $('f-gerar-npc').hidden=!ativar;
 $('modo-aventura').setAttribute('aria-pressed',String(!ativar));
 $('modo-npc').setAttribute('aria-pressed',String(ativar));
 $('modo-aventura').classList.toggle('ativo',!ativar);
 $('modo-npc').classList.toggle('ativo',ativar);
 $('saida').replaceChildren();
 $('npc-biblioteca').hidden=!ativar||!eu.logado;
 if(ativar){carregarOrigensNPC();if(eu.logado)carregarBibliotecaNPC();}
}
$('modo-solo').onclick=()=>mostrar('solo');
$('modo-aventura').onclick=()=>modoGeradorNPC(false);
$('modo-npc').onclick=()=>modoGeradorNPC(true);
let aventurasNpcSalvas=[];
async function carregarOrigensNPC(){
 const select=$('npc-origem'),anterior=select.value;
 select.replaceChildren(new Option('Descrição livre (sem aventura vinculada)','livre'));
 aventurasNpcSalvas=[];
 if(!eu.logado){
  $('npc-origem-info').textContent='Entre na sua conta para criar NPCs ligados a aventuras salvas.';
  return;
 }
 try{
  aventurasNpcSalvas=await api('/api/aventuras');
  for(const a of aventurasNpcSalvas){
   select.appendChild(new Option((a.conteudo?.titulo||'Aventura')+' · '+new Date(a.criado_em).toLocaleDateString('pt-BR'),String(a.id)));
  }
  if([...select.options].some(o=>o.value===anterior))select.value=anterior;
  $('npc-origem-info').textContent=aventurasNpcSalvas.length?'O NPC usará os locais, conflitos e personagens dessa aventura como contexto.':'Você ainda não tem aventuras salvas. Pode criar um NPC com descrição livre.';
 }catch(e){$('npc-origem-info').textContent='Não foi possível carregar suas aventuras: '+e.message;}
}
$('npc-origem').onchange=()=>{
 const a=aventurasNpcSalvas.find(x=>String(x.id)===$('npc-origem').value);
 if(a){
  if(GENEROS.includes(a.genero))$('npc-genero').value=a.genero;
  if(TONS.includes(a.tom))$('npc-tom').value=a.tom;
 }
};
function desenharNPC(npc,alvo){
 alvo.replaceChildren();
 const art=el('article','','folha npc-ficha');
 art.appendChild(el('span','✧ DOSSIÊ DO NPC','sobretitulo'));
 art.appendChild(el('h2',npc.nome||'NPC sem nome'));
 const campos=[['Papel na história','papel'],['Aparência','aparencia'],['Personalidade','personalidade'],
 ['História','historia'],['Objetivo','objetivo'],['Segredo','segredo'],['Vínculo com a aventura','vinculo'],
 ['Como interpretar','interpretacao'],['Gancho de encontro','gancho']];
 for(const [titulo,chave] of campos){
  if(!npc[chave])continue;
  const bloco=el('section','','npc-ficha-campo');
  bloco.appendChild(el('h3',titulo));bloco.appendChild(el('p',npc[chave]));
  art.appendChild(bloco);
 }
 acessibilidadeBotaoLer(art,()=>art.innerText.replace(/🔊 Ouvir texto/g,''));
 const botao=el('button','⧉ Copiar NPC','guia-abrir');botao.type='button';
 botao.onclick=async()=>{
  const texto=[npc.nome,...campos.map(([t,k])=>npc[k]?t+': '+npc[k]:'').filter(Boolean)].join('\n\n');
  try{await navigator.clipboard.writeText(texto);aviso('NPC copiado!',true);}
  catch{aviso('Não foi possível copiar automaticamente. Selecione o texto da ficha.');}
 };
 art.appendChild(botao);alvo.appendChild(art);
}
async function carregarBibliotecaNPC(){
 const lista=$('npc-biblioteca-lista');lista.replaceChildren();
 if(!eu.logado)return;
 try{
  const itens=await api('/api/npcs');
  if(!itens.length){lista.appendChild(el('p','Nenhum NPC salvo ainda.','suave'));return;}
  for(const item of itens){
   const linha=el('article','','npc-biblioteca-item');
   const titulo=el('button',item.conteudo?.nome||'NPC','guia-abrir');titulo.type='button';
   titulo.onclick=()=>{desenharNPC(item.conteudo,$('saida'));$('saida').scrollIntoView({behavior:'smooth',block:'start'});};
   const apagar=el('button','Excluir','apagar');apagar.type='button';
   apagar.onclick=async()=>{
    if(!confirm('Excluir este NPC salvo?'))return;
    try{await api('/api/npcs/'+item.id,'DELETE');await carregarBibliotecaNPC();}
    catch(e){aviso(e.message);}
   };
   linha.append(titulo,el('span',new Date(item.criado_em).toLocaleDateString('pt-BR'),'suave'),apagar);
   lista.appendChild(linha);
  }
 }catch(e){lista.appendChild(el('p','Não foi possível carregar seus NPCs: '+e.message,'suave'));}
}
$('f-gerar-npc').onsubmit=async ev=>{
 ev.preventDefault();
 const b=$('b-gerar-npc');b.disabled=true;aviso('Criando NPC...');
 try{
  const aventuraId=$('npc-origem').value;
  const descricao=$('npc-descricao').value.trim();
  const resumo=$('npc-resumo').value.trim(),tematica=$('npc-tematica').value.trim(),situacao=$('npc-situacao').value.trim();
  if(aventuraId==='livre'&&!descricao&&!resumo&&!tematica&&!situacao){
    throw new Error('Descreva o NPC, a história, a temática ou a situação da cena, ou selecione uma aventura salva.');
  }
  const resposta=await api('/api/npcs/gerar','POST',{
   genero:$('npc-genero').value,tom:$('npc-tom').value,descricao,resumo,tematica,situacao,
   aventuraId:aventuraId==='livre'?null:Number(aventuraId)
  });
  desenharNPC(resposta.npc,$('saida'));
  if(eu.logado)await carregarBibliotecaNPC();
  await atualizarEu();aviso('NPC criado com sucesso!',true);
 }catch(e){aviso(e.message);try{await atualizarEu();}catch{}}
 finally{b.disabled=false;}
};


/* RPG Solo independente: usuário autenticado, aventuras do Gerador e campanhas privadas. */
GENEROS.forEach(g=>$('solo-genero').appendChild(new Option(g,g)));
TONS.forEach(t=>$('solo-tom').appendChild(new Option(t,t)));
let soloCampanhaId=null;
let soloOrigens=[];
let soloOcupado=false;
let soloOrigemPreferida=null,soloTituloPreferido='',soloPersonagemPreferido=null,soloRetomarFicha=false,soloPersonagens=[];
$('solo-personagem').onchange=()=>{$('solo-personagem-info').textContent=$('solo-personagem').value?'A ficha orienta o Mestre IA, que não decide as ações do protagonista.':'Use uma ficha já criada ou faça outra.';};
$('solo-criar-personagem').onclick=()=>{
 if(!eu.logado){mostrar('conta');return;}
 soloOrigemPreferida=Number($('solo-aventura').value)||soloOrigemPreferida;
 soloTituloPreferido=$('solo-titulo-campanha').value;
 soloRetomarFicha=true;mostrar('personagens');limparFicha();
 aviso('Salve a nova ficha para voltar à preparação da jornada.');
};
function soloEstado(mensagem,erro=false){
 const e=$('solo-alerta');e.textContent=mensagem||'';e.classList.toggle('erro',erro);
}
async function soloAtualizarInicio(){
 $('solo-entrada').hidden=false;$('solo-jogo').hidden=true;soloCampanhaId=null;
 const lista=$('solo-lista');lista.replaceChildren();
 const select=$('solo-aventura'),anterior=select.value;select.replaceChildren(new Option('Criar com uma ideia minha',''));
 if(!eu.logado){
  soloEstado('Entre na sua conta para criar campanhas e salvar seu progresso.');
  lista.appendChild(el('p','As campanhas solo ficam vinculadas à sua conta. Faça login pelo menu Entrar.','suave'));
  $('solo-criar').disabled=true;
  return;
 }
 $('solo-criar').disabled=false;soloEstado('');
 try{
  const [aventuras,campanhas,personagens]=await Promise.all([api('/api/aventuras'),api('/api/solo/campanhas'),api('/api/personagens')]);
  soloPersonagens=personagens;
  const psel=$('solo-personagem');psel.replaceChildren(new Option('Sem ficha por enquanto',''));
  for(const p of personagens)psel.add(new Option(p.nome+(p.dados?.classe?' · '+p.dados.classe:''),String(p.id)));
  if(soloPersonagemPreferido&&personagens.some(p=>Number(p.id)===Number(soloPersonagemPreferido)))psel.value=String(soloPersonagemPreferido);
  psel.onchange();
  soloOrigens=aventuras;
  for(const a of aventuras)select.appendChild(new Option(a.conteudo?.titulo||'Aventura sem título',String(a.id)));
  if(soloOrigemPreferida&&aventuras.some(a=>Number(a.id)===Number(soloOrigemPreferida)))select.value=String(soloOrigemPreferida);
  else if([...select.options].some(o=>o.value===anterior))select.value=anterior;
  if(select.value)select.onchange();
  if(soloTituloPreferido&&!$('solo-titulo-campanha').value.trim())$('solo-titulo-campanha').value=soloTituloPreferido;
  if(!campanhas.length)lista.appendChild(el('p','Você ainda não possui campanhas solo. Crie uma acima!','suave'));
  for(const c of campanhas){
   const linha=el('article','','solo-salva');
   const abrir=el('button',c.titulo,'guia-abrir');abrir.type='button';abrir.onclick=()=>soloAbrir(c.id);
   const metadados=el('span',c.turno_atual+' ações · '+new Date(c.atualizado_em).toLocaleDateString('pt-BR'),'suave');
   const excluir=el('button','Excluir','apagar');excluir.type='button';
   excluir.onclick=async()=>{
    if(!confirm('Excluir a campanha e TODO o histórico? Esta ação não pode ser desfeita.'))return;
    try{await api('/api/solo/campanhas/'+c.id,'DELETE');await soloAtualizarInicio();}
    catch(e){soloEstado(e.message,true);}
   };
   linha.append(abrir,metadados,excluir);lista.appendChild(linha);
  }
 }catch(e){soloEstado('Não foi possível carregar campanhas: '+e.message,true);}
}
$('solo-recarregar').onclick=soloAtualizarInicio;
$('solo-aventura').onchange=()=>{
 const origem=soloOrigens.find(x=>String(x.id)===$('solo-aventura').value);
 if(origem){
  if(GENEROS.includes(origem.genero))$('solo-genero').value=origem.genero;
  if(TONS.includes(origem.tom))$('solo-tom').value=origem.tom;
  if(!$('solo-titulo-campanha').value.trim())$('solo-titulo-campanha').value=(origem.conteudo?.titulo||'Minha campanha').slice(0,140);
  $('solo-ajuda-origem').textContent='Você pode adicionar novas ideias abaixo. A IA usará a história salva como ponto de partida.';
 }else $('solo-ajuda-origem').textContent='Escreva uma ideia própria para iniciar uma campanha nova.';
};
function soloMensagem(papel,texto,tipo='acao',teste=null,numero=null){
 const art=el('article','','solo-mensagem '+(papel==='mestre'?'mestre':'jogador'));
 art.appendChild(el('strong',papel==='mestre'?'✧ Mestre IA':tipo==='ajuste'?'✎ Modificação solicitada':'♙ Você'));
 const p=el('p',texto);art.appendChild(p);
 if(papel==='mestre')acessibilidadeBotaoLer(art,()=>p.textContent);
 $('solo-mensagens').appendChild(art);
 if(papel==='mestre'&&teste&&Number.isInteger(Number(numero)))soloAdicionarTeste(art,teste,Number(numero));
 return art;
}
function soloAdicionarTeste(art,teste,numero){
 if(!teste||![4,6,8,10,12,20,100].includes(Number(teste.dado))||!Number.isInteger(Number(teste.quantidade))||Number(teste.quantidade)<1||Number(teste.quantidade)>5)return;
 const caixa=el('div','','solo-teste');
 caixa.appendChild(el('strong','🎲 '+(teste.nome||'Teste solicitado'),'solo-teste-nome'));
 const formula=Number(teste.quantidade)+'d'+Number(teste.dado)+(Number(teste.modificador)?(teste.modificador>0?'+':'')+teste.modificador:'');
 caixa.appendChild(el('p','Role '+formula+(Number.isInteger(teste.dificuldade)?' · Dificuldade '+teste.dificuldade:''),'solo-teste-formula'));
 caixa.appendChild(el('p',teste.explicacao||'O dado indica o resultado de uma ação incerta.','solo-teste-explicacao'));
 const palco=el('div','','solo-dado-animacao');
 caixa.appendChild(palco);
  const botao=el('button','🎲 Rolar '+formula,'guia-abrir');botao.type='button';
 botao.onclick=async()=>{
  if(soloOcupado||!soloCampanhaId)return;
  soloOcupado=true;botao.disabled=true;$('solo-enviar').disabled=true;$('solo-voltar').disabled=true;
  const animacao=iniciarAnimacaoDado(palco,Number(teste.dado),Number(teste.quantidade));
  acessibilidadeSomDado();
  const texto=el('p','Rolando e consultando o Mestre IA...','solo-teste-status');caixa.appendChild(texto);
  try{
   const r=await api('/api/solo/campanhas/'+soloCampanhaId+'/turnos','POST',{tipo:'rolagem',numero});
   const v=r.rolagem;
   animacao.concluir(v.valores);
   const resultado='🎲 '+v.nome+': '+v.valores.join(' + ')+' ('+v.quantidade+'d'+v.dado+') '+(v.modificador>=0?'+ ':'- ')+Math.abs(v.modificador)+' = '+v.total+(v.passou===null?'':v.passou?' · Sucesso!':' · Falha');
   soloMensagem('jogador',resultado,'acao');
   soloMensagem('mestre',r.narracao,'acao',r.teste,r.numero);
   botao.remove();texto.textContent='Resultado registrado nesta campanha.';
   soloEstado('');
  }catch(e){animacao.cancelar();palco.replaceChildren();texto.textContent=e.message;botao.disabled=false;soloEstado('Não foi possível concluir a rolagem: '+e.message,true);}
  finally{soloOcupado=false;$('solo-enviar').disabled=false;$('solo-voltar').disabled=false;soloFimLista();}
 };
 caixa.appendChild(botao);art.appendChild(caixa);
}
function soloFimLista(){
 const painel=$('solo-mensagens');painel.scrollTop=painel.scrollHeight;
}
async function soloAbrir(id){
 if(soloOcupado)return;
 soloEstado('');
 try{
  const r=await api('/api/solo/campanhas/'+id);
  soloCampanhaId=r.campanha.id;
  $('solo-jogo-titulo').textContent=r.campanha.titulo;
  $('solo-mensagens').replaceChildren();
  for(const msg of r.mensagens)soloMensagem(msg.papel,msg.texto,msg.tipo,
    msg.papel==='mestre'&&Number(msg.numero)===Number(r.campanha.turno_atual)?msg.teste:null,msg.numero);
  soloMostrarTrilha(r.campanha.genero,r.campanha.tom);
  $('solo-entrada').hidden=true;$('solo-jogo').hidden=false;
  $('solo-acao').value='';soloFimLista();
 }catch(e){soloEstado(e.message,true);}
}
function soloMostrarTrilha(genero,tom,sugestao=''){$('solo-trilha').replaceChildren();playerDaHistoria($('solo-trilha'),genero,tom,sugestao);}
$('solo-voltar').onclick=()=>{
 if(soloOcupado)return;
 soloAtualizarInicio();
};
$('solo-form').onsubmit=async ev=>{
 ev.preventDefault();if(soloOcupado)return;
 const origem=$('solo-aventura').value,ideiaOriginal=$('solo-ideia').value.trim();
 const personagem=soloPersonagens.find(p=>String(p.id)===$('solo-personagem').value);
 const protagonista=personagem?'\n\n[Protagonista: '+JSON.stringify({nome:personagem.nome,classe:personagem.dados?.classe,cenario:personagem.dados?.cenario,nivel:personagem.dados?.nivel,especialidade:personagem.dados?.especialidade,historia:personagem.dados?.notas,habilidades:personagem.dados?.habilidades?.slice(0,8)?.map(h=>h.nome)}).slice(0,650)+'. Respeite a ficha e não controle o protagonista.]':'';
 const nivel=$('solo-experiencia').value,regras=$('solo-regras').value,guia=$('solo-guia').value;
 const preferencias=`[Preferências de jogo: experiência=${nivel}; regras=${regras}; tutorial=${guia}. ${guia==='sim'?'Apresente instruções curtas sobre ações, testes e escolhas durante a primeira cena.':'Não faça tutorial inicial, explique regras quando solicitado.'} Não controle as ações do personagem.]`;
 const ideia=((ideiaOriginal?ideiaOriginal+'\n\n':'')+preferencias+protagonista).slice(0,3000);
 if(!origem&&!ideiaOriginal){soloEstado('Selecione uma história do Gerador ou descreva sua ideia.',true);return;}
 soloOcupado=true;$('solo-criar').disabled=true;soloEstado('O Mestre IA está preparando a primeira cena...');
 try{
  const r=await api('/api/solo/campanhas','POST',{
   titulo:$('solo-titulo-campanha').value.trim(),genero:$('solo-genero').value,
   tom:$('solo-tom').value,aventuraId:origem?Number(origem):null,ideia
  });
  await soloAbrirDepoisCriar(r);
 }catch(e){soloEstado(e.message,true);}
 finally{soloOcupado=false;$('solo-criar').disabled=false;}
};
async function soloAbrirDepoisCriar(r){
 soloCampanhaId=r.campanha.id;
 $('solo-jogo-titulo').textContent=r.campanha.titulo;
 $('solo-mensagens').replaceChildren();
 soloMensagem('mestre',r.mestre,'inicio',r.teste,0);
  soloMostrarTrilha($('solo-genero').value,$('solo-tom').value,soloOrigens.find(a=>String(a.id)===$('solo-aventura').value)?.conteudo?.trilha||'');
 $('solo-entrada').hidden=true;$('solo-jogo').hidden=false;soloEstado('');
 $('solo-acao').value='';soloFimLista();
}
$('solo-acao-form').onsubmit=async ev=>{
 ev.preventDefault();if(soloOcupado||!soloCampanhaId)return;
 const acao=$('solo-acao').value.trim(),tipo=$('solo-tipo').value;
 if(!acao)return;
 soloOcupado=true;$('solo-enviar').disabled=true;$('solo-voltar').disabled=true;
 soloEstado('O Mestre IA está narrando a consequência...');
 const rascunho=soloMensagem('jogador',acao,tipo);
 const esperando=soloMensagem('mestre','Escrevendo a próxima cena...');
 soloFimLista();
 try{
  const r=await api('/api/solo/campanhas/'+soloCampanhaId+'/turnos','POST',{acao,tipo});
  esperando.querySelector('p').textContent=r.narracao;
  if(r.teste)soloAdicionarTeste(esperando,r.teste,r.numero);
  $('solo-acao').value='';soloEstado('');
 }catch(e){
  rascunho.remove();esperando.remove();soloEstado(e.message,true);
 }finally{soloOcupado=false;$('solo-enviar').disabled=false;$('solo-voltar').disabled=false;soloFimLista();}
};

// Animação compartilhada pelas ferramentas, sem compartilhar estado ou resultados.
// O número exibido ao final vem da rolagem já calculada (no Solo, pelo servidor).
function iniciarAnimacaoDado(alvo,lados,quantidade=1){
 const anterior=alvo._mesaAnimacao;
 if(anterior)anterior.cancelar();
 const reduz=acessibilidadeMovimentoReduzido();
 const formas={
  4:['65,7 115,109 15,109','65,7 65,109 15,109 65,7 115,109'],
  6:['65,10 117,38 117,91 65,119 13,91 13,38','65,10 65,64 117,38 65,64 65,119 65,64 13,38'],
  8:['65,6 117,62 65,119 13,62','65,6 65,119 13,62 117,62'],
  10:['65,6 113,44 104,91 65,120 26,91 17,44','65,6 65,120 17,44 65,6 113,44'],
  12:['65,6 96,15 118,41 118,82 91,112 65,121 39,112 12,82 12,41 34,15','65,6 65,121 12,41 118,82 12,82 118,41'],
  20:['65,5 103,17 122,63 104,104 65,121 26,104 8,63 27,17','65,5 65,121 8,63 122,63 27,17 104,104 103,17 26,104'],
  100:['65,4 101,15 125,49 119,87 90,116 43,116 12,86 5,49 29,15','65,4 65,116 5,49 125,49 29,15 90,116']
 };
 const shape=formas[lados]||formas[20];
 const container=el('div','','mesa-dado-palco');
 const svgNS='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 130 130');
 svg.setAttribute('aria-hidden','true');svg.classList.add('mesa-dado-svg','mesa-dado-d'+lados);
 const face=document.createElementNS(svgNS,'polygon');face.setAttribute('points',shape[0]);face.setAttribute('class','mesa-dado-face');
 const riscos=document.createElementNS(svgNS,'polyline');riscos.setAttribute('points',shape[1]);riscos.setAttribute('class','mesa-dado-facetas');
 const numero=document.createElementNS(svgNS,'text');numero.setAttribute('x','65');numero.setAttribute('y','74');numero.setAttribute('class','mesa-dado-numero');numero.setAttribute('text-anchor','middle');
 numero.textContent='?';svg.append(face,riscos,numero);
 const legenda=el('span',quantidade+'d'+lados+' · Rolando...','mesa-dado-legenda');
 const dado=el('div','','mesa-dado-objeto');dado.appendChild(svg);
 container.append(dado,legenda);
 alvo.replaceChildren(container);
 let token=0,interval=null,timeout=null;
 const gerarNumero=()=>1+Math.floor(Math.random()*lados);
 if(!reduz){
  dado.classList.add('girando');
  interval=setInterval(()=>{numero.textContent=String(gerarNumero());},75);
 }else numero.textContent='…';
 const limpar=()=>{if(interval!==null){clearInterval(interval);interval=null;}if(timeout!==null){clearTimeout(timeout);timeout=null;}};
 const api={
  concluir(valores){
   if(alvo._mesaAnimacao!==api)return;
   limpar();dado.classList.remove('girando');dado.classList.add('concluido');
   const lista=Array.isArray(valores)?valores:[valores];
   const primeira=Number(lista[0]);numero.textContent=Number.isFinite(primeira)?String(primeira):'?';
   legenda.textContent=quantidade+'d'+lados+' · '+(lista.length>1?lista.join(' + '):'Resultado: '+primeira);
   container.setAttribute('aria-label',legenda.textContent);
  },
  cancelar(){
   limpar();if(alvo._mesaAnimacao===api)delete alvo._mesaAnimacao;
   dado.classList.remove('girando');
  }
 };
 alvo._mesaAnimacao=api;
 return api;
}

// ---- Dados e tutorial para iniciantes ----
$('abrir-guia-dados').onclick = () => {
  const painel = $('guia-dados');
  painel.hidden = !painel.hidden;
  $('abrir-guia-dados').setAttribute('aria-expanded', String(!painel.hidden));
  $('abrir-guia-dados').textContent = painel.hidden ? 'Ver tutorial dos dados ↓' : 'Fechar tutorial ↑';
};
[4, 6, 8, 10, 12, 20, 100].forEach((lados) => {
 const b=el('button','d'+lados,'dado');b.type='button';
 b.onclick=()=>{
  const q=Math.min(20,Math.max(1,parseInt($('qtd').value,10)||1));
  const v=Array.from({length:q},()=>1+Math.floor(Math.random()*lados));
  const palco=$('dados-animacao'),a=iniciarAnimacaoDado(palco,lados,q);
  acessibilidadeSomDado();
  $('total').textContent='🎲';$('detalhe').textContent='Rolando '+q+'d'+lados+'...';
  const concluir=()=>{
   if(palco._mesaAnimacao!==a)return;
   a.concluir(v);$('total').textContent=v.reduce((x,y)=>x+y,0);
   $('detalhe').textContent=q+'d'+lados+': '+v.join(' + ');
  };
  if(acessibilidadeMovimentoReduzido())concluir();
  else setTimeout(concluir,950);
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
      abrir.onclick = () => {pararJornada();desenharAventura(i.conteudo,$('saida-hist'),i.id,i.genero,i.tom);};
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
function exigirPersonagemSalvo(){
  if(fichaAbertaId)return true;
  const mensagem='Selecione um personagem existente ou crie e salve uma ficha antes de modificar o inventário.';
  aviso(mensagem);
  if($('p-inventario-aviso')){
    $('p-inventario-aviso').hidden=false;
    $('p-inventario-aviso').textContent=mensagem;
  }
  return false;
}
function atualizarKit(){
 const kit=sugerirEquipamentos();
 // Mantenha o clique ativo para explicar por que ainda não é possível gerar itens.
 $('p-gerar-kit').disabled=false;
 $('p-kit-origem').textContent=!fichaAbertaId
 ? 'Selecione um personagem existente ou crie e salve uma ficha para editar o inventário.'
 : kit ? 'Sugestão para '+kit.descricao+'. Revise os itens com o mestre.'
 : 'Selecione cenário e classe ou especialidade para sugerir equipamentos.';
 if($('p-inventario-aviso'))$('p-inventario-aviso').hidden=Boolean(fichaAbertaId);
}
$('p-gerar-kit').onclick=()=>{
 if(!exigirPersonagemSalvo())return;
 const kit=sugerirEquipamentos();
 if(!kit){aviso('Escolha uma classe ou especialidade na aba Identidade para receber uma sugestão de kit.');abrirAbaFicha('identidade');return;}
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


const sons={
 floresta:['Medieval Dream','Frank Schröter','CC BY 4.0','Medieval_Dream_by_Frank_Schr%C3%B6ter.ogg'],
 taverna:['Medieval Story','Frank Schröter','CC BY 4.0','Medieval_Story_by_Frank_Schr%C3%B6ter.ogg'],
 jornada:['Chominciamento de Gioia','Ririkuku','CC BY-SA 4.0','Chominciamento_de_Gioia1.ogg']
};
const audioJornada=new Audio();audioJornada.loop=true;let tocadorJornada=null;
function pararJornada(){audioJornada.pause();audioJornada.removeAttribute('src');if(tocadorJornada){tocadorJornada.b.textContent='▶ Tocar';tocadorJornada.s.textContent='Pausado';}tocadorJornada=null;}
function playerDaHistoria(alvo,genero='',tom='',sugestao=''){
 const p=el('section','','jornada-player');p.append(el('span','♫ TRILHA DA JORNADA','sobretitulo'),el('h3','Música ambiente'));
 if(sugestao)p.append(el('p','Atmosfera sugerida: '+sugestao,'jornada-sugestao'));
 p.append(el('p','Ouça uma das gravações licenciadas que combinam com o cenário. Não são necessariamente as faixas citadas pela IA.','suave'));
 const linha=el('div','','jornada-controles'),sel=document.createElement('select');sel.setAttribute('aria-label','Música da jornada');
 for(const [id,v] of Object.entries(sons))sel.add(new Option(v[0]+' · '+v[1],id));
 const texto=(genero+' '+tom+' '+sugestao).toLowerCase();
 sel.value=/terror|sombr|florest|investiga|mist[eé]r/.test(texto)?'floresta':/pirata|mar|taverna|leve|alegr/.test(texto)?'taverna':'jornada';
 const b=el('button','▶ Tocar','guia-abrir');b.type='button';
 const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=100;volume.value=30;volume.setAttribute('aria-label','Volume');
 const estado=el('p','Pronto para tocar','suave'),fonte=el('a','','jornada-fonte');fonte.target='_blank';fonte.rel='noopener noreferrer';
 const url=(base,v)=>'https://commons.wikimedia.org/wiki/'+base+v[3];
 const atualiza=()=>{const v=sons[sel.value];fonte.href=url('File:',v);fonte.textContent=v[1]+' · '+v[2]+' · Fonte ↗';};atualiza();
 sel.onchange=()=>{if(tocadorJornada?.b===b)pararJornada();atualiza();};
 volume.oninput=()=>{if(tocadorJornada?.b===b)audioJornada.volume=Number(volume.value)/100;};
 b.onclick=async()=>{
  if(tocadorJornada?.b===b&&!audioJornada.paused){pararJornada();return;}
  pararJornada();const v=sons[sel.value];tocadorJornada={b,s:estado};audioJornada.src=url('Special:Redirect/file/',v);audioJornada.volume=Number(volume.value)/100;b.disabled=true;b.textContent='Carregando...';
  try{await audioJornada.play();b.textContent='❚❚ Pausar';estado.textContent='Tocando '+v[0];}
  catch{pararJornada();estado.textContent='Não foi possível carregar. Abra a fonte para ouvir.';}
  finally{b.disabled=false;}
 };
 linha.append(sel,b,volume);p.append(linha,estado,fonte);alvo.append(p);
}
window.addEventListener('pagehide',pararJornada);
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
let avatarPendente=null;
function atualizarEstadoAvatar(){
  const salvo=Boolean(fichaAbertaId);
  $('p-avatar-file').disabled=false;
  if(avatarPendente&&!salvo){
    $('p-avatar-info').textContent='Foto selecionada: '+avatarPendente.name+'. Clique em Salvar ficha ao final do formulário; o retrato será enviado automaticamente.';
    return;
  }
  $('p-avatar-info').textContent=salvo
    ? 'Escolha uma foto para esta ficha. O retrato fica privado na sua conta.'
    : 'Você pode escolher uma foto agora. Salve a ficha para enviar o retrato automaticamente.';
}
async function carregarAvatar(){
  limparPreviewAvatar();
  atualizarEstadoAvatar();
  if(!fichaAbertaId)return;
  const id=fichaAbertaId;
  try{
    const response=await fetch(API_BASE_URL+'/api/personagens/'+id+'/avatar',{credentials:'include',cache:'no-store'});
    if(response.status===404)return;
    if(!response.ok)throw new Error('Não foi possível carregar o retrato salvo.');
    const blob=await response.blob();
    if(fichaAbertaId!==id)return;
    avatarObjectUrl=URL.createObjectURL(blob);
    $('p-avatar-img').src=avatarObjectUrl;
    $('p-avatar-img').hidden=false;
    $('p-avatar-vazio').hidden=true;
    $('p-avatar-remover').hidden=false;
  }catch(e){
    $('p-avatar-info').textContent=e.message||'Não foi possível carregar a foto. Tente novamente.';
  }
}
async function prepararWebpAvatar(arquivo){
  const extensao=arquivo.name?.toLowerCase()||'';
  if(!arquivo.type.startsWith('image/')&&!/\.(jpg|jpeg|png|webp|heic|heif)$/.test(extensao))
    throw new Error('Escolha uma foto válida (JPG, PNG, WebP ou foto do celular).');
  if(arquivo.size>8*1024*1024)throw new Error('A foto tem mais de 8 MB. Escolha uma imagem menor.');
  const url=URL.createObjectURL(arquivo);
  try{
    const foto=new Image();
    foto.src=url;
    try{await foto.decode();}catch{throw new Error('Este formato de foto não pôde ser aberto pelo navegador. No celular, tente compartilhar ou salvar a foto em JPG ou PNG.');}
    if(foto.width<32||foto.height<32)throw new Error('Imagem pequena demais.');
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Seu navegador não suporta o processamento desta imagem.');
    const recorte=Math.min(foto.width,foto.height);
    // Dimensões e qualidade adaptáveis, para caber no limite do bucket mesmo com fotos complexas.
    for(const tamanho of [400,320,256,192]){
      canvas.width=tamanho;canvas.height=tamanho;
      ctx.drawImage(foto,(foto.width-recorte)/2,(foto.height-recorte)/2,recorte,recorte,0,0,tamanho,tamanho);
      for(const qualidade of [.82,.67,.5]){
        const resultado=canvas.toDataURL('image/webp',qualidade);
        if(!resultado.startsWith('data:image/webp;base64,'))throw new Error('Seu navegador não conseguiu converter a foto para WebP.');
        const base64=resultado.slice('data:image/webp;base64,'.length);
        if(base64.length<=510000)return base64;
      }
    }
    throw new Error('Esta foto continua grande demais depois da otimização. Experimente uma imagem menor.');
  }finally{URL.revokeObjectURL(url);}
}
async function enviarAvatar(arquivo,id){
  const campo=$('p-avatar-file');
  campo.disabled=true;
  $('p-avatar-info').textContent='Otimizando a foto e enviando...';
  try{
    const imagem=await prepararWebpAvatar(arquivo);
    if(fichaAbertaId!==id)throw new Error('A ficha selecionada mudou. Abra o personagem e tente novamente.');
    await api('/api/personagens/'+id+'/avatar','POST',{imagem});
    avatarPendente=null;
    await carregarAvatar();
    aviso('Retrato salvo com sucesso!',true);
    $('p-avatar-info').textContent='Retrato salvo! Você pode trocar a foto quando quiser.';
    return true;
  }catch(e){
    $('p-avatar-info').textContent='Falha no envio: '+e.message;
    aviso(e.message);
    return false;
  }finally{
    campo.value='';
    campo.disabled=false;
  }
}
$('p-avatar-file').onchange=async()=>{
  const arquivo=$('p-avatar-file').files?.[0];
  if(!arquivo)return;
  avatarPendente=arquivo;
  if(!fichaAbertaId){
    atualizarEstadoAvatar();
    return;
  }
  await enviarAvatar(arquivo,fichaAbertaId);
};
$('p-avatar-remover').onclick=async()=>{
  if(!fichaAbertaId||!confirm('Remover o retrato desta personagem?'))return;
  try{
    await api('/api/personagens/'+fichaAbertaId+'/avatar','DELETE');
    avatarPendente=null;
    limparPreviewAvatar();
    atualizarEstadoAvatar();
    aviso('Retrato removido.',true);
  }catch(e){$('p-avatar-info').textContent='Não foi possível remover o retrato: '+e.message;aviso(e.message);}
};
// ---- Ficha em abas: preserva os campos e a compatibilidade com fichas antigas ----
const secoesFicha=['identidade','atributos','inventario','habilidades','historia'];
function abrirAbaFicha(nome){
  if(!secoesFicha.includes(nome))return;
  estadoNavegacao.gravar('aba-ficha',nome);
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
  if(!exigirPersonagemSalvo())return;
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
  if(!exigirPersonagemSalvo())return;
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
  avatarPendente=null;
  fichaAbertaId=null;
  estadoNavegacao.gravar('personagem',null);
  destacarPersonagemSelecionado();
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
function destacarPersonagemSelecionado(){
  document.querySelectorAll('#personagens-lista .personagem-item').forEach(botao=>{
    const ativo=Boolean(fichaAbertaId)&&Number(botao.dataset.personagemId)===Number(fichaAbertaId);
    botao.classList.toggle('personagem-selecionado',ativo);
    botao.setAttribute('aria-pressed',String(ativo));
    botao.setAttribute('aria-current',ativo?'true':'false');
  });
}
async function carregarPersonagens(){
  const lista=$('personagens-lista');lista.replaceChildren();
  try{
    const itens=await api('/api/personagens');
    if(!itens.length){
      if(fichaAbertaId||estadoNavegacao.ler('personagem'))limparFicha();
      lista.appendChild(el('p','Nenhuma ficha salva ainda. Comece criando sua primeira personagem.','suave'));
      atualizarKit();
      return;
    }
    for(const item of itens) {
      const botao=el('button',(item.nome||'Personagem')+(item.dados.metodo==='livre'?' · '+(item.dados.especialidade||'Narrativa'):' · Nível '+item.dados.nivel),'personagem-item');
      botao.type='button';
      botao.dataset.personagemId=String(item.id);
      botao.setAttribute('aria-pressed','false');
      botao.onclick=(evento)=>{
        const restaurando=evento?.restaurar===true;
        const abaRestaurada=restaurando?estadoNavegacao.ler('aba-ficha'):null;
        avatarPendente=null;
        fichaAbertaId=item.id;
        estadoNavegacao.gravar('personagem',item.id);
        destacarPersonagemSelecionado();
        carregarAvatar();
        const d=item.dados;
        $('p-nome').value=d.nome||'';
        $('p-classe').value=d.classe||'';
        $('p-especie').value=d.especie||'';
        $('p-antecedente').value=d.antecedente||'';
        $('p-nivel').value=d.nivel||1;
        $('p-notas').value=d.notas||'';
        restaurarExtrasFicha(d);
        abrirAbaFicha(abaRestaurada&&secoesFicha.includes(abaRestaurada)?abaRestaurada:'identidade');
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
        if(!restaurando)$('f-personagem').scrollIntoView({behavior:'smooth',block:'start'});
      };
      lista.appendChild(botao);
    }
    const idAnterior=fichaAbertaId||Number(estadoNavegacao.ler('personagem'));
    if(idAnterior){
      const botao=[...lista.querySelectorAll('[data-personagem-id]')].find(b=>Number(b.dataset.personagemId)===Number(idAnterior));
      if(botao)botao.onclick({restaurar:true});
      else limparFicha();
    }
    destacarPersonagemSelecionado();
    atualizarKit();
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
    const abaAtual=estadoNavegacao.ler('aba-ficha')||'identidade';
    const resposta=await api(fichaAbertaId?'/api/personagens/'+fichaAbertaId:'/api/personagens',fichaAbertaId?'PUT':'POST',{dados});
    if(!fichaAbertaId&&resposta?.id)fichaAbertaId=resposta.id;
    const fotoAEnviar=avatarPendente;
    avatarPendente=null;
    estadoNavegacao.gravar('personagem',fichaAbertaId);
    estadoNavegacao.gravar('aba-ficha',abaAtual);
    await carregarPersonagens();
    abrirAbaFicha(abaAtual);
    aviso('Ficha salva com sucesso! O personagem continua selecionado.',true);
    if(fotoAEnviar&&fichaAbertaId)await enviarAvatar(fotoAEnviar,fichaAbertaId);
    if(soloRetomarFicha){soloRetomarFicha=false;soloPersonagemPreferido=fichaAbertaId;mostrar('solo');}
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
async function entrar(url, email, senha, tokenBootstrap, manterConectado = false, aceiteTermos = false) {
  try {
    await api(url, 'POST', { email, senha, manterConectado, aceiteTermos, ...(tokenBootstrap ? { tokenBootstrap } : {}) });
    await atualizarEu(); mostrar('gerador'); aviso('Tudo certo!', true);
  }
  catch (e) { aviso(e.message); }
  finally { if (tokenBootstrap) $('c-token-bootstrap').value = ''; }
}
$('f-login').onsubmit = (ev) => { ev.preventDefault(); entrar('/api/login', $('l-email').value, $('l-senha').value, undefined, $('l-manter').checked); };
$('f-cadastro').onsubmit = (ev) => { ev.preventDefault(); if(!$('c-aceite-termos').checked){aviso('Leia e aceite os Termos de Uso para criar sua conta.');return;} entrar('/api/cadastro', $('c-email').value, $('c-senha').value, $('c-token-bootstrap').value, false, true); };

// ---- Painel do dono ----
// Central do Mestre. Texto remoto sempre tratado como texto, nunca como HTML.
let adminSecao='geral';
const adminData={};
function add(t,pai,valor,classe){const n=el(t,valor,classe);pai.append(n);return n;}
function mensagemAdmin(msg,erro=false){const n=$('admin-feedback');n.textContent=msg;n.className=erro?'admin-erro':'admin-ok';}
function adminLinha(pai,...valores){const row=add('div',pai,'','admin-linha');valores.forEach(x=>add('span',row,String(x??'—')));return row;}
function adminTitulo(pai,titulo,descricao){add('h2',pai,titulo);if(descricao)add('p',pai,descricao,'suave');}
function dataBR(iso){return iso?new Date(iso).toLocaleDateString('pt-BR'):'Nunca';}
function campoAdmin(form,nome,tipo,valor='',opcoes){
  const label=add('label',form,nome);
  const campo=opcoes?document.createElement('select'):document.createElement(tipo==='longo'?'textarea':'input');
  if(tipo!=='longo'&&!opcoes)campo.type=tipo==='check'?'checkbox':(tipo||'text');
  if(opcoes)opcoes.forEach(([valor,rotulo])=>{const opt=document.createElement('option');opt.value=valor;opt.textContent=rotulo;campo.append(opt);});
  if(tipo==='longo')campo.rows=4;
  if(tipo==='check'){campo.checked=Boolean(valor);}else campo.value=String(valor??'');
  label.append(campo);return campo;
}
function botaoAdmin(pai,rotulo,acao,classe='guia-abrir'){
  const b=add('button',pai,rotulo,classe);b.type='button';b.onclick=acao;return b;
}
async function acaoAdmin(fn,ok){
 try{await fn();mensagemAdmin(ok);await carregarResumo();}catch(e){mensagemAdmin(e.message,true);}
}
function desenharBarras(alvo,dados,chave,rotulo){
 const valores=dados.map(x=>Number(x[chave])||0),max=Math.max(1,...valores);
 if(!dados.length){add('p',alvo,'Sem dados para mostrar.','suave');return;}
 const area=add('div',alvo,'','admin-grafico');
 dados.forEach((item,i)=>{
  const linha=add('div',area,'','admin-barra-linha');
  add('span',linha,String(item[rotulo]).slice(0,35));
  const trilho=add('div',linha,'','admin-barra-trilho');
  const barra=add('div',trilho,'','admin-barra-valor');barra.style.width=(valores[i]/max*100)+'%';
  add('strong',linha,String(valores[i]));
 });
}
async function adminExibirGeral(alvo){
 const r=await api('/api/admin/dashboard');
 adminTitulo(alvo,'Visão geral','Indicadores reais da plataforma, atualizados sob demanda.');
 const grade=add('div',alvo,'','admin-indicadores');
 [['Usuários',r.indicadores.usuarios],['Aventuras',r.indicadores.aventuras],['Personagens',r.indicadores.personagens],['Aventuras hoje',r.indicadores.aventuras_hoje],['Chamados pendentes',r.indicadores.chamados_abertos]].forEach(([titulo,numero])=>{
  const card=add('div',grade,'','admin-indicador');add('small',card,titulo);add('strong',card,String(numero));
 });
 adminTitulo(alvo,'Atividade recente','Aventuras salvas nos últimos 14 dias (UTC).');
 desenharBarras(alvo,r.serie,'total','dia');
}
async function adminExibirRelatorios(alvo){
 const r=await api('/api/admin/dashboard');
 adminTitulo(alvo,'Relatórios e tendências','Estatísticas agregadas, sem expor histórias privadas.');
 add('h3',alvo,'Aventuras nos últimos 14 dias');
 desenharBarras(alvo,r.serie,'total','dia');
 add('h3',alvo,'Gêneros mais utilizados');
 desenharBarras(alvo,r.cenarios,'total','genero');
 botaoAdmin(alvo,'Exportar dados agregados (CSV)',()=>{
  const linhas=[['tipo','nome','total'],...r.serie.map(x=>['dia',x.dia,x.total]),...r.cenarios.map(x=>['genero',x.genero,x.total])];
  const csv=linhas.map(a=>a.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const arquivo=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(arquivo),a=document.createElement('a');
  a.href=url;a.download='mesa-relatorios.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
}
async function adminExibirUsuarios(alvo,pagina=1,busca=''){
 adminTitulo(alvo,'Gerenciamento de usuários','Consulte contas e aplique suspensões temporárias. Contas administrativas são protegidas.');
 const buscaForm=add('form',alvo,'','admin-busca');const buscaInput=campoAdmin(buscaForm,'Buscar por e-mail','search',busca);const submit=add('button',buscaForm,'Buscar','principal');submit.type='submit';
 buscaForm.onsubmit=e=>{e.preventDefault();const termo=buscaInput.value;alvo.replaceChildren();adminExibirUsuarios(alvo,1,termo).catch(x=>mensagemAdmin(x.message,true));};
 const r=await api('/api/admin/usuarios?pagina='+pagina+'&busca='+encodeURIComponent(busca));
 const box=add('div',alvo,'','admin-lista');
 if(!r.usuarios.length)add('p',box,'Nenhuma conta encontrada.');
 r.usuarios.forEach(u=>{
  const card=add('article',box,'','admin-registro');
  add('strong',card,u.email);
  add('p',card,'Tipo: '+u.papel+' · Cadastro: '+dataBR(u.criado_em)+' · Último login: '+dataBR(u.ultimo_login_em),'suave');
  if(u.bloqueado_ate&&new Date(u.bloqueado_ate)>new Date())add('p',card,'Suspenso até '+dataBR(u.bloqueado_ate),'admin-atencao');
  if(u.papel!=='admin'){
   const controles=add('div',card,'','admin-registro-acoes');
   const prazo=campoAdmin(controles,'Suspensão','select','1',[['0','Reativar'],['1','1 dia'],['7','7 dias'],['30','30 dias']]);
   const botao=botaoAdmin(controles,'Aplicar',()=>{const dias=Number(prazo.value);if(!confirm('Confirma '+(dias?'suspensão por '+dias+' dia(s)':'reativação')+' da conta '+u.email+'?'))return;acaoAdmin(()=>api('/api/admin/usuarios/'+u.id+'/suspensao','PATCH',{dias}),'Conta atualizada.');});
  }
 });
 const paginas=Math.max(1,Math.ceil(r.total/20));
 add('p',alvo,'Página '+r.pagina+' de '+paginas+' · '+r.total+' contas','suave');
 const nav=add('div',alvo,'','admin-registro-acoes');
 if(pagina>1)botaoAdmin(nav,'← Anterior',()=>{alvo.replaceChildren();adminExibirUsuarios(alvo,pagina-1,busca).catch(x=>mensagemAdmin(x.message,true));});
 if(pagina<paginas)botaoAdmin(nav,'Próxima →',()=>{alvo.replaceChildren();adminExibirUsuarios(alvo,pagina+1,busca).catch(x=>mensagemAdmin(x.message,true));});
}
function adminEditor(alvo,item,tipo){
 const corpoMax=tipo==='conteudos'?5000:3000;
 const form=add('form',alvo,'','admin-editor');
 add('h3',form,item?'Editar publicação':'Nova publicação');
 const titulo=campoAdmin(form,'Título','text',item?.titulo||'');
 const corpo=campoAdmin(form,'Texto','longo',item?.corpo||'');corpo.maxLength=corpoMax;
 const lista=tipo==='conteudos'?[['tutorial','Tutorial'],['faq','Perguntas frequentes'],['exemplo','Exemplo']]:[['novidade','Novidade'],['aviso','Aviso'],['manutencao','Manutenção']];
 const categoria=campoAdmin(form,'Categoria','select',item?.tipo||item?.categoria||lista[0][0],lista);
 const publicado=campoAdmin(form,'Publicar agora','check',item?.publicado||false);
 const btn=add('button',form,item?'Salvar alterações':'Criar publicação','principal');btn.type='submit';
 form.onsubmit=e=>{e.preventDefault();
  const payload={titulo:titulo.value.trim(),corpo:corpo.value.trim(),publicado:publicado.checked,[tipo==='conteudos'?'tipo':'categoria']:categoria.value};
  const prefixo='/api/admin/'+tipo;
  if(!payload.titulo||!payload.corpo)return mensagemAdmin('Preencha o título e o texto.',true);
  acaoAdmin(()=>api(prefixo+(item?'/'+item.id:''),item?'PATCH':'POST',payload),'Publicação salva.');
 };
}
async function adminExibirPublicacoes(alvo,tipo){
 const conteudo=tipo==='conteudos';
 adminTitulo(alvo,conteudo?'Conteúdos e tutorial':'Central de novidades',conteudo?'Gerencie artigos adicionais, exemplos e perguntas frequentes. Os 10 passos do tutorial principal continuam no aplicativo.':'Publique novidades e avisos visíveis para os jogadores.');
 const r=await api('/api/admin/'+tipo);
 adminEditor(alvo,null,tipo);
 const area=add('div',alvo,'','admin-lista');
 r.forEach(item=>{
  const art=add('article',area,'','admin-registro');
  add('h3',art,item.titulo);
  add('p',art,(item.publicado?'Publicado':'Rascunho')+' · '+(item.tipo||item.categoria)+' · '+dataBR(item.atualizado_em),'suave');
  add('p',art,item.corpo.length>230?item.corpo.slice(0,230)+'…':item.corpo);
  botaoAdmin(art,'Editar',()=>{
   area.querySelector('.admin-editor-aberto')?.remove();
   const editor=add('div',art,'','admin-editor-aberto');adminEditor(editor,item,tipo);
  });
 });
}
async function adminExibirSuporte(alvo){
 adminTitulo(alvo,'Suporte e feedback','Mensagens enviadas pelos jogadores, com estado e resposta.');
 const chamados=await api('/api/admin/chamados');
 if(!chamados.length)add('p',alvo,'Nenhum chamado recebido ainda.','suave');
 const area=add('div',alvo,'','admin-lista');
 chamados.forEach(c=>{
  const card=add('article',area,'','admin-registro');add('h3',card,c.assunto);
  add('p',card,c.email+' · '+dataBR(c.criado_em));
  add('p',card,c.mensagem);
  const f=add('form',card,'','admin-editor');
  const status=campoAdmin(f,'Estado','select',c.status,[['aberto','Aberto'],['analise','Em análise'],['resolvido','Resolvido']]);
  const resposta=campoAdmin(f,'Resposta','longo',c.resposta||'');resposta.maxLength=2000;
  const b=add('button',f,'Salvar resposta','principal');b.type='submit';
  f.onsubmit=e=>{e.preventDefault();acaoAdmin(()=>api('/api/admin/chamados/'+c.id,'PATCH',{status:status.value,resposta:resposta.value}),'Chamado atualizado.');};
 });
}
async function adminExibirConfig(alvo){
 adminTitulo(alvo,'Configurações do sistema','Comunicado global e estado de manutenção. O modo de manutenção pausa novas solicitações ao gerador e ao tutor.');
 const r=await api('/api/admin/config'),conf=Object.fromEntries(r.map(x=>[x.chave,x.valor]));
 const form=add('form',alvo,'','admin-editor');
 const aviso=campoAdmin(form,'Aviso visível no site','longo',conf.aviso_site||'');aviso.maxLength=1000;
 const manutencao=campoAdmin(form,'Ativar manutenção','check',conf.modo_manutencao==='true');
 const b=add('button',form,'Salvar configurações','principal');b.type='submit';
 form.onsubmit=e=>{e.preventDefault();if(!confirm('Salvar configurações do site?'))return;acaoAdmin(()=>api('/api/admin/config','PUT',{aviso_site:aviso.value,modo_manutencao:manutencao.checked}),'Configurações salvas.');};
}
async function adminExibirAuditoria(alvo){
 adminTitulo(alvo,'Segurança e auditoria','Últimas 100 ações administrativas registradas. Nenhuma senha é armazenada neste histórico.');
 const r=await api('/api/admin/auditoria');
 if(!r.length)add('p',alvo,'Ainda não há ações administrativas registradas.');
 const area=add('div',alvo,'','admin-lista');
 r.forEach(item=>{const art=add('article',area,'','admin-registro');add('strong',art,item.acao);add('p',art,(item.administrador||'Administrador removido')+' · '+new Date(item.criado_em).toLocaleString('pt-BR')+' · '+(item.alvo_tipo||'sistema')+' #'+(item.alvo_id||'—'),'suave');});
}
async function carregarResumo(){
 const alvo=$('resumo');alvo.replaceChildren();
 if(eu.papel!=='admin')return;
 $('admin-abas').querySelectorAll('button[data-admin]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.admin===adminSecao)));
 try{
  if(adminSecao==='geral')await adminExibirGeral(alvo);
  else if(adminSecao==='relatorios')await adminExibirRelatorios(alvo);
  else if(adminSecao==='usuarios')await adminExibirUsuarios(alvo);
  else if(adminSecao==='novidades'||adminSecao==='conteudos')await adminExibirPublicacoes(alvo,adminSecao==='novidades'?'comunicados':'conteudos');
  else if(adminSecao==='suporte')await adminExibirSuporte(alvo);
  else if(adminSecao==='config')await adminExibirConfig(alvo);
  else if(adminSecao==='auditoria')await adminExibirAuditoria(alvo);
 }catch(e){add('p',alvo,'Não foi possível carregar esta seção: '+e.message,'admin-atencao');}
}
$('admin-abas').querySelectorAll('button[data-admin]').forEach(btn=>btn.onclick=()=>{adminSecao=btn.dataset.admin;mensagemAdmin('');carregarResumo();});
async function noticiasMesa(){
 try{
  const dados=await api('/api/publico/informacoes');
  const avisoBox=$('aviso-publico'),texto=dados.config?.aviso_site;
  avisoBox.hidden=!texto&&! (dados.config?.modo_manutencao==='true');
  avisoBox.textContent=(dados.config?.modo_manutencao==='true'?'Mesa em manutenção: o gerador e o tutor estão pausados. ':'')+(texto||'');
  const alvo=$('lista-novidades');alvo.replaceChildren();
  if(!dados.avisos.length)add('p',alvo,'Ainda não há comunicados publicados.');
  dados.avisos.forEach(x=>{const card=add('article',alvo,'','admin-registro');add('span',card,x.categoria,'sobretitulo');add('h2',card,x.titulo);add('p',card,x.corpo);});
  const artigos=$('conteudos-publicos');if(artigos){artigos.replaceChildren();dados.conteudos.forEach(x=>{const art=add('article',artigos,'','admin-registro');add('h3',art,x.titulo);add('p',art,x.corpo);});}
 }catch(e){console.warn('Avisos indisponíveis:',e.message);}
}
async function suporteListar(){
 const alvo=$('suporte-meus-chamados');alvo.replaceChildren();
 try{const dados=await api('/api/suporte');if(!dados.length)add('p',alvo,'Nenhuma mensagem enviada.');
 dados.forEach(c=>{const art=add('article',alvo,'','admin-registro');add('h3',art,c.assunto);add('p',art,'Estado: '+c.status+' · '+dataBR(c.criado_em),'suave');add('p',art,c.mensagem);if(c.resposta){add('strong',art,'Resposta do Mesa:');add('p',art,c.resposta);}});}
 catch(e){add('p',alvo,e.message);}
}
$('form-suporte').onsubmit=async ev=>{
 ev.preventDefault();try{
  await api('/api/suporte','POST',{assunto:$('suporte-assunto').value,mensagem:$('suporte-mensagem').value});
  $('form-suporte').reset();aviso('Mensagem enviada com sucesso!',true);suporteListar();
 }catch(e){aviso(e.message);}
};

// PWA instalável: o navegador decide quando a instalação direta está disponível.
let mesaInstalacaoPendente=null;
const botaoInstalar=$('instalar-mesa-botao');
const statusInstalar=$('instalar-mesa-status');
const mesaStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
function mesaAtualizarInstalacao(){
 if(mesaStandalone()){
  botaoInstalar.hidden=true;
  statusInstalar.textContent='O Mesa já está instalado neste aparelho. Você pode abri-lo pela lista de aplicativos.';
 }else if(mesaInstalacaoPendente){
  botaoInstalar.hidden=false;
  statusInstalar.textContent='Seu navegador permite instalar o Mesa agora, gratuitamente.';
 }else{
  botaoInstalar.hidden=true;
  statusInstalar.textContent='Siga as instruções abaixo para instalar pelo menu do seu navegador. A instalação direta depende do aparelho e do navegador.';
 }
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();mesaInstalacaoPendente=event;mesaAtualizarInstalacao();
});
window.addEventListener('appinstalled',()=>{
 mesaInstalacaoPendente=null;mesaAtualizarInstalacao();
});
botaoInstalar.onclick=async()=>{
 if(!mesaInstalacaoPendente)return;
 const convite=mesaInstalacaoPendente;mesaInstalacaoPendente=null;
 try{
  await convite.prompt();
  const resultado=await convite.userChoice;
  statusInstalar.textContent=resultado?.outcome==='accepted'?'Instalação solicitada! Procure o Mesa entre os aplicativos.':'Instalação cancelada. Você pode tentar novamente pelo navegador.';
 }catch{statusInstalar.textContent='Não foi possível iniciar a instalação. Utilize o menu do navegador.';}
 botaoInstalar.hidden=true;
};
mesaAtualizarInstalacao();
if('serviceWorker' in navigator&&window.isSecureContext){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{/* Instalação é opcional; website continua acessível. */});
 });
}


/* Aviso informativo, não consentimento fictício: somente cookie de sessão
   e armazenamento técnico já usados pelo serviço. Não instala rastreadores. */
// LGPD: exportação individual de dados não sensíveis da conta autenticada.
// O navegador não guarda o arquivo no cache do PWA; o usuário escolhe onde salvá-lo.
$('mesa-exportar-btn').onclick=async()=>{
 const btn=$('mesa-exportar-btn'),estado=$('mesa-exportar-status');
 btn.disabled=true;estado.textContent='Preparando seu arquivo...';
 try{
  const r=await fetch(API_BASE_URL+'/api/conta/meus-dados',{method:'GET',credentials:'include',cache:'no-store'});
  if(!r.ok){
   const erro=await r.json().catch(()=>({erro:'Falha na exportação.'}));
   throw new Error(erro.erro||'Não foi possível exportar seus dados.');
  }
  const blob=await r.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='mesa-meus-dados.json';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  estado.textContent='Arquivo preparado. Armazene-o em local seguro, pois contém dados privados.';
 }catch(e){estado.textContent=e.message||'Erro ao preparar arquivo.';}
 finally{btn.disabled=false;}
};


/* Acessibilidade opcional, por conta do navegador e sem microfone. */
const mesaA11y={fonte:false,contraste:false,movimento:false,som:false,velocidade:1,token:0,audio:null};
function acessibilidadeAplicar(){
 document.body.classList.toggle('mesa-fonte-grande',mesaA11y.fonte);
 document.body.classList.toggle('mesa-alto-contraste',mesaA11y.contraste);
 document.documentElement.classList.toggle('mesa-movimento-reduzido',mesaA11y.movimento);
 for(const [id,chave] of [['mesa-fonte-grande','fonte'],['mesa-alto-contraste','contraste'],['mesa-reduzir-movimento','movimento'],['mesa-som-dados','som']])$(id).checked=mesaA11y[chave];
 $('mesa-velocidade-voz').value=String(mesaA11y.velocidade);
}
function acessibilidadeSalvar(){
 acessibilidadeAplicar();
 try{localStorage.setItem('mesa-a11y-v1',JSON.stringify({fonte:mesaA11y.fonte,contraste:mesaA11y.contraste,movimento:mesaA11y.movimento,som:mesaA11y.som,velocidade:mesaA11y.velocidade}));}catch{}
 $('mesa-acessibilidade-status').textContent='Preferências salvas neste dispositivo.';
}
function acessibilidadeMovimentoReduzido(){
 return mesaA11y.movimento||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function acessibilidadeParar(){
 mesaA11y.token++;
 if('speechSynthesis' in window)window.speechSynthesis.cancel();
}
function acessibilidadeLer(valor){
 const status=$('mesa-acessibilidade-status');
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
  status.textContent='Leitura por voz indisponível neste navegador. Use o leitor de tela do dispositivo.';return;
 }
 const texto=String(valor||'').replace(/\s+/g,' ').trim().slice(0,20000);
 if(!texto){status.textContent='Não há texto disponível.';return;}
 acessibilidadeParar();
 const token=mesaA11y.token;
 const partes=texto.match(/.{1,180}(?:[.!?;](?=\s|$)|\s|$)/g)||[texto];
 let indice=0;
 const proximo=()=>{
  if(token!==mesaA11y.token)return;
  if(indice>=partes.length){status.textContent='Leitura concluída.';return;}
  const fala=new SpeechSynthesisUtterance(partes[indice++].trim());
  fala.lang='pt-BR';fala.rate=mesaA11y.velocidade;
  fala.onend=proximo;
  fala.onerror=()=>{if(token===mesaA11y.token)status.textContent='A leitura foi interrompida.';};
  try{speechSynthesis.speak(fala);}catch{status.textContent='Não foi possível ler este texto.';}
 };
 status.textContent='Lendo em voz alta. Você pode parar a leitura a qualquer momento.';proximo();
}
function acessibilidadeBotaoLer(alvo,conteudo){
 const b=el('button','🔊 Ouvir texto','mesa-ler-trecho');b.type='button';
 b.setAttribute('aria-label','Ler este trecho em voz alta');
 b.onclick=()=>acessibilidadeLer(typeof conteudo==='function'?conteudo():conteudo);
 alvo.appendChild(b);
}
// Navegadores móveis só liberam Web Audio após um gesto do usuário.
// Mantemos o mesmo AudioContext para a rolagem e seu resultado final.
// Reproduz o áudio de dados enviado pelo usuário. O arquivo compactado é
// carregado no navegador com a página; não depende de serviços externos.
function acessibilidadeSomDado(final=false,forcar=false){
 if(final||(!mesaA11y.som&&!forcar))return Promise.resolve(false);
 try{
  const clip=window.MESA_DICE_AUDIO;
  if(typeof clip!=='string'||!clip.startsWith('data:audio/mpeg;base64,')){
   if(forcar)$('mesa-acessibilidade-status').textContent='O arquivo de áudio não carregou. Atualize o Mesa e tente novamente.';
   return Promise.resolve(false);
  }
  if(mesaA11y.audio&&typeof mesaA11y.audio.pause==='function'){
   mesaA11y.audio.pause();
   mesaA11y.audio.currentTime=0;
  }
  const audio=new Audio(clip);
  audio.preload='auto';
  audio.volume=.95;
  mesaA11y.audio=audio;
  // A reprodução é iniciada no clique do jogador para respeitar o bloqueio
  // de autoplay dos navegadores, especialmente no Android.
  return audio.play().then(()=>true).catch(()=>{
   if(forcar)$('mesa-acessibilidade-status').textContent='O navegador bloqueou o som. Toque em Testar som e verifique o volume de mídia.';
   return false;
  });
 }catch{
  if(forcar)$('mesa-acessibilidade-status').textContent='Não foi possível reproduzir o áudio enviado.';
  return Promise.resolve(false);
 }
}

try{
 const dados=JSON.parse(localStorage.getItem('mesa-a11y-v1')||'{}');
 for(const k of ['fonte','contraste','movimento','som'])mesaA11y[k]=dados[k]===true;
 if([.75,1,1.25].includes(Number(dados.velocidade)))mesaA11y.velocidade=Number(dados.velocidade);
}catch{}
acessibilidadeAplicar();
$('mesa-testar-som-dados').onclick=async()=>{
 const estado=$('mesa-acessibilidade-status');
 estado.textContent='Testando o som dos dados...';
 const ok=await acessibilidadeSomDado(false,true);
 if(ok)estado.textContent='Som de teste reproduzido. Se não ouviu, aumente o volume de mídia do dispositivo.';
};
$('mesa-acessibilidade-abrir').onclick=()=>{
 const p=$('mesa-acessibilidade-painel'),aberto=p.hidden;
 p.hidden=!aberto;$('mesa-acessibilidade-abrir').setAttribute('aria-expanded',String(aberto));
 if(aberto)$('mesa-acessibilidade-fechar').focus();
};
$('mesa-acessibilidade-fechar').onclick=()=>{
 $('mesa-acessibilidade-painel').hidden=true;$('mesa-acessibilidade-abrir').setAttribute('aria-expanded','false');
 $('mesa-acessibilidade-abrir').focus();
};
for(const [id,chave] of [['mesa-fonte-grande','fonte'],['mesa-alto-contraste','contraste'],['mesa-reduzir-movimento','movimento'],['mesa-som-dados','som']]){
 $(id).onchange=()=>{mesaA11y[chave]=$(id).checked;acessibilidadeSalvar();if(chave==='som'&&mesaA11y.som){acessibilidadeSomDado(false,true).then(ok=>{$('mesa-acessibilidade-status').textContent=ok?'Som dos dados ativado.':'Som ativado, mas o navegador bloqueou a reprodução. Use Testar som.';});}};
}
$('mesa-velocidade-voz').onchange=()=>{mesaA11y.velocidade=Number($('mesa-velocidade-voz').value);acessibilidadeSalvar();};
$('mesa-parar-leitura').onclick=()=>{acessibilidadeParar();$('mesa-acessibilidade-status').textContent='Leitura parada.';};
$('mesa-ler-pagina').onclick=()=>{
 const secao=[...document.querySelectorAll('section[id^="v-"]')].find(v=>!v.hidden);
 if(!secao)return;
 const texto=secao.cloneNode(true);
 texto.querySelectorAll('button,form,input,textarea,select,[hidden],svg,nav').forEach(e=>e.remove());
 acessibilidadeLer(texto.textContent);
};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('mesa-acessibilidade-painel').hidden)$('mesa-acessibilidade-fechar').click();
});

(function informarCookies(){
 const caixa=$('mesa-cookies-aviso'),btn=$('mesa-cookies-entendi');
 let lido=false;try{lido=localStorage.getItem('mesa-aviso-privacidade-v1')==='1';}catch{}
 caixa.hidden=lido;
 btn.onclick=()=>{caixa.hidden=true;try{localStorage.setItem('mesa-aviso-privacidade-v1','1');}catch{}};
})();

noticiasMesa();
atualizarEu().then(() => {
  if (new URL(location.href).searchParams.has('reset_token')) {
    abrirFormularioConta('f-redefinir'); mostrar('conta');
  } else {
    const pedida=new URL(location.href).searchParams.get('tela');
    const anterior=estadoNavegacao.ler('tela');
    mostrar(TELAS.includes(pedida)?pedida:TELAS.includes(anterior)?anterior:'gerador');
  }
}).catch((e) => {
  // Um erro de rede/banco na inicialização não significa que o usuário saiu.
  // Mantemos o contexto visual e pedimos que tente novamente.
  montarNav();
  if (new URL(location.href).searchParams.has('reset_token')) {
    abrirFormularioConta('f-redefinir'); mostrar('conta');
  } else {
    const ultima=estadoNavegacao.ler('tela');
    const pagina=TELAS.includes(ultima) && !['historico','personagens','assistente','admin','suporte'].includes(ultima)?ultima:'gerador';
    mostrar(pagina);
  }
  aviso('Não foi possível verificar a sessão com o servidor agora. Sua conta pode continuar conectada. Atualize a página e tente novamente. Detalhes: '+e.message);
});
