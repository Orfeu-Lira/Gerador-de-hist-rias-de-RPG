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

const mesaConsultas=new Map(),mesaEnvios=new Set();
function mesaConexao(texto){
 let p=$('mesa-conexao-status');
 if(!p){p=el('div','','mesa-conexao-status');p.id='mesa-conexao-status';p.setAttribute('role','status');document.body.append(p);}
 p.textContent=texto;p.hidden=!texto;
}
window.addEventListener('offline',()=>mesaConexao('Sem conexão. Seus textos permanecem nesta página.'));
window.addEventListener('online',()=>mesaConexao(''));
async function api(url, metodo = 'GET', corpo) {
 if (!API_BASE_URL) throw new Error('Configure a URL do backend em config.js antes de usar a API.');
 metodo=metodo.toUpperCase();
 const leitura=metodo==='GET',chave=metodo+' '+url;
 if(leitura&&mesaConsultas.has(chave))return mesaConsultas.get(chave);
 if(!leitura&&mesaEnvios.has(chave))throw Error('Uma solicitação igual já está em andamento.');
 if(!navigator.onLine){mesaConexao('Sem conexão com a internet.');throw Error('Sem conexão. Verifique sua internet.');}
 if(!leitura)mesaEnvios.add(chave);
 const executar=async()=>{
  for(let tentativa=0;tentativa<(leitura?3:1);tentativa++){
   if(!navigator.onLine)throw Error('Sem conexão. Verifique sua internet.');
   const controle=new AbortController();
   const longa=!leitura&&(/gerar|\/solo\/|\/avatar$|\/perfil\/foto$/.test(url));
   const timer=setTimeout(()=>controle.abort(),longa?90000:15000);
   let erro;
   try{
    const r=await fetch(API_BASE_URL+url,{method:metodo,credentials:'include',headers:{'Content-Type':'application/json'},body:corpo?JSON.stringify(corpo):undefined,signal:controle.signal});
    const dados=await r.json().catch(()=>({}));
    if(!r.ok){if(r.status===401&&dados.codigo==='login_obrigatorio'&&eu.logado){eu={logado:false};document.body.classList.add('mesa-sem-sessao');location.replace('/');}throw Object.assign(Error(dados.erro||'Não foi possível concluir a solicitação.'),{dados,status:r.status});}
    mesaConexao('');return dados;
   }catch(e){erro=e;}finally{clearTimeout(timer);}
   const rede=erro.name==='AbortError'||erro instanceof TypeError;
   if(!leitura||!rede||tentativa===2){
    if(rede){mesaConexao('Conexão instável. Verifique sua internet.');throw Error(leitura?'A consulta não respondeu. Tente novamente.':'Não foi possível confirmar o resultado. Confira se a ação foi concluída antes de reenviar.');}
    throw erro;
   }
   await new Promise(resolve=>setTimeout(resolve,2000*(tentativa+1)));
  }
 };
 const promessa=executar();
 if(leitura)mesaConsultas.set(chave,promessa);
 try{return await promessa;}finally{if(leitura)mesaConsultas.delete(chave);else mesaEnvios.delete(chave);}
}

function aviso(texto, bom) { const a = $('aviso'); a.textContent = texto || ''; a.className = bom ? 'bom' : ''; }

// ---- Navegação entre telas ----
const TELAS = ['gerador','solo','dados','historico','personagens','assistente','tutorial','novidades','suporte','instalar','conta','admin','privacidade','termos','musica','inicio','perfil','opcoes','amigos','compartilhadas','mensagens','campanhas'];
// Mantém o player no mesmo documento e fora das configurações de acessibilidade.
(function separarMusica(){
  const player=$('musica-ambiente');
  const pagina=document.createElement('section');
  pagina.id='v-musica';pagina.hidden=true;pagina.setAttribute('aria-labelledby','mesa-musica-titulo');
  const cabecalho=el('div','','pagina-intro');
  const titulo=el('h1','Música');titulo.id='mesa-musica-titulo';
  cabecalho.append(el('span','AMBIENTE DA AVENTURA','sobretitulo'),titulo,el('p','Escolha a trilha sonora da sua mesa. A música é opcional e independente da acessibilidade.'));
  player.before(pagina);pagina.append(cabecalho,player);
  $('musica-abrir').hidden=true;
  $('musica-painel').hidden=false;
  $('musica-abrir').setAttribute('aria-expanded','true');
  $('musica-fechar').textContent='Voltar';
  $('musica-fechar').setAttribute('aria-label','Voltar à tela anterior');
  $('musica-painel').querySelector('.musica-painel-topo h2').appendChild($('musica-indicador'));
  const nota=el('p','Os recursos de acessibilidade são gratuitos e disponíveis para todos, inclusive sem conta.','suave');
  $('mesa-acessibilidade-painel').insertBefore(nota,$('mesa-acessibilidade-painel').children[1]);
})();
let mesaAntesDaMusica='inicio';
// Dashboard: atalhos para ferramentas existentes, sem duplicar formulários.
(function criarInicio(){
 const pagina=el('section');pagina.id='v-inicio';pagina.hidden=true;pagina.setAttribute('aria-labelledby','mesa-inicio-titulo');
 const hero=el('div','','hero mesa-home-hero'),copia=el('div','','hero-copia');
 const titulo=el('h1','Sua próxima aventura começa aqui.');titulo.id='mesa-inicio-titulo';
 copia.append(el('span','✦ SEU PORTAL DE AVENTURAS','sobretitulo'),titulo,el('p','Crie mundos, explore histórias e reúna suas ferramentas de RPG em um único lugar.'));
 const arte=el('div','','hero-arte');arte.setAttribute('aria-hidden','true');arte.append(el('span','✧'));hero.append(copia,arte);
 const grade=el('div','','mesa-home-grade');
 const atalhos=[
 ['✦','Criar aventura','Prepare histórias completas para sua mesa.','gerador',false],
 ['♙','Criar NPC','Dê vida aos personagens do seu mundo.','gerador',true],
 ['✧','Jogar RPG Solo','Explore uma campanha com o Mestre IA.','solo'],
 ['▤','Minhas aventuras','Consulte suas histórias salvas.','historico'],
 ['♙','Meus personagens','Crie e organize suas fichas.','personagens'],
 ['◇','Oráculo dos dados','Role dados e calcule seus resultados.','dados']
 ];
 for(const [simbolo,nome,descricao,tela,npc] of atalhos){
  const b=el('button','','mesa-home-card');b.type='button';
  const icone=el('span',simbolo,'mesa-home-icone');icone.setAttribute('aria-hidden','true');
  b.append(icone,el('strong',nome),el('span',descricao,'mesa-home-descricao'));
  b.onclick=()=>navegarMesa(tela,typeof npc==='boolean'?()=>modoGeradorNPC(npc):undefined);
  grade.append(b);
 }
 pagina.append(hero,grade);$('v-gerador').before(pagina);
})();
function mesaMenuAtualizar(tela){
 document.querySelectorAll('#nav button[data-tela],#mesa-mobile-nav button[data-tela]').forEach(b=>{
  const ativo=b.dataset.tela===tela && (!b.hasAttribute('data-modo-gerador') || b.dataset.modoGerador===String(!$('f-gerar-npc').hidden));
  if(ativo)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  if(ativo){const grupo=b.closest('.mesa-nav-grupo');if(grupo)grupo.open=true;}
 });
}
(function criarBarraMobile(){
 const nav=el('nav','','mesa-mobile-nav');nav.id='mesa-mobile-nav';nav.setAttribute('aria-label','Atalhos principais');
 for(const [t,simbolo,nome] of [['inicio','⌂','Início'],['solo','✧','Solo'],['personagens','♙','Fichas'],['dados','◇','Dados'],['mais','☰','Mais']]){
  const b=el('button');b.type='button';b.setAttribute('aria-label',nome);
  if(t!=='mais')b.dataset.tela=t;else b.setAttribute('aria-controls','menu-lateral');
  const i=el('span',simbolo);i.setAttribute('aria-hidden','true');b.append(i,el('small',nome));
  b.onclick=()=>t==='mais'?menuMobile(!document.body.classList.contains('menu-mobile-aberto')):navegarMesa(t);
  nav.append(b);
 }
 document.body.append(nav);
})();
const estadoNavegacao={
  ler(chave){try{return sessionStorage.getItem('mesa:'+chave);}catch{return null;}},
  gravar(chave,valor){try{if(valor===null)sessionStorage.removeItem('mesa:'+chave);else sessionStorage.setItem('mesa:'+chave,String(valor));}catch{}}
};

$('dnd-tutorial-mesa').onclick=()=>navegarMesa('tutorial',()=>tutorialMostrarPasso(0));
const tutorialEtapas = [
 {titulo:'Bem-vindo ao Mesa',sub:'Seu espaço de histórias',texto:'Use o Gerador para preparar uma aventura ou escolha RPG Solo · Mestre IA para jogar no seu ritmo. Os dois últimos capítulos deste guia ensinam a começar e retomar uma campanha solo. Use o menu lateral para alternar de ferramenta. Você pode deixá-lo expandido ou compacto, e no celular basta tocar em Menu.',dicas:['O tutorial fica disponível sempre no menu lateral.','Sua conta guarda o histórico e as fichas privadas.'],tela:'gerador',rotulo:'Conhecer o gerador'},
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
 {titulo:'Crie a atmosfera da mesa',sub:'Música e ajustes finais',texto:'A aba Música fica no menu lateral, inclusive sem login. Abra-a para escolher a trilha sonora, controlar volume e pausar. A reprodução começa somente quando você solicitar.',dicas:['O player mostra autor, licença e fonte das gravações.','Se preferir silêncio, deixe o player pausado. Pronto: sua aventura pode começar!'],tela:'gerador',rotulo:'Começar aventura'},
 {
   titulo:'Comece sua campanha solo',sub:'RPG Solo · Mestre IA',
   texto:'Entre na sua conta e, no Gerador, abra RPG Solo · Mestre IA. Dê um nome à campanha. Em História inicial, escolha uma aventura salva ou escreva uma ideia sua. Por exemplo: “Toda noite, o sino de uma torre submersa toca três vezes.” Escolha o gênero e o tom.',
   dicas:['Se for sua primeira partida, marque “Sim, me ensine enquanto jogo” para receber ajuda na primeira cena.','Escolha uma ficha salva, crie um personagem ou mantenha “Sem ficha por enquanto”. Depois, toque em Iniciar aventura solo.'],
   tela:'solo',rotulo:'Abrir RPG Solo',requerLogin:true
 },
 {
   titulo:'Jogue a primeira cena e retome depois',sub:'Na mesa com o Mestre IA',
   texto:'Leia a cena e escolha Ação do meu personagem. Conte o que você tenta fazer: “Espero o sino tocar e observo se a água se move.” Toque em Enviar ao Mestre IA para descobrir o que acontece. Se a cena pedir um teste, use o botão Rolar que aparece na mensagem.',
   dicas:['Para mudar algo no enredo, selecione Pedir modificação da história. Por exemplo: “Quero que o mistério aconteça durante o dia.”','Para voltar depois, abra RPG Solo na mesma conta e escolha sua campanha em Minhas campanhas salvas.'],
   tela:'solo',rotulo:'Abrir minhas campanhas',requerLogin:true
 }
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
$('tutorial-proximo').onclick=()=>{if(tutorialPasso===tutorialEtapas.length-1){navegarMesa('gerador');return;}tutorialMostrarPasso(tutorialPasso+1);};
$('tutorial-recomecar').onclick=()=>tutorialMostrarPasso(0);
$('tutorial-ir').onclick=()=>{
  const etapa=tutorialEtapas[tutorialPasso];
  if(etapa.requerLogin&&!eu.logado){navegarMesa('conta',()=>aviso('Entre na sua conta primeiro para usar essa ferramenta.'));return;}
  if(etapa.requerAdmin&&eu.papel!=='admin'){aviso('O painel é exclusivo para administradores.');return;}
  navegarMesa(etapa.tela);
};
try{const guardado=Number(localStorage.getItem('mesa-tutorial-etapa'));if(Number.isInteger(guardado))tutorialPasso=Math.max(0,Math.min(tutorialEtapas.length-1,guardado));}catch{}
if(new URL(location.href).searchParams.get('capitulo')==='solo'){
  tutorialPasso=tutorialEtapas.findIndex(etapa=>etapa.tela==='solo');
}
tutorialMostrarPasso(tutorialPasso);

// Menu lateral: recolhível no computador e gaveta no celular.
const preferirMobile=()=>window.matchMedia('(max-width:850px)').matches;
function menuRecolher(recolher){
  if(preferirMobile()){desenharMenuMobile(false);return;}
  document.body.classList.toggle('menu-compacto',recolher);
  $('menu-retrair').textContent=recolher?'›':'‹';
  $('menu-retrair').setAttribute('aria-expanded',String(!recolher));
  $('menu-retrair').setAttribute('aria-label',recolher?'Expandir menu lateral':'Recolher menu lateral');
  $('menu-retrair').title=recolher?'Expandir menu':'Recolher menu';
  try{localStorage.setItem('mesa-menu-compacto',recolher?'1':'0');}catch{}
}
function menuMobile(aberto){
  if(aberto && preferirMobile() && !document.body.classList.contains('mesa-sem-sessao') && mesaTelaVisivel && !history.state?.mesaMenu){
    history.pushState({...history.state,mesaMenu:true},'');
  }else if(!aberto && history.state?.mesaMenu){
    history.back();
  }
  desenharMenuMobile(aberto);
}
function desenharMenuMobile(aberto){
  const ativo=Boolean(aberto)&&preferirMobile();
  document.body.classList.toggle('menu-mobile-aberto',ativo);
  $('menu-fundo').hidden=!ativo;
  document.querySelector('#mesa-mobile-nav [aria-controls="menu-lateral"]')?.setAttribute('aria-expanded',String(ativo));
  $('menu-abrir-mobile').setAttribute('aria-expanded',String(ativo));
  $('menu-abrir-mobile').setAttribute('aria-label',ativo?'Fechar menu lateral':'Abrir menu lateral');
  if(!ativo&&preferirMobile()&&document.activeElement?.closest('#menu-lateral'))$('menu-abrir-mobile').focus({preventScroll:true});
}
$('menu-retrair').onclick=()=>preferirMobile()?menuMobile(false):menuRecolher(!document.body.classList.contains('menu-compacto'));
$('menu-abrir-mobile').onclick=()=>menuMobile(!document.body.classList.contains('menu-mobile-aberto'));
$('menu-fundo').onclick=()=>menuMobile(false);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&document.body.classList.contains('menu-mobile-aberto'))menuMobile(false);});
window.addEventListener('resize',()=>{if(!preferirMobile()&&document.body.classList.contains('menu-mobile-aberto'))menuMobile(false);});
try{menuRecolher(localStorage.getItem('mesa-menu-compacto')==='1');}catch{menuRecolher(false);}
// Transições sem atrasar a lógica de navegação: snapshot nativo quando disponível.
let mesaTelaVisivel=null, mesaAnimacaoTela=null, mesaTransicaoAtiva=null;
function mesaMovimentoReduzido(){
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
 document.documentElement.classList.contains('mesa-movimento-reduzido');
}
function mesaTransicaoTela(tela, primeira){
  mesaAnimacaoTela?.cancel();
  mesaAnimacaoTela=null;
  const painel=$('v-'+tela);
  window.scrollTo({top:0,left:0,behavior:'instant'});
  if(!primeira && document.activeElement?.closest('section[hidden]'))
    $('mesa-conteudo')?.focus({preventScroll:true});
  if(mesaMovimentoReduzido() || mesaTransicaoAtiva || typeof painel.animate!=='function')return;
  mesaAnimacaoTela=painel.animate(
    [{opacity:0,transform:'translateY('+ (primeira?12:7) +'px)'},{opacity:1,transform:'translateY(0)'}],
    {duration:primeira?420:220,easing:'cubic-bezier(.2,.75,.25,1)'}
  );
}
// Ações de navegação interativas usam a mesma transição, inclusive atalhos internos.
// A lógica dependente da tela roda junto da troca, nunca antes do snapshot.
function navegarMesa(tela, depois){
  const aplicar=()=>{mostrar(tela);if(mesaTelaVisivel===tela)depois?.();};
  if(mesaTransicaoAtiva){
    const anterior=mesaTransicaoAtiva;
    mesaTransicaoAtiva=null;
    anterior.skipTransition();
  }
  if(!mesaTelaVisivel || tela===mesaTelaVisivel || mesaMovimentoReduzido() ||
     typeof document.startViewTransition!=='function'){
    aplicar();return;
  }
  const transicao=document.startViewTransition(()=>{
    if(mesaTransicaoAtiva===transicao)aplicar();
  });
  mesaTransicaoAtiva=transicao;
  transicao.ready.catch(()=>{});
  transicao.finished.catch(()=>{}).finally(()=>{
    if(mesaTransicaoAtiva===transicao)mesaTransicaoAtiva=null;
  });
}
function registrarTela(tela){
  const raiz=eu.logado?'inicio':'conta';
  let atual=history.state;
  if(atual?.mesaRaiz!==raiz){
    atual={mesaRaiz:raiz,mesaTela:raiz,mesaNivel:0};
    history.replaceState(atual,'');
  }
  if(tela===raiz && atual.mesaNivel>0){
    history.go(-atual.mesaNivel-(atual.mesaMenu?1:0));
    return;
  }
  if(atual.mesaMenu && atual.mesaTela===tela){history.back();return;}
  if(atual.mesaTela===tela)return;
  const proximo={mesaRaiz:raiz,mesaTela:tela,mesaNivel:atual.mesaNivel+1};
  if(atual.mesaMenu)history.replaceState(proximo,'');
  else history.pushState(proximo,'');
}
window.addEventListener('popstate',ev=>{
  if(!mesaTelaVisivel)return;
  if(mesaTransicaoAtiva){mesaTransicaoAtiva.skipTransition();mesaTransicaoAtiva=null;}
  const raiz=eu.logado?'inicio':'conta';
  const estado=ev.state;
  const tela=estado?.mesaRaiz===raiz && TELAS.includes(estado.mesaTela)?estado.mesaTela:raiz;
  if(estado?.mesaRaiz!==raiz)history.replaceState({mesaRaiz:raiz,mesaTela:raiz,mesaNivel:0},'');
  if(tela!==mesaTelaVisivel)mostrar(tela,true);
  desenharMenuMobile(Boolean(estado?.mesaMenu && eu.logado));
});
function mostrar(tela, restaurando=false) {
  if(!TELAS.includes(tela))return;
  pararJornada();
  if(mesaTelaVisivel==='solo'&&tela!=='solo'){soloFecharPaineis();fecharCinema();}
  if(tela!=='amigos'&&mesaTelaVisivel==='amigos')amigosLimpar();
  if(tela!=='compartilhadas'&&mesaTelaVisivel==='compartilhadas')limparCompartilhadas();
  if(tela!=='mensagens'&&mesaTelaVisivel==='mensagens')limparMensagens();
  if(tela!=='campanhas'&&mesaTelaVisivel==='campanhas')limparCampanha();
  if(tela!=='perfil'&&mesaTelaVisivel==='perfil'){perfilRequisicao++;limparFotoPerfil();$('perfil-nome').value='';$('perfil-email').value='';}
  if(!eu.logado&&!['conta','privacidade','termos'].includes(tela))tela='conta';
  if(tela==='admin'&&eu.papel!=='admin')tela='gerador';
  if(tela==='musica'&&mesaTelaVisivel&&mesaTelaVisivel!=='musica')mesaAntesDaMusica=mesaTelaVisivel;
  estadoNavegacao.gravar('tela',tela);
  document.body.classList.toggle('mesa-sem-sessao',!eu.logado);
  document.body.classList.toggle('tela-acesso', tela === 'conta');
  TELAS.forEach((t) => { $('v-' + t).hidden = t !== tela; });
  mesaMenuAtualizar(tela);
  if(tela==='tutorial')tutorialMostrarPasso(tutorialPasso);
  if(!restaurando)registrarTela(tela);
  desenharMenuMobile(false);
  const primeira=mesaTelaVisivel===null;
  const mudou=mesaTelaVisivel!==tela;
  mesaTelaVisivel=tela;
  if(mudou)mesaTransicaoTela(tela,primeira);
  aviso('');
  if (tela === 'gerador' && !$('f-gerar-npc').hidden) { carregarOrigensNPC(); if(eu.logado)carregarBibliotecaNPC(); }
  if (tela === 'solo') soloAtualizarInicio();
  if (tela === 'historico') carregarHistorico();
  if (tela === 'personagens') { carregarAventurasDaFicha().then(carregarPersonagens); }
  if (tela === 'admin') {carregarResumo();notificacoesAtualizar();}
  if (tela === 'suporte') suporteListar();
  if (tela === 'novidades') noticiasMesa();
  if (tela === 'perfil') carregarMeuPerfil();
  if (tela === 'amigos') carregarAmigos();
  if (tela === 'compartilhadas') carregarCompartilhadas();
  if (tela === 'mensagens') iniciarMensagens();
  if (tela === 'campanhas') iniciarCampanhas();
  if (tela === 'inicio') mesaSaudacao();
}
$('abrir-tutorial-menu').onclick=()=>navegarMesa('tutorial');
$('solo-ir-gerador')?.addEventListener('click',()=>navegarMesa('gerador'));
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
 if(!eu.logado||!navigator.onLine)return;
 if(notificacoesEmAndamento)return;
 if(!force&&Date.now()-notificacoesUltimoCarregamento<45000)return;
 notificacoesEmAndamento=true;
 try{
  const sessao=eu.email,admin=eu.papel==='admin';
  const [social,data]=await Promise.all([api('/api/comunidade/notificacoes'),admin?api('/api/admin/notificacoes'):Promise.resolve({naoLidas:0,itens:[]})]);
  if(!eu.logado||eu.email!==sessao||admin!==(eu.papel==='admin'))return;
  notificacoesUltimoCarregamento=Date.now();
  const totalSuporte=Number(data.naoLidas)||0;
  const contador=$('notificacoes-contador'),quantidade=totalSuporte+['solicitacoes','mensagens','fichas','convites','denuncias'].reduce((n,k)=>n+(Number(social[k])||0),0);
  contador.hidden=quantidade<1;
  contador.textContent=quantidade>99?'99+':String(quantidade);
  $('notificacoes-abrir').setAttribute('aria-label',quantidade?quantidade+' notificações pendentes':'Abrir notificações');
  $('notificacoes-abrir').title=quantidade?quantidade+' notificações não lidas':'Nenhuma notificação pendente';
  const estado=$('notificacoes-estado');
  estado.textContent=quantidade?quantidade+' aviso(s) pendente(s).':'Tudo em dia! Nenhum aviso pendente.';
  const lista=$('notificacoes-lista');lista.replaceChildren();
  for(const [k,n,tela] of [['solicitacoes','Solicitações de amizade','amigos'],['mensagens','Mensagens não lidas','mensagens'],['fichas','Fichas recebidas','compartilhadas'],['convites','Convites para campanhas','campanhas'],['denuncias','Denúncias pendentes','admin']]){
   if(!social[k])continue;
   const card=add('article',lista,'','notificacoes-item nao-lida');
   add('strong',card,n);add('p',card,String(social[k])+' pendente(s)','suave');
   botaoAdmin(card,'Abrir',()=>{notificacoesFechar();if(k==='denuncias')adminSecao='moderacao';navegarMesa(tela);});
  }
  if(admin&&data.itens.length)add('h3',lista,'Suporte administrativo');
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
  $('notificacoes-ler-todas').disabled=totalSuporte===0;
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
 const ativo=eu.logado;
 $('notificacoes-ler-todas').hidden=eu.papel!=='admin';$('notificacoes-ir-suporte').hidden=eu.papel!=='admin';
 $('mesa-notificacoes').hidden=!ativo;
 if(!ativo){
  notificacoesFechar();notificacoesUltimoCarregamento=0;
  $('notificacoes-contador').hidden=true;$('notificacoes-lista').replaceChildren();
 }else notificacoesAtualizar(true);
}
// Consulta de 60 em 60 segundos enquanto o documento estiver visível e autenticado.
window.setInterval(()=>{if(!document.hidden)notificacoesAtualizar();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&eu.logado)notificacoesAtualizar();});
function montarNav() {
  const nav=$('nav');nav.replaceChildren();
  if(!eu.logado)return;
  function item(t,simbolo,nome,modo){
   const botao=el('button','','menu-item');botao.dataset.tela=t;botao.type='button';
   botao.title=nome;botao.setAttribute('aria-label',nome);
   const icone=el('span',simbolo,'menu-item-icone');icone.setAttribute('aria-hidden','true');
   botao.append(icone,el('span',nome,'menu-item-texto'));
   if(typeof modo==='boolean')botao.dataset.modoGerador=String(modo);
   botao.onclick=()=>navegarMesa(t,typeof modo==='boolean'?()=>modoGeradorNPC(modo):undefined);
   return botao;
  }
  function grupo(nome,itens){
   const d=el('details','','mesa-nav-grupo');d.open=true;
   const s=el('summary',nome,'mesa-nav-titulo');d.append(s);
   const corpo=el('div','','mesa-nav-itens');for(const x of itens)corpo.append(item(...x));d.append(corpo);nav.append(d);
  }
  nav.append(item('inicio','⌂','Início'));
  grupo('Aventuras',[['gerador','✦','Gerador de histórias',false],['gerador','♙','Gerador de NPCs',true],['solo','✧','RPG Solo'],...(eu.logado?[['campanhas','⚔','Campanhas online'],['historico','▤','Minhas aventuras']]:[])]);
  grupo('Ferramentas',[...(eu.logado?[['personagens','♙','Personagens'],['assistente','✧','Tutor D&D']]:[]),['dados','◇','Oráculo dos dados'],['musica','♫','Música']]);
  grupo('Comunidade',[...(eu.logado?[['amigos','♙','Amigos'],['compartilhadas','▤','Fichas compartilhadas'],['mensagens','✉','Mensagens']]:[]),['novidades','✦','Novidades'],['tutorial','❖','Tutorial'],...(eu.logado?[['suporte','✉','Suporte']]:[])]);
  grupo('Minha conta',[...(eu.logado?[['perfil','♙','Meu perfil']]:[['conta','↪','Entrar']]),['opcoes','⚙','Opções'],['instalar','⬇','Instalar Mesa']]);
  if(eu.papel==='admin')grupo('Administração',[['admin','⚙','Painel']]);
  const acesso=el('button','','menu-item');acesso.type='button';acesso.title='Acessibilidade';acesso.setAttribute('aria-label','Abrir acessibilidade');acesso.setAttribute('aria-controls','mesa-acessibilidade-painel');
  const simbolo=el('span','♿','menu-item-icone');simbolo.setAttribute('aria-hidden','true');
  acesso.append(simbolo,el('span','Acessibilidade','menu-item-texto'));
  acesso.onclick=()=>{menuMobile(false);if($('mesa-acessibilidade-painel').hidden)$('mesa-acessibilidade-abrir').click();else $('mesa-acessibilidade-fechar').focus({preventScroll:true});};nav.append(acesso);
  if(eu.logado){
   const sair=el('button','','menu-item');sair.type='button';sair.title='Sair';sair.setAttribute('aria-label','Sair');
   const i=el('span','↪','menu-item-icone');i.setAttribute('aria-hidden','true');sair.append(i,el('span','Sair','menu-item-texto'));
   sair.onclick=async()=>{
    await api('/api/logout','POST');estadoNavegacao.gravar('personagem',null);estadoNavegacao.gravar('aba-ficha',null);estadoNavegacao.gravar('tela',null);fichaAbertaId=null;
    location.replace('/');
   };nav.append(sair);
  }
  mesaMenuAtualizar(mesaTelaVisivel||'inicio');
}
function textoInfo() {
  if (!eu.logado) return 'Entre ou crie uma conta para acessar o Mesa.';
  return eu.restantes === null ? 'Acesso total (administrador).' : 'Gerações restantes hoje: ' + eu.restantes;
}

async function atualizarEu() {
  // Não substitua o estado de login antes que o servidor confirme a sessão.
  const resposta=await api('/api/eu');
  eu=resposta;
  document.body.classList.toggle('mesa-sem-sessao',!eu.logado);
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
    b.onclick=()=>{soloOrigemPreferida=Number(aventuraId)||null;soloTituloPreferido=a.titulo||'';navegarMesa('solo');};
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
 estadoNavegacao.gravar('modo-gerador',ativar?'npc':'historia');
 mesaMenuAtualizar(mesaTelaVisivel);
 if(ativar){carregarOrigensNPC();if(eu.logado)carregarBibliotecaNPC();}
}
$('modo-solo').onclick=()=>navegarMesa('solo');
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
 if(!eu.logado){navegarMesa('conta');return;}
 soloOrigemPreferida=Number($('solo-aventura').value)||soloOrigemPreferida;
 soloTituloPreferido=$('solo-titulo-campanha').value;
 soloRetomarFicha=true;navegarMesa('personagens',()=>{
 limparFicha();
 aviso('Salve a nova ficha para voltar à preparação da jornada.');
 });
};
function soloEstado(mensagem,erro=false){
 const jogo=!$('solo-jogo').hidden;
 for(const id of ['solo-alerta','solo-jogo-alerta']){const e=$(id),mostrar=(id==='solo-jogo-alerta')===jogo&&Boolean(mensagem);e.textContent=mostrar?mensagem:'';e.classList.toggle('erro',erro);if(id==='solo-jogo-alerta')e.hidden=!mostrar;}
 if(jogo&&erro&&$('solo-personagem-dialog').open){$('solo-personagem-dialog').close();}
}
async function soloAtualizarInicio(){
 soloFecharPaineis();$('solo-entrada').hidden=false;$('solo-jogo').hidden=true;soloCampanhaId=null;soloEstado('');
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
let soloResumoXP=null,soloResumoEstado=null;
function pintarXP(alvo,xp,modo='xp'){
 alvo.replaceChildren();if(!xp){alvo.append(el('p','Vincule uma ficha para registrar experiência.','suave'));return;}
 alvo.append(el('strong',xp.personagem+' · '+(xp.nivel===null?'Perfil narrativo':'Nível '+xp.nivel)),el('p',xp.total.toLocaleString('pt-BR')+' XP'+(xp.proximo===null?'':' / '+xp.proximo.toLocaleString('pt-BR')+' XP')));
 if(xp.proximo!==null){const p=el('progress');p.max=xp.proximo-xp.base;p.value=Math.max(0,xp.total-xp.base);p.setAttribute('aria-label','Experiência para o próximo nível');alvo.append(p);}
 if(modo!=='xp')alvo.append(el('p',modo==='marcos'?'Marcos narrativos: evolução manual.':'Progressão automática desativada.','suave'));
}
function soloXP(xp,art){if(!xp)return;soloResumoXP=xp;soloAtualizarResumo();pintarXP($('solo-xp'),xp);if(xp.ganho>0&&art){art.append(el('p','✦ +'+xp.ganho+' XP · '+xp.categoria+(xp.subiu?' · Você subiu para o nível '+xp.nivel+'!':''),'mesa-xp-recompensa'));if(xp.subiu){if(!mesaMovimentoReduzido()&&!acessibilidadeMovimentoReduzido())art.animate([{opacity:.6},{opacity:1}],{duration:650});try{if(cinemaAudio?.state==='running'&&$('solo-cinema-som').checked){const t=cinemaAudio.currentTime;for(const [i,f] of [523,659,784].entries()){const o=cinemaAudio.createOscillator(),g=cinemaAudio.createGain();o.frequency.value=f;g.gain.setValueAtTime(.07,t+i*.13);g.gain.exponentialRampToValueAtTime(.001,t+i*.13+.22);o.connect(g);g.connect(cinemaAudio.destination);o.start(t+i*.13);o.stop(t+i*.13+.23);}}}catch{}}}}
function barraRecurso(alvo,nome,atual,max,classe){const linha=el('div','','mesa-recurso-linha');linha.append(el('strong',nome+' · '+atual+' / '+max));const p=el('progress');p.max=max;p.value=atual;p.className=classe;p.setAttribute('aria-label',nome);linha.append(p);alvo.append(linha);}
function dominioHabilidade(h){const pontos=Math.min(200,Math.max(0,Number(h.proficiencia)||0)),faixas=[[0,'Iniciante',0],[20,'Aprendiz',0],[50,'Proficiente',1],[100,'Especialista',2],[200,'Mestre',3]];let i=0;while(i+1<faixas.length&&pontos>=faixas[i+1][0])i++;const [base,grau,desconto]=faixas[i];const custo=Math.max(h.mana?1:0,(Number(h.mana)||0)-Math.min(Math.floor((Number(h.mana)||0)/2),desconto));return {pontos,base,grau,custo,proximo:faixas[i+1]?.[0]??null};}
function listarAquisicoes(alvo,a,nivel){
 for(const [titulo,lista] of [['Itens conquistados',a?.itens||[]],['Habilidades e proficiência',a?.habilidades||[]]]){const d=el('details');d.append(el('summary',titulo+' ('+lista.length+')'));for(const x of lista){const item=x.quantidade!==undefined,h=item?null:dominioHabilidade(x),card=el('div','','mesa-dominio');card.append(el('p',x.nome+' · Nível mínimo '+x.nivelMin+(item?' · ×'+x.quantidade:' · '+h.grau+' · custo de mana '+h.custo)+(nivel<x.nivelMin?' · Bloqueado':'')+(x.manual?' · Cadastrada':'')+' — '+x.descricao));if(h){barraRecurso(card,'Proficiência',h.pontos,200,'mesa-proficiencia');if(h.proximo!==null)card.append(el('p','Próximo grau: '+h.proximo+' pontos','suave'));else card.append(el('p','Domínio máximo','suave'));}d.append(card);}if(!lista.length)d.append(el('p','Nenhum ainda.','suave'));alvo.append(d);}
}
function soloRecursos(r,art){
 soloResumoEstado=r.recursos;soloAtualizarResumo();
 const e=r.recursos,alvo=$('solo-recursos'),sel=$('solo-uso');alvo.hidden=!e;$('solo-uso-campo').hidden=!e;alvo.replaceChildren();sel.replaceChildren(new Option('Ação livre',''));if(!e){soloAtualizarCompositor();return;}
 barraRecurso(alvo,'PV',e.pv,e.pvMax,'mesa-pv');if(e.manaMax)barraRecurso(alvo,'Mana',e.mana,e.manaMax,'mesa-mana');else{const ativar=el('button','Ativar mana (regra alternativa)','guia-abrir');ativar.type='button';ativar.onclick=async()=>{if(soloOcupado||!soloCampanhaId||!confirm('Ativar mana nesta campanha? Esta escolha é permanente e não faz parte das regras padrão de D&D.'))return;const id=soloCampanhaId;ativar.disabled=true;try{await api('/api/solo/campanhas/'+id+'/mana','POST',{});await soloAbrir(id);}catch(err){soloEstado(err.message,true);}finally{ativar.disabled=false;}};alvo.append(ativar);}if(!e.dnd)alvo.append(el('p','Nível narrativo Mesa: '+e.nivel,'suave'));
 if(e.pv===0)alvo.append(el('p','Sem PV: escolha pedir socorro ou descansar.','erro'));sel.add(new Option('Pedir socorro / descansar','socorro'));
 for(const [tipo,lista] of [['item',e.itens],['habilidade',e.habilidades]])for(const x of lista){const custo=tipo==='habilidade'&&e.manaMax?dominioHabilidade(x).custo:0;const o=new Option(x.nome+(tipo==='item'?' · ×'+x.quantidade:' · '+dominioHabilidade(x).grau+(custo?' · '+custo+' mana':''))+(e.nivel<x.nivelMin?' · requer nível '+x.nivelMin:''),tipo+':'+x.id);o.disabled=e.pv===0||e.nivel<x.nivelMin||(tipo==='item'&&x.quantidade<1)||custo>e.mana;sel.add(o);}
 if(e.pv===0)sel.value='socorro';soloAtualizarCompositor();listarAquisicoes(alvo,e,e.nivel);if(art&&r.eventosRecursos?.length)for(const ev of r.eventosRecursos)art.append(el('p',ev,'mesa-xp-recompensa'));
}
function soloXPInicio(r){soloResumoXP=r.xp;soloRecursos(r);pintarXP($('solo-xp'),r.xp,r.campanha.progressao);const sel=$('solo-xp-ficha');sel.replaceChildren(new Option('Escolha uma ficha',''));for(const p of soloPersonagens)sel.add(new Option(p.nome,String(p.id)));$('solo-xp-vincular').hidden=Boolean(r.campanha.personagem_id)||!soloPersonagens.length;}
$('solo-xp-confirmar').onclick=async()=>{const id=soloCampanhaId,p=$('solo-xp-ficha').value;if(!id||!p||soloOcupado)return;const b=$('solo-xp-confirmar');b.disabled=true;try{await api('/api/solo/campanhas/'+id+'/personagem','POST',{personagemId:Number(p)});await soloAbrir(id);}catch(e){soloEstado(e.message,true);}finally{b.disabled=false;}};
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
 const tipo=['dano','cura','ataque','teste'].includes(teste.tipo)?teste.tipo:'teste';
 const q=Number(teste.quantidade),faces=Number(teste.dado),mod=Number(teste.modificador);
 const critico=tipo==='dano'&&teste.critico===true;
 const extras=['dano','cura'].includes(tipo)?Number(teste.extraQuantidade||0):0;
 const extraFaces=Number(teste.extraLados||4);
 const bonus=mod?(mod>0?' + '+mod:' - '+Math.abs(mod)):'';
 const formula=(critico?'Crítico: ':'')+(critico?q*2:q)+'d'+faces+
  (extras?' + '+(critico?extras*2:extras)+'d'+extraFaces:'')+bonus;
 const vantagem=teste.vantagem==='vantagem'?' · Vantagem (maior d20)'
  :teste.vantagem==='desvantagem'?' · Desvantagem (menor d20)':'';
 caixa.appendChild(el('p','Role '+formula+vantagem+
  (Number.isInteger(teste.dificuldade)?' · Dificuldade '+teste.dificuldade:''),'solo-teste-formula'));
 caixa.appendChild(el('p',teste.explicacao||'O dado indica o resultado de uma ação incerta.','solo-teste-explicacao'));
 const palco=el('div','','solo-dado-animacao');
 caixa.appendChild(palco);
  const botao=el('button','🎲 Rolar '+formula,'guia-abrir');botao.type='button';
 botao.onclick=async()=>{
  if(soloOcupado||!soloCampanhaId)return;
  soloOcupado=true;botao.disabled=true;$('solo-enviar').disabled=true;$('solo-voltar').disabled=true;
  const animacao=iniciarAnimacaoDado(palco,faces,critico?q*2:q);
  acessibilidadeSomDado();
  const texto=el('p','Rolando e consultando o Mestre IA...','solo-teste-status');caixa.appendChild(texto);
  try{
   const r=await api('/api/solo/campanhas/'+soloCampanhaId+'/turnos','POST',{tipo:'rolagem',numero});
   const v=r.rolagem;
   animacao.concluir(v.valores);
   const detalhe=v.comparacao
     ?'2d20 ['+v.comparacao.primeiro+', '+v.comparacao.segundo+'] → '+v.comparacao.escolhido
     :'['+v.valores.join(' + ')+']';
   const outros=v.adicionais?.length?' + ['+v.adicionais.join(' + ')+']':'';
   const modificador=v.modificador?(v.modificador>=0?' + ':' - ')+Math.abs(v.modificador):'';
   const resultado='🎲 '+v.nome+' · '+(v.expressao||formula)+': '+detalhe+outros+
     modificador+' = '+v.total+
     (v.criticoNatural?' · 🎯 Acerto crítico (20 natural)!':v.falhaNatural?' · Falha automática (1 natural)':'')+
     (v.passou===null?'':v.passou?' · Sucesso!':' · Falha');
   soloMensagem('jogador',resultado,'acao');
   const acompanhar=soloPertoDoFim();const art=soloMensagem('mestre',r.narracao,'acao',r.teste,r.numero);soloXP(r.xp,art);soloRecursos(r,art);if(acompanhar)soloFimLista(art);else soloBotaoFim();
   if(mesaTelaVisivel==='solo')cinemaSolo(r.narracao);
   botao.remove();texto.textContent='Resultado registrado nesta campanha.';
   soloEstado('');
  }catch(e){animacao.cancelar();palco.replaceChildren();texto.textContent=e.message;botao.disabled=false;soloEstado('Não foi possível concluir a rolagem: '+e.message,true);}
  finally{soloOcupado=false;$('solo-enviar').disabled=false;$('solo-voltar').disabled=false;soloBotaoFim();}
 };
 caixa.appendChild(botao);art.appendChild(caixa);
}
function soloAtualizarResumo(){
 const alvo=$('solo-resumo-recursos');alvo.replaceChildren();alvo.hidden=!soloResumoXP&&!soloResumoEstado;
 if(alvo.hidden)return;
 const e=soloResumoEstado,x=soloResumoXP;
 const ficha=el('span',x?.personagem||'Personagem','solo-resumo-nome');alvo.append(ficha);
 const chip=(nome,valor,classe)=>{const p=el('span','','solo-chip '+classe);p.append(el('strong',nome),el('span',valor));alvo.append(p);};
 if(e){chip('Nível',String(e.nivel),'nivel');chip('PV',e.pv+'/'+e.pvMax,'pv');if(e.manaMax)chip('MP',e.mana+'/'+e.manaMax,'mana');}
 else if(x?.nivel!=null)chip('Nível',String(x.nivel),'nivel');
 if(x)chip('XP',x.total.toLocaleString('pt-BR')+(x.proximo==null?'':'/'+x.proximo.toLocaleString('pt-BR')),'xp');
}
function soloFecharPaineis(){for(const id of ['solo-personagem-dialog','solo-ajustes-dialog']){const d=$(id);if(d?.open)d.close();}}
for(const [botao,painel] of [['solo-personagem-abrir','solo-personagem-dialog'],['solo-ajustes-abrir','solo-ajustes-dialog']]){
 $(botao).onclick=()=>{soloFecharPaineis();$(painel).showModal();};
}
for(const b of document.querySelectorAll('[data-solo-fechar]'))b.onclick=()=>$(b.dataset.soloFechar).close();
for(const id of ['solo-personagem-dialog','solo-ajustes-dialog'])$(id).addEventListener('click',ev=>{const d=$(id);if(ev.target!==d)return;const b=d.getBoundingClientRect();if(ev.clientX<b.left||ev.clientX>b.right||ev.clientY<b.top||ev.clientY>b.bottom)d.close();});
function soloAtualizarCompositor(){
 const ajuste=$('solo-tipo').value==='ajuste',campo=$('solo-acao'),recurso=$('solo-uso');
 recurso.disabled=ajuste;
 $('solo-modo-dica').textContent=ajuste?'Solicite uma alteração na história.':'Descreva sua ação ou selecione um recurso.';
 campo.placeholder=ajuste?'O que você quer mudar na história?':'O que você faz agora?';
 $('solo-contagem').textContent=campo.value.length+'/1600';
 campo.style.height='auto';campo.style.height=Math.min(campo.scrollHeight,120)+'px';
}
$('solo-tipo').addEventListener('change',soloAtualizarCompositor);
$('solo-acao').addEventListener('input',soloAtualizarCompositor);
function soloPertoDoFim(){const p=$('solo-mensagens');return p.scrollHeight-p.scrollTop-p.clientHeight<90;}
function soloBotaoFim(){$('solo-ultima-mensagem').hidden=soloPertoDoFim();}
$('solo-mensagens').addEventListener('scroll',soloBotaoFim,{passive:true});
$('solo-ultima-mensagem').onclick=()=>soloFimLista();
function soloFimLista(cena=null){
 const painel=$('solo-mensagens');
 requestAnimationFrame(()=>{if($('solo-jogo').hidden)return;if(cena&&painel.contains(cena)){const y=cena.getBoundingClientRect().top-painel.getBoundingClientRect().top+painel.scrollTop;const altura=cena.getBoundingClientRect().height;if(altura>painel.clientHeight-24)painel.scrollTop=Math.max(0,y-12);else painel.scrollTop=painel.scrollHeight;}else painel.scrollTop=painel.scrollHeight;soloBotaoFim();});
}
async function soloAbrir(id){
 if(soloOcupado)return;
 soloEstado('');
 try{
  const r=await api('/api/solo/campanhas/'+id);
  soloCampanhaId=r.campanha.id;
  $('solo-jogo-titulo').textContent=r.campanha.titulo;
  $('solo-mensagens').replaceChildren();
  soloXPInicio(r);for(const msg of r.mensagens){const art=soloMensagem(msg.papel,msg.texto,msg.tipo,msg.papel==='mestre'&&Number(msg.numero)===Number(r.campanha.turno_atual)?msg.teste:null,msg.numero);const g=msg.papel==='mestre'&&r.ganhos?.find(g=>Number(g.chave)===Number(msg.numero));if(g)art.append(el('p','✦ +'+g.quantidade+' XP · '+g.categoria,'mesa-xp-recompensa'));if(msg.papel==='mestre'&&Array.isArray(msg.recursos_evento))for(const ev of msg.recursos_evento)art.append(el('p',ev,'mesa-xp-recompensa'));}
  soloMostrarTrilha(r.campanha.genero,r.campanha.tom);
  soloFecharPaineis();$('solo-entrada').hidden=true;$('solo-jogo').hidden=false;soloEstado('');
  $('solo-acao').value='';$('solo-tipo').value='acao';soloAtualizarCompositor();soloFimLista($('solo-mensagens').lastElementChild);window.scrollTo(0,0);
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
   tom:$('solo-tom').value,aventuraId:origem?Number(origem):null,personagemId:personagem?Number(personagem.id):null,progressao:$('solo-progressao').value,modoRecursos:$('solo-modo-recursos').value,ideia
  });
  await soloAbrirDepoisCriar(r);
 }catch(e){soloEstado(e.message,true);}
 finally{soloOcupado=false;$('solo-criar').disabled=false;}
};
async function soloAbrirDepoisCriar(r){
 soloCampanhaId=r.campanha.id;
 $('solo-jogo-titulo').textContent=r.campanha.titulo;
 $('solo-mensagens').replaceChildren();
 soloXPInicio(r);soloMensagem('mestre',r.mestre,'inicio',r.teste,0);
  soloMostrarTrilha($('solo-genero').value,$('solo-tom').value,soloOrigens.find(a=>String(a.id)===$('solo-aventura').value)?.conteudo?.trilha||'');
 soloFecharPaineis();$('solo-entrada').hidden=true;$('solo-jogo').hidden=false;soloEstado('');
 $('solo-acao').value='';$('solo-tipo').value='acao';soloAtualizarCompositor();soloFimLista($('solo-mensagens').lastElementChild);window.scrollTo(0,0);if(mesaTelaVisivel==='solo')cinemaSolo(r.mestre);
}
$('solo-acao-form').onsubmit=async ev=>{
 ev.preventDefault();if(soloOcupado||!soloCampanhaId)return;
 const acao=$('solo-acao').value.trim(),tipo=$('solo-tipo').value;
 if(!acao)return;
 soloOcupado=true;$('solo-enviar').disabled=true;$('solo-voltar').disabled=true;
 soloEstado('O Mestre IA está narrando a consequência...');
 const rascunho=soloMensagem('jogador',acao,tipo);
 const esperando=soloMensagem('mestre','Escrevendo a próxima cena...');esperando.classList.add('solo-escrevendo');
 $('solo-acao').readOnly=true;
 soloFimLista();
 try{
  const r=await api('/api/solo/campanhas/'+soloCampanhaId+'/turnos','POST',{acao,tipo,uso:tipo==='acao'?$('solo-uso').value||null:null});
  const acompanhar=soloPertoDoFim();esperando.classList.remove('solo-escrevendo');esperando.querySelector('p').textContent=r.narracao;soloXP(r.xp,esperando);soloRecursos(r,esperando);
  if(mesaTelaVisivel==='solo')cinemaSolo(r.narracao);
  if(r.teste)soloAdicionarTeste(esperando,r.teste,r.numero);
  $('solo-acao').value='';soloEstado('');if(acompanhar)soloFimLista(esperando);else soloBotaoFim();
 }catch(e){
  rascunho.remove();esperando.remove();soloEstado(e.message,true);soloBotaoFim();
 }finally{soloOcupado=false;$('solo-enviar').disabled=false;$('solo-voltar').disabled=false;$('solo-acao').readOnly=false;soloAtualizarCompositor();}
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
// Os cálculos seguem o módulo puro MesaDiceRules e não modificam o RPG Solo.
const dadosRegras=window.MesaDiceRules;
const dadosBotoes=[];
function dadosTipoAtualizar(){
 const tipo=$('dados-tipo').value;
 const comExtras=['livre','dano','cura'].includes(tipo);
 $('dados-extras-campos').hidden=!comExtras;
 $('dados-critico-campo').hidden=tipo!=='dano';
 $('dados-vantagem-campo').hidden=!['ataque','teste'].includes(tipo);
 $('dados-defesas').hidden=tipo!=='dano';
 $('dados-preparar-dano').hidden=true;
 const d20=['ataque','teste'].includes(tipo);
 if(d20){$('qtd').value='1';$('qtd').disabled=true;}
 else $('qtd').disabled=false;
 for(const {lados,botao} of dadosBotoes){
  botao.disabled=d20&&lados!==20;
  botao.title=botao.disabled?'Para ataque ou teste, escolha d20.':'Rolar '+lados+' faces';
 }
 $('dados-calculadora-ajuda').textContent=tipo==='dano'
  ? 'Crítico em D&D 5e/2024: dobre os dados de dano (inclusive os adicionais), mas não os bônus fixos. Proficiência normalmente não entra no dano.'
  :tipo==='ataque'?'No ataque, 20 natural é acerto crítico e 1 natural é falha. Aplique proficiência quando tiver domínio da arma ou magia.'
  :tipo==='teste'?'Vantagem: usa o maior de 2d20. Desvantagem: usa o menor. Ajuste atributo, proficiência e outros bônus.'
  :tipo==='cura'?'Cura: some os dados e bônus; o total mostrado não fica abaixo de zero.'
  :'Rolagem livre: some dados, modificadores e dados adicionais.';
}
$('dados-tipo').onchange=dadosTipoAtualizar;
function dadosNumero(id,min,max){
 const raw=$(id).value.trim();
 const numero=raw===''?0:Number(raw);
 if(!Number.isInteger(numero)||numero<min||numero>max){
  throw new Error('Valor inválido em '+$(id).previousElementSibling?.textContent+'. Use um inteiro de '+min+' a '+max+'.');
 }
 return numero;
}
function dadosRolar(lados){
 const palco=$('dados-animacao'),preparar=$('dados-preparar-dano');
 preparar.hidden=true;
 try{
  const tipo=$('dados-tipo').value;
  const quantidade=dadosNumero('qtd',1,20);
  const atributo=dadosNumero('dados-modificador',-100,100);
  const proficiencia=dadosNumero('dados-proficiencia',-100,100);
  const outro=dadosNumero('dados-outro-bonus',-100,100);
  const extraQuantidade=['livre','dano','cura'].includes(tipo)?dadosNumero('dados-extra-quantidade',0,20):0;
  const extraLados=Number($('dados-extra-lados').value);
  const d20=tipo==='ataque'||tipo==='teste';
  const alvo=d20&&$('dados-alvo').value.trim()!==''?dadosNumero('dados-alvo',0,1000):null;
  const reducao=tipo==='dano'?dadosNumero('dados-reducao',0,300):0;
  const resistencia=tipo==='dano'&&$('dados-resistencia').checked;
  const vulnerabilidade=tipo==='dano'&&$('dados-vulnerabilidade').checked;
  const imunidade=tipo==='dano'&&$('dados-imunidade').checked;
  const resultado=dadosRegras.rolar({
   tipo,lados,quantidade,modificador:atributo+proficiencia+outro,
   extraQuantidade,extraLados,critico:tipo==='dano'&&$('dados-critico').checked,
   vantagem:d20?$('dados-vantagem').value:'normal',
   alvo,reducao,resistencia,vulnerabilidade,imunidade
  });
  const animacao=iniciarAnimacaoDado(palco,lados,resultado.valores.length);
  acessibilidadeSomDado();
  $('total').textContent='🎲';
  $('detalhe').textContent='Rolando '+resultado.expressao+'...';
  $('info-dados').textContent='';
  const finalizar=()=>{
   if(palco._mesaAnimacao!==animacao)return;
   animacao.concluir(resultado.valores);
   $('total').textContent=String(resultado.total);
   const principal=resultado.comparacao
    ?'2d20 ['+resultado.comparacao.primeiro+', '+resultado.comparacao.segundo+'] → '+resultado.comparacao.escolhido+' ('+resultado.vantagem+')'
    :resultado.valores.length+'d'+lados+' ['+resultado.valores.join(' + ')+']';
   const extras=resultado.adicionais.length?' + '+resultado.adicionais.length+'d'+extraLados+' ['+resultado.adicionais.join(' + ')+']':'';
   const bonus=[['atributo',atributo],['proficiência',proficiencia],['outros',outro]]
    .filter(([,v])=>v!==0).map(([nome,v])=>(v>=0?' + ':' - ')+Math.abs(v)+' ('+nome+')').join('');
   let conta=resultado.expressao+' = '+principal+extras+bonus+' = '+resultado.bruto;
   const notas=[];
   if(tipo==='dano'){
    const tipoDano=$('dados-tipo-dano').selectedOptions[0]?.textContent||'dano';
    if(resultado.bruto<0)conta+=' → mínimo 0';
    if(reducao)conta+=' → redução '+reducao+': '+resultado.aposReducao;
    if(resistencia)conta+=' → resistência ÷ 2 (arredonda para baixo): '+resultado.aposResistencia;
    if(vulnerabilidade)conta+=' → vulnerabilidade × 2: '+resultado.aposResistencia*2;
    if(imunidade)conta+=' → imunidade: 0';
    conta+=' = '+resultado.total+' de dano ('+tipoDano+')';
    if(resultado.critico)notas.push('🎯 Crítico: dados de dano e dados adicionais duplicados; bônus fixos aplicados uma só vez.');
    if(resistencia||vulnerabilidade||imunidade)notas.push('As proteções foram calculadas somente para este tipo de dano.');
   }else if(tipo==='cura'){
    if(resultado.bruto<0)conta+=' → mínimo 0';
    conta+=' = '+resultado.total+' de cura';
   }else{
    if(alvo!==null)conta+=' · '+(tipo==='ataque'?'CA ':'CD ')+alvo;
    if(resultado.passou===true)notas.push(tipo==='ataque'?'✅ Ataque acertou!':'✅ Teste bem-sucedido!');
    if(resultado.passou===false)notas.push(tipo==='ataque'?'❌ Ataque errou.':'❌ Teste falhou.');
    if(resultado.criticoNatural)notas.push('🎯 20 natural: acerto crítico! Prepare a rolagem de dano.');
    if(resultado.falhaNatural)notas.push('⚠️ 1 natural: ataque erra independentemente do bônus.');
    if(tipo==='teste'&&resultado.natural===20)notas.push('20 natural no teste não significa sucesso automático.');
    if(tipo==='teste'&&resultado.natural===1)notas.push('1 natural no teste não significa falha automática.');
    if(tipo==='ataque'&&resultado.passou===true){
     preparar.dataset.critico=String(resultado.criticoNatural);
     preparar.textContent=resultado.criticoNatural?'🎯 Preparar dano crítico':'⚔️ Preparar dano do ataque';
     preparar.hidden=false;
    }
   }
   $('detalhe').textContent=conta;
   $('info-dados').textContent=notas.join(' ');
  };
  if(acessibilidadeMovimentoReduzido())finalizar();
  else setTimeout(finalizar,950);
 }catch(e){
  $('total').textContent='–';
  $('detalhe').textContent=e.message;
  $('info-dados').textContent='Revise os campos e tente novamente.';
 }
}
$('dados-preparar-dano').onclick=()=>{
 const critico=$('dados-preparar-dano').dataset.critico==='true';
 $('dados-tipo').value='dano';
 dadosTipoAtualizar();
 $('dados-critico').checked=critico;
 $('dados-proficiencia').value='0'; // Em geral, proficiência não é somada ao dano.
 $('qtd').value='1';
 $('dados-calculadora-ajuda').textContent=critico
  ?'🎯 Crítico preparado. Escolha o dado da arma ou magia e role. Dados extras também são dobrados; bônus fixos entram uma vez.'
  :'⚔️ Dano preparado. Escolha o dado da arma ou magia e role. Proficiência foi retirada; confira os outros bônus.';
 $('dados-critico').focus();
};

[4,6,8,10,12,20,100].forEach(lados=>{
 const botao=el('button','d'+lados,'dado');botao.type='button';
 botao.onclick=()=>dadosRolar(lados);
 dadosBotoes.push({lados,botao});$('dados').appendChild(botao);
});
dadosTipoAtualizar();

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
let sugestaoAtributosAplicada=false,kitInicialAplicado=false;
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
 const botao=$('p-gerar-kit');
 botao.disabled=kitInicialAplicado||!fichaAbertaId||!kit;
 botao.textContent=kitInicialAplicado?'✓ Equipamentos adicionados':'✦ Sugerir kit inicial';
 botao.classList.toggle('mesa-sugestao-aplicada',kitInicialAplicado);
 $('p-kit-origem').textContent=kitInicialAplicado?'Kit inicial adicionado a esta ficha. Você pode editar os itens manualmente. Salve a ficha para guardar as alterações.':!fichaAbertaId
 ? 'Selecione um personagem existente ou crie e salve uma ficha para editar o inventário.'
 : kit ? 'Sugestão para '+kit.descricao+'. Revise os itens com o mestre.'
 : 'Selecione cenário e classe ou especialidade para sugerir equipamentos.';
 if($('p-inventario-aviso'))$('p-inventario-aviso').hidden=Boolean(fichaAbertaId);
}

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
 jornada:['Chominciamento de Gioia','Ririkuku','CC BY-SA 4.0','Chominciamento_de_Gioia1.ogg'],
 frieren:['Frieren · trilha escolhida','YouTube','Player oficial','2E_qlyy5N-I']
};
// A faixa global continua tocando ao navegar entre as telas, sem autoplay.
const musicaGlobal=new Audio();musicaGlobal.loop=true;musicaGlobal.preload='none';
const musicaUrl=v=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+v[3];
const musicaFonteUrl=v=>'https://commons.wikimedia.org/wiki/File:'+v[3];
const musicaSelecionada=$('musica-faixa');
for(const [id,faixa] of Object.entries(sons))musicaSelecionada.add(new Option(faixa[0]+' · '+faixa[1],id));
try{const escolhida=localStorage.getItem('mesa-faixa-preferida');if(escolhida&&sons[escolhida])musicaSelecionada.value=escolhida;}catch{}
const musicaStatus=$('musica-estado'),musicaBotao=$('musica-tocar'),musicaVideo=$('musica-video');
function musicaFecharVideo(){
 musicaVideo.replaceChildren();
 musicaVideo.hidden=true;
}
function musicaEYouTube(){return musicaSelecionada.value==='frieren';}
function musicaMostrarYouTube(){
 musicaFecharVideo();
 // YouTube opera o reprodutor e as permissões da própria música; nenhum
 // arquivo com direitos de terceiros é baixado ou republicado pelo Mesa.
 const frame=document.createElement('iframe');
 frame.src='https://www.youtube-nocookie.com/embed/2E_qlyy5N-I?rel=0';
 frame.title='Frieren — música escolhida, reprodutor do YouTube';
 frame.loading='lazy';frame.allow='encrypted-media; picture-in-picture';
 frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.setAttribute('allowfullscreen','');
 musicaVideo.appendChild(frame);musicaVideo.hidden=false;
 musicaBotao.textContent='■ Fechar player de Frieren';
 $('musica-indicador').classList.add('tocando');
 musicaStatus.textContent='Player de Frieren aberto. Toque em reproduzir dentro do YouTube; o volume é controlado no vídeo.';
}
function musicaAtualizarFonte(){
 const v=sons[musicaSelecionada.value];
 $('musica-fonte').href=musicaEYouTube()?'https://www.youtube.com/watch?v=2E_qlyy5N-I':musicaFonteUrl(v);
 $('musica-fonte').textContent=musicaEYouTube()?'Abrir música de Frieren no YouTube ↗':'Fonte e licença: '+v[1]+' · '+v[2]+' ↗';
 $('musica-volume').disabled=musicaEYouTube();
 $('musica-volume').title=musicaEYouTube()?'Ajuste o volume no player do YouTube':'Volume da música';
}
function musicaParar(){
 musicaGlobal.pause();musicaFecharVideo();musicaBotao.textContent='▶ Tocar música';
 $('musica-indicador').classList.remove('tocando');
}
musicaGlobal.onended=musicaParar;
$('musica-fechar').onclick=()=>navegarMesa(mesaAntesDaMusica);
musicaSelecionada.onchange=()=>{
 musicaParar();musicaGlobal.removeAttribute('src');musicaGlobal.load();
 musicaAtualizarFonte();musicaStatus.textContent='Faixa selecionada. Toque em Reproduzir.';
 try{localStorage.setItem('mesa-faixa-preferida',musicaSelecionada.value);}catch{}
};
$('musica-volume').oninput=()=>{
 musicaGlobal.volume=Number($('musica-volume').value)/100;
};
musicaBotao.onclick=async()=>{
 if(musicaEYouTube()){
  if(!musicaVideo.hidden){musicaParar();musicaStatus.textContent='Player de Frieren fechado.';return;}
  pararJornada();musicaGlobal.pause();musicaMostrarYouTube();return;
 }
 if(!musicaGlobal.paused){musicaParar();musicaStatus.textContent='Música pausada.';return;}
 // Não permite duas músicas simultâneas entre o player global e os cards da história.
 pararJornada();
 const faixa=sons[musicaSelecionada.value];
 if(!musicaGlobal.getAttribute('src'))musicaGlobal.src=musicaUrl(faixa);
 musicaGlobal.volume=Number($('musica-volume').value)/100;
 musicaBotao.disabled=true;musicaStatus.textContent='Carregando '+faixa[0]+'...';
 try{
  await musicaGlobal.play();
  musicaBotao.textContent='❚❚ Pausar música';
  musicaStatus.textContent='Tocando '+faixa[0]+'. A música continua ao trocar de tela.';
  $('musica-indicador').classList.add('tocando');
 }catch{
  musicaParar();musicaStatus.textContent='Não foi possível tocar esta gravação. Use o link da fonte para ouvi-la.';
 }finally{musicaBotao.disabled=false;}
};
musicaAtualizarFonte();
// O botão Voltar e o menu controlam a página de música; Escape permanece reservado aos painéis.
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
  musicaParar();pararJornada();const v=sons[sel.value];tocadorJornada={b,s:estado};audioJornada.src=url('Special:Redirect/file/',v);audioJornada.volume=Number(volume.value)/100;b.disabled=true;b.textContent='Carregando...';
  try{await audioJornada.play();b.textContent='❚❚ Pausar';estado.textContent='Tocando '+v[0];}
  catch{pararJornada();estado.textContent='Não foi possível carregar. Abra a fonte para ouvir.';}
  finally{b.disabled=false;}
 };
 linha.append(sel,b,volume);p.append(linha,estado,fonte);alvo.append(p);
}
window.addEventListener('pagehide',()=>{pararJornada();musicaParar();});
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
  const botao=$('p-aplicar-sugestao');
  botao.disabled=sugestaoAtributosAplicada||fichaNarrativa()||!sugerida;
  botao.textContent=sugestaoAtributosAplicada?'✓ Pontos distribuídos':'Aplicar sugestão de 27 pontos';
  botao.classList.toggle('mesa-sugestao-aplicada',sugestaoAtributosAplicada);
  $('p-recomendacao').textContent = sugestaoAtributosAplicada?'Os 27 pontos sugeridos foram distribuídos. Você ainda pode ajustar os atributos manualmente. Salve a ficha para guardar as alterações.':sugerida
    ? sugerida.dica+' A sugestão usa os 27 pontos e ainda não inclui bônus de antecedente. Você pode modificá-la.'
    : 'Escolha uma classe para ver os atributos que vale a pena priorizar.';
}
$('p-aplicar-sugestao').onclick = () => {
  const classe = $('p-classe').value;
  const sugerida = sugestoesDnd[classe];
  if (sugestaoAtributosAplicada || fichaNarrativa() || !sugerida) return;
  const atual = atributosDnd.map(([sigla]) => Number($('at-'+sigla).value));
  if (atual.some((valor,i) => valor !== 8 && valor !== sugerida.valores[i]) &&
      !confirm('Aplicar a sugestão substituirá os atributos atuais. Continuar?')) return;
  atributosDnd.forEach(([sigla],i) => { $('at-'+sigla).value = String(sugerida.valores[i]); });
  sugestaoAtributosAplicada=true;
  atualizarPontosDnd();atualizarSugestaoClasse();
  aviso('Os 27 pontos sugeridos foram distribuídos. Salve a ficha para confirmar.',true);
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
let avatarObjectUrl=null,avatarEnviando=false,avatarVersao=0;
function limparPreviewAvatar(){
  avatarVersao++;
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
  $('p-avatar-file').disabled=avatarEnviando;$('p-avatar-escolher').disabled=avatarEnviando;
  $('p-avatar-tentar').hidden=!avatarPendente||!salvo||avatarEnviando;
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
  const id=fichaAbertaId,versao=avatarVersao;
  try{
    const response=await fetch(API_BASE_URL+'/api/personagens/'+id+'/avatar',{credentials:'include',cache:'no-store'});
    if(response.status===404)return;
    if(!response.ok){const dados=await response.json().catch(()=>({}));throw new Error(dados.erro||'Não foi possível carregar o retrato salvo.');}
    const blob=await response.blob();
    if(String(fichaAbertaId)!==String(id)||versao!==avatarVersao)return;
    avatarObjectUrl=URL.createObjectURL(blob);
    $('p-avatar-img').src=avatarObjectUrl;
    $('p-avatar-img').hidden=false;
    $('p-avatar-vazio').hidden=true;
    $('p-avatar-remover').hidden=false;
  }catch(e){
    if(String(fichaAbertaId)===String(id)&&versao===avatarVersao)$('p-avatar-info').textContent=e.message||'Não foi possível carregar a foto. Tente novamente.';
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
    try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Tempo de leitura excedido')),12000);foto.onload=()=>{clearTimeout(timer);resolve();};foto.onerror=()=>{clearTimeout(timer);reject(Error('Formato incompatível'));};foto.src=url;});}catch{throw new Error('Este formato não pôde ser aberto. No celular, salve a foto como JPG ou PNG e tente novamente.');}
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
  if(avatarEnviando)return false;
  const campo=$('p-avatar-file');avatarEnviando=true;avatarPendente=arquivo;
  campo.disabled=true;$('p-avatar-escolher').disabled=true;$('p-avatar-tentar').hidden=true;
  $('p-avatar-info').textContent='Otimizando a foto e enviando...';
  try{
    const imagem=await prepararWebpAvatar(arquivo);
    if(String(fichaAbertaId)!==String(id))throw new Error('A ficha selecionada mudou. Abra o personagem e tente novamente.');
    await api('/api/personagens/'+id+'/avatar','POST',{imagem});
    if(String(fichaAbertaId)!==String(id))return true;
    avatarPendente=null;
    limparPreviewAvatar();
    avatarObjectUrl=URL.createObjectURL(new Blob([Uint8Array.from(atob(imagem),c=>c.charCodeAt(0))],{type:'image/webp'}));
    $('p-avatar-img').src=avatarObjectUrl;$('p-avatar-img').hidden=false;$('p-avatar-vazio').hidden=true;$('p-avatar-remover').hidden=false;
    aviso('Retrato salvo com sucesso!',true);
    $('p-avatar-info').textContent='Retrato salvo! Você pode trocar a foto quando quiser.';
    return true;
  }catch(e){
    if(String(fichaAbertaId)===String(id)){$('p-avatar-info').textContent='Falha no envio: '+e.message;avatarPendente=arquivo;}
    aviso(e.message);return false;
  }finally{
    avatarEnviando=false;campo.value='';campo.disabled=false;$('p-avatar-escolher').disabled=false;
    $('p-avatar-tentar').hidden=!avatarPendente||!fichaAbertaId;
  }
}
$('p-avatar-escolher').onclick=()=>{if(!avatarEnviando){$('p-avatar-file').value='';$('p-avatar-file').click();}};
$('p-avatar-tentar').onclick=()=>{if(avatarPendente&&fichaAbertaId)enviarAvatar(avatarPendente,fichaAbertaId);};
$('p-avatar-file').onchange=async()=>{
  const arquivo=$('p-avatar-file').files?.[0];
  if(!arquivo||avatarEnviando)return;
  avatarPendente=arquivo;
  if(!fichaAbertaId){
    limparPreviewAvatar();
    avatarObjectUrl=URL.createObjectURL(arquivo);
    $('p-avatar-img').src=avatarObjectUrl;$('p-avatar-img').hidden=false;$('p-avatar-vazio').hidden=true;
    atualizarEstadoAvatar();return;
  }
  await enviarAvatar(arquivo,fichaAbertaId);
};
$('p-avatar-remover').onclick=async()=>{
  if(avatarEnviando||!fichaAbertaId||!confirm('Remover o retrato desta personagem?'))return;
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
    const regras=el('div','','item-ficha-linha'),nivel=el('input'),mana=el('input'),ativa=el('input');
    nivel.type='number';nivel.min=1;nivel.max=20;nivel.value=h.nivelMin||1;nivel.setAttribute('aria-label','Nível mínimo');nivel.onchange=()=>{h.nivelMin=Math.max(1,Math.min(20,Math.trunc(Number(nivel.value)||1)));nivel.value=h.nivelMin;};
    mana.type='number';mana.min=0;mana.max=20;mana.value=h.mana||0;mana.setAttribute('aria-label','Custo de mana');mana.onchange=()=>{h.mana=Math.max(0,Math.min(20,Math.trunc(Number(mana.value)||0)));mana.value=h.mana;};
    ativa.type='checkbox';ativa.checked=h.treinavel!==false;ativa.onchange=()=>{h.treinavel=ativa.checked;};
    const ln=el('label','Nível mínimo'),lm=el('label','Mana (regra alternativa)'),la=el('label','Habilitada para prática');ln.append(nivel);lm.append(mana);la.prepend(ativa);regras.append(ln,lm);
    card.append(titulo,linha,desc,regras,la);lista.appendChild(card);
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
$('p-gerar-kit').onclick=()=>{
 if(kitInicialAplicado||!exigirPersonagemSalvo())return;
 const kit=sugerirEquipamentos();if(!kit)return;
 const existentes=new Set(inventarioFicha.map(i=>i.nome.trim().toLowerCase()));
 const faltantes=kit.itens.map(nome=>textoLimitado(nome,80)).filter(nome=>{const k=nome.toLowerCase();if(existentes.has(k))return false;existentes.add(k);return true;});
 if(inventarioFicha.length+faltantes.length>32){aviso('Não há espaço para o kit completo. Libere espaço no inventário antes de aplicar a sugestão.');return;}
 for(const nome of faltantes)inventarioFicha.push({nome,tipo:'Outros',quantidade:1,equipado:false,descricao:''});
 kitInicialAplicado=true;pintarInventario();atualizarKit();
 aviso(faltantes.length?faltantes.length+' equipamentos adicionados. Salve a ficha para confirmar.':'Os equipamentos sugeridos já estavam no inventário.',true);
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
  if(habilidadesFicha.some(h=>h.nome.trim().toLowerCase()===nome.trim().toLowerCase())){aviso('Essa habilidade já está cadastrada.');return;}
  habilidadesFicha.push({nome,tipo:$('p-habilidade-tipo').value,descricao:'',nivelMin:1,mana:0,treinavel:true});
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
    habilidadesFicha.push({nome:titulo,tipo:'Narrativa',descricao:'Ideia narrativa para discutir com o mestre; efeitos e permissões ainda não definidos.',nivelMin:1,mana:0,treinavel:false});
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
  sugestaoAtributosAplicada=d?.sugestaoAtributosAplicada===true;
  kitInicialAplicado=d?.kitInicialAplicado===true;
  inventarioFicha=normalizarInventario(d||{});
  habilidadesFicha=Array.isArray(d?.habilidades)?d.habilidades.slice(0,24).filter(x=>x&&typeof x.nome==='string').map(x=>({
    nome:textoLimitado(x.nome,80),tipo:categoriasHabilidade.includes(x.tipo)?x.tipo:'Narrativa',descricao:textoLimitado(x.descricao,200),nivelMin:Math.max(1,Math.min(20,Math.trunc(Number(x.nivelMin)||1))),mana:Math.max(0,Math.min(20,Math.trunc(Number(x.mana)||0))),treinavel:x.treinavel??!String(x.descricao||'').startsWith('Ideia narrativa para discutir com o mestre;')
  })).filter(x=>x.nome):[];
  evolucaoFicha=Array.isArray(d?.evolucao)?d.evolucao.slice(0,30).filter(x=>x&&typeof x.nota==='string').map(x=>({
    nota:textoLimitado(x.nota,160),nivel:Math.max(1,Math.min(20,Number(x.nivel)||1)),
    data:/^\d{4}-\d{2}-\d{2}$/.test(x.data)?x.data:new Date().toISOString().slice(0,10)
  })).filter(x=>x.nota):[];
  pintarInventario();pintarHabilidades();pintarEvolucao();
}
function limparFicha(){
 $('ficha-xp').hidden=true;$('ficha-aquisicoes').hidden=true;$('p-nivel').readOnly=false;
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
        $('p-nivel').value=d.nivel||1;$('p-nivel').readOnly=Boolean(item.progressao?.ativo&&item.progressao.nivel!==null);
        const ganhos=$('ficha-aquisicoes');ganhos.hidden=false;ganhos.replaceChildren(el('h3','Conquistas e domínio de habilidades'));listarAquisicoes(ganhos,{...item.aquisicoes_rpg,habilidades:item.habilidadesDisponiveis||item.aquisicoes_rpg?.habilidades},item.progressao?.nivel??Math.min(20,1+Math.floor(Math.sqrt((item.progressao?.total||0)/100))));
        const alvo=$('ficha-xp');alvo.hidden=false;pintarXP(alvo,item.progressao);api('/api/personagens/'+item.id+'/xp').then(r=>{if(String(fichaAbertaId)!==String(item.id))return;pintarXP(alvo,r.xp);const h=el('details');h.append(el('summary','Histórico de experiência'));for(const g of r.historico)h.append(el('p','+'+g.quantidade+' XP · '+g.categoria+' · '+new Date(g.criado_em).toLocaleDateString('pt-BR'),'suave'));if(!r.historico.length)h.append(el('p','Nenhuma recompensa registrada.','suave'));alvo.append(h);}).catch(()=>{});
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
    sugestaoAtributosAplicada,kitInicialAplicado,
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
    if(fotoAEnviar&&fichaAbertaId){const enviado=await enviarAvatar(fotoAEnviar,fichaAbertaId);if(!enviado){abrirAbaFicha('identidade');return;}}
    if(soloRetomarFicha){soloRetomarFicha=false;soloPersonagemPreferido=fichaAbertaId;navegarMesa('solo');}
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

// Perfil privado, com cota consultada diretamente no servidor.
let perfilFotoUrl=null,perfilRequisicao=0;
function limparFotoPerfil(){
 if(perfilFotoUrl)URL.revokeObjectURL(perfilFotoUrl);
 perfilFotoUrl=null;$('perfil-foto').removeAttribute('src');$('perfil-foto').hidden=true;$('perfil-foto-vazio').hidden=false;$('perfil-remover').disabled=true;
}
async function carregarMeuPerfil(){
 const token=++perfilRequisicao;
 limparFotoPerfil();$('perfil-nome').value='';$('perfil-email').value='';$('perfil-cota').textContent='Consultando limite diário...';$('perfil-progresso').hidden=true;$('perfil-status').textContent='';
 try{
  const p=await api('/api/conta/perfil');
  if(token!==perfilRequisicao||!eu.logado||mesaTelaVisivel!=='perfil')return;
  $('perfil-nome').value=p.nome;$('perfil-email').value=p.email;$('perfil-tratamento').value=p.tratamento||'neutro';$('perfil-apelido').value=p.apelido||'';$('perfil-bio').value=p.bio||'';$('perfil-encontravel').checked=!!p.encontravel;
  $('perfil-cota').textContent=p.limite===null?'Acesso administrativo sem limite de geração.':p.restantes+' de '+p.limite+' gerações disponíveis hoje.';
  if(p.limite!==null){$('perfil-progresso').max=p.limite;$('perfil-progresso').value=p.restantes;$('perfil-progresso').hidden=false;}
  if(p.temFoto){
   const resp=await fetch(API_BASE_URL+'/api/conta/perfil/foto',{credentials:'include',cache:'no-store'});
   if(!resp.ok)throw Error('Não foi possível carregar a foto.');
   const blob=await resp.blob();if(token!==perfilRequisicao||!eu.logado||mesaTelaVisivel!=='perfil')return;
   perfilFotoUrl=URL.createObjectURL(blob);$('perfil-foto').src=perfilFotoUrl;$('perfil-foto').hidden=false;$('perfil-foto-vazio').hidden=true;$('perfil-remover').disabled=false;
  }
 }catch(e){if(token===perfilRequisicao)$('perfil-status').textContent=e.message;}
}
$('perfil-form').onsubmit=async ev=>{
 ev.preventDefault();const b=ev.currentTarget.querySelector('button');b.disabled=true;
 try{await api('/api/conta/perfil','POST',{nome:$('perfil-nome').value,tratamento:$('perfil-tratamento').value,...($('perfil-apelido').value?{apelido:$('perfil-apelido').value.trim()}:{}),bio:$('perfil-bio').value,encontravel:$('perfil-encontravel').checked});await atualizarEu();$('perfil-status').textContent='Perfil salvo.';}
 catch(e){$('perfil-status').textContent=e.message;}finally{b.disabled=false;}
};
$('perfil-arquivo').onchange=async()=>{
 const campo=$('perfil-arquivo'),arquivo=campo.files?.[0];if(!arquivo)return;
 campo.disabled=true;$('perfil-status').textContent='Otimizando e enviando foto...';
 try{if(!['image/jpeg','image/png','image/webp'].includes(arquivo.type))throw Error('Escolha JPG, PNG ou WebP.');
 const imagem=await prepararWebpAvatar(arquivo);await api('/api/conta/perfil/foto','POST',{imagem});await carregarMeuPerfil();$('perfil-status').textContent='Foto salva.';}
 catch(e){$('perfil-status').textContent=e.message;}finally{campo.value='';campo.disabled=false;}
};
$('perfil-remover').onclick=async()=>{const b=$('perfil-remover');b.disabled=true;try{await api('/api/conta/perfil/foto','DELETE');limparFotoPerfil();$('perfil-status').textContent='Foto removida.';}catch(e){b.disabled=false;$('perfil-status').textContent=e.message;}};
$('perfil-opcoes').onclick=()=>navegarMesa('opcoes');
// Preferências locais, sem alterar ou restringir as opções assistivas.
const mesaPreferencias={ortografia:true,fonte:'padrao'};
const fontesMesa=['padrao','serifada','simples','mono'];
try{const p=JSON.parse(localStorage.getItem('mesa-preferencias-v1')||'{}');mesaPreferencias.ortografia=p.ortografia!==false;if(fontesMesa.includes(p.fonte))mesaPreferencias.fonte=p.fonte;}catch{}
function mesaAplicarOrtografia(raiz=document){
 const seletor='textarea,input:not([type]),input[type="text"],input[type="search"],[contenteditable="true"]';
 const campos=raiz.matches?.(seletor)?[raiz]:[...raiz.querySelectorAll(seletor)];
 for(const campo of campos){if(campo.closest('#v-conta')||campo.id==='perfil-nome')continue;campo.spellcheck=mesaPreferencias.ortografia;campo.lang='pt-BR';}
}
function mesaAplicarPreferencias(salvar=false){
 document.body.dataset.mesaFonte=mesaPreferencias.fonte;
 $('opcoes-ortografia').checked=mesaPreferencias.ortografia;$('opcoes-fonte').value=mesaPreferencias.fonte;
 mesaAplicarOrtografia();
 if(salvar){try{localStorage.setItem('mesa-preferencias-v1',JSON.stringify(mesaPreferencias));}catch{}$('opcoes-status').textContent='Preferências atualizadas neste navegador.';}
}
$('opcoes-ortografia').onchange=()=>{mesaPreferencias.ortografia=$('opcoes-ortografia').checked;mesaAplicarPreferencias(true);};
$('opcoes-fonte').onchange=()=>{mesaPreferencias.fonte=$('opcoes-fonte').value;mesaAplicarPreferencias(true);};
$('opcoes-restaurar').onclick=()=>{mesaPreferencias.ortografia=true;mesaPreferencias.fonte='padrao';mesaAplicarPreferencias(true);};
document.addEventListener('focusin',e=>{if(e.target instanceof Element)mesaAplicarOrtografia(e.target);});
mesaAplicarPreferencias();
// Comunidade: o nome social é sempre o apelido, sem @.
let amigosVersao=0;
function amigosLimpar(){
 amigosVersao++;
 for(const id of ['amigos-resultados','amigos-recebidas','amigos-enviadas','amigos-lista','amigos-bloqueados'])$(id).replaceChildren();
 $('amigos-termo').value='';$('amigos-status').textContent='';
}
let denunciaAlvo=null;
function abrirDenuncia(apelido,mensagemId=null){
 denunciaAlvo={apelido,mensagemId};$('mesa-denuncia-form').reset();
 $('mesa-denuncia-alvo').textContent='Denunciar '+apelido+(mensagemId?' — mensagem recebida':'');
 $('mesa-denuncia-status').textContent='';$('mesa-denuncia-dialog').showModal();
}
$('mesa-denuncia-cancelar').onclick=()=>$('mesa-denuncia-dialog').close();
$('mesa-denuncia-dialog').addEventListener('close',()=>{denunciaAlvo=null;$('mesa-denuncia-form').reset();});
$('mesa-denuncia-form').onsubmit=async ev=>{
 ev.preventDefault();if(!denunciaAlvo)return;
 const b=ev.currentTarget.querySelector('button[type="submit"]');b.disabled=true;
 try{
 const r=await api('/api/comunidade/denuncias','POST',{...denunciaAlvo,motivo:$('mesa-denuncia-motivo').value,detalhes:$('mesa-denuncia-detalhes').value.trim()});
 $('mesa-denuncia-dialog').close();aviso(r.repetida?'Esta denúncia já foi registrada.':'Denúncia encaminhada à moderação.',true);
 }catch(e){$('mesa-denuncia-status').textContent=e.message;}finally{b.disabled=false;}
};
function amigoLinha(alvo,apelido,acoes){
 const linha=el('div','','mesa-amigo-linha');linha.append(el('strong',apelido));
 const botoes=el('div','','mesa-amigo-acoes');
 for(const [texto,acao] of acoes){const b=el('button',texto);b.type='button';b.onclick=async()=>{
 if(['bloquear','remover'].includes(acao)&&!confirm(texto+' '+apelido+'?'))return;
 b.disabled=true;
 try{await api('/api/comunidade/amizade','POST',{apelido,acao});await carregarAmigos();notificacoesAtualizar(true);$('amigos-resultados').replaceChildren();$('amigos-status').textContent='Operação concluída.';}catch(e){$('amigos-status').textContent=e.message;}finally{b.disabled=false;}
 };botoes.append(b);}
 const denunciar=el('button','Denunciar');denunciar.type='button';denunciar.onclick=()=>abrirDenuncia(apelido);botoes.append(denunciar);
 linha.append(botoes);alvo.append(linha);
}
async function carregarAmigos(){
 const versao=++amigosVersao;
 try{
 const [amigos,bloqueados]=await Promise.all([api('/api/comunidade/amigos'),api('/api/comunidade/bloqueados')]);
 if(versao!==amigosVersao||mesaTelaVisivel!=='amigos'||!eu.logado)return;
 const grupos={'amigos-recebidas':amigos.filter(a=>a.estado==='pendente'&&!a.enviada),'amigos-enviadas':amigos.filter(a=>a.estado==='pendente'&&a.enviada),'amigos-lista':amigos.filter(a=>a.estado==='aceita'),'amigos-bloqueados':bloqueados};
 for(const [id,lista] of Object.entries(grupos)){
 const alvo=$(id);alvo.replaceChildren();
 if(!lista.length)alvo.append(el('p','Nenhum registro.','suave'));
 for(const a of lista){
 const acoes=id==='amigos-recebidas'?[['Aceitar','aceitar'],['Recusar','remover'],['Bloquear','bloquear']]:id==='amigos-enviadas'?[['Cancelar','remover']]:id==='amigos-lista'?[['Remover','remover'],['Bloquear','bloquear']]:[['Desbloquear','desbloquear']];
 amigoLinha(alvo,a.apelido,acoes);
 }}
 }catch(e){if(versao===amigosVersao)$('amigos-status').textContent=e.message;}
}
$('amigos-atualizar').onclick=carregarAmigos;
$('amigos-busca').onsubmit=async ev=>{
 ev.preventDefault();const b=ev.currentTarget.querySelector('button');b.disabled=true;
 const versao=amigosVersao,alvo=$('amigos-resultados');alvo.replaceChildren();
 try{const lista=await api('/api/comunidade/buscar?apelido='+encodeURIComponent($('amigos-termo').value.trim()));
 if(versao!==amigosVersao||mesaTelaVisivel!=='amigos')return;
 if(!lista.length)alvo.append(el('p','Nenhum jogador encontrado.','suave'));
 for(const a of lista)amigoLinha(alvo,a.apelido,[['Adicionar','solicitar'],['Bloquear','bloquear']]);
 }catch(e){if(versao===amigosVersao)$('amigos-status').textContent=e.message;}finally{b.disabled=false;}
};
let compartilhadasVersao=0;
function limparCompartilhadas(){
 compartilhadasVersao++;
 for(const id of ['compartilhar-personagem','compartilhar-amigo','fichas-enviadas','fichas-recebidas'])$(id).replaceChildren();
 $('fichas-compartilhadas-status').textContent='';
}
async function carregarCompartilhadas(){
 const v=++compartilhadasVersao;
 try{
 const [fichas,amigos,proprias]=await Promise.all([api('/api/comunidade/fichas'),api('/api/comunidade/amigos'),api('/api/personagens')]);
 if(v!==compartilhadasVersao||mesaTelaVisivel!=='compartilhadas'||!eu.logado)return;
 const ps=$('compartilhar-personagem'),as=$('compartilhar-amigo');
 ps.replaceChildren(new Option('Selecione um personagem',''));as.replaceChildren(new Option('Selecione um amigo',''));
 for(const f of proprias)ps.append(new Option(f.nome,String(f.id)));
 for(const a of amigos.filter(a=>a.estado==='aceita'))as.append(new Option(a.apelido,a.apelido));
 const env=$('fichas-enviadas'),rec=$('fichas-recebidas');env.replaceChildren();rec.replaceChildren();
 if(!fichas.enviadas.length)env.append(el('p','Nenhuma ficha compartilhada.','suave'));
 if(!fichas.recebidas.length)rec.append(el('p','Nenhuma ficha recebida.','suave'));
 for(const f of fichas.enviadas){
 const linha=el('div','','mesa-amigo-linha');linha.append(el('strong',f.personagem+' · '+f.apelido));
 const b=el('button','Revogar acesso');b.type='button';b.onclick=async()=>{
 if(!confirm('Revogar acesso a esta ficha?'))return;
 b.disabled=true;
 try{await api('/api/comunidade/fichas','POST',{id:f.id,apelido:f.apelido,acao:'revogar'});await carregarCompartilhadas();}catch(e){$('fichas-compartilhadas-status').textContent=e.message;}finally{b.disabled=false;}
 };linha.append(b);env.append(linha);}
 for(const f of fichas.recebidas){
 const art=el('article','','folha');art.append(el('h3',f.personagem),el('p','Compartilhada por '+f.apelido+' · Somente visualização','suave'));
 for(const [k,n] of [['classe','Classe'],['raca','Raça'],['nivel','Nível'],['cenario','Cenário'],['especialidade','Especialidade']]){
 const valor=f.ficha?.[k];if(typeof valor==='string'||typeof valor==='number')art.append(el('p',n+': '+valor));
 }rec.append(art);}
 if(fichas.recebidas.length){await api('/api/comunidade/fichas/vistas','POST',{ids:fichas.recebidas.map(f=>String(f.id))});notificacoesAtualizar(true);}
 }catch(e){if(v===compartilhadasVersao)$('fichas-compartilhadas-status').textContent=e.message;}
}
$('fichas-compartilhadas-atualizar').onclick=carregarCompartilhadas;
$('compartilhar-ficha-form').onsubmit=async ev=>{
 ev.preventDefault();const b=ev.currentTarget.querySelector('button');b.disabled=true;
 try{await api('/api/comunidade/fichas','POST',{id:$('compartilhar-personagem').value,apelido:$('compartilhar-amigo').value,acao:'compartilhar'});await carregarCompartilhadas();$('fichas-compartilhadas-status').textContent='Ficha compartilhada para visualização.';}catch(e){$('fichas-compartilhadas-status').textContent=e.message;}finally{b.disabled=false;}
};
// Conversas privadas: consultas periódicas somente com a aba ativa.
let msgDestino='',msgVersao=0,msgTimer=null,msgOcupado=false,msgHistorico=[],msgMais=false,msgPendente=null;
function limparMensagens(){
 clearInterval(msgTimer);msgTimer=null;msgVersao++;msgDestino='';msgHistorico=[];msgMais=false;msgPendente=null;msgOcupado=false;
 $('mensagens-amigos').replaceChildren();$('mensagens-historico').replaceChildren();$('mensagens-texto').value='';
 $('mensagens-destino').textContent='Escolha um amigo';$('mensagens-form').hidden=true;$('mensagens-antigas').hidden=true;$('mensagens-status').textContent='';
}
function pintarMensagens(rolar=false){
 const h=$('mensagens-historico'),altura=h.scrollHeight,pos=h.scrollTop;
 h.replaceChildren();
 if(!msgHistorico.length)h.append(el('p','Nenhuma mensagem ainda.','suave'));
 for(const m of msgHistorico){
 const linha=el('article','','mesa-chat-bolha'+(m.minha?' minha':''));
 linha.append(el('strong',m.minha?'Você':msgDestino),el('p',m.texto),el('small',new Date(m.criado_em).toLocaleString('pt-BR')));if(!m.minha){const destino=msgDestino,b=el('button','Denunciar mensagem','link');b.type='button';b.onclick=()=>abrirDenuncia(destino,m.id);linha.append(b);}h.append(linha);
 }
 if(rolar)h.scrollTop=h.scrollHeight;else h.scrollTop=pos+Math.max(0,h.scrollHeight-altura);
 $('mensagens-antigas').hidden=!msgMais;
}
async function atualizarConversas(){
 const v=msgVersao;
 const lista=await api('/api/comunidade/conversas');
 if(v!==msgVersao||mesaTelaVisivel!=='mensagens'||!eu.logado)return;
 const alvo=$('mensagens-amigos');alvo.replaceChildren();
 if(!lista.length)alvo.append(el('p','Adicione amigos para começar uma conversa.','suave'));
 for(const a of lista){
 const b=el('button',a.apelido+(a.nao_lidas?' · '+a.nao_lidas+' não lidas':''),'mesa-chat-amigo');b.type='button';b.setAttribute('aria-pressed',String(msgDestino===a.apelido));
 b.onclick=()=>abrirConversa(a.apelido);alvo.append(b);}
 if(msgDestino&&!lista.some(a=>a.apelido===msgDestino)){
 msgVersao++;msgDestino='';msgHistorico=[];msgPendente=null;$('mensagens-historico').replaceChildren();$('mensagens-form').hidden=true;$('mensagens-antigas').hidden=true;$('mensagens-destino').textContent='Conversa indisponível';$('mensagens-texto').value='';
 }
}
async function buscarMensagens(antigas=false){
 if(!msgDestino||msgOcupado)return;
 const v=msgVersao,destino=msgDestino,antes=antigas?msgHistorico[0]?.id:null;
 if(antigas&&!antes)return;
 msgOcupado=true;
 try{
 const d=await api('/api/comunidade/mensagens?apelido='+encodeURIComponent(destino)+(antes?'&antes='+encodeURIComponent(antes):''));
 if(v!==msgVersao||destino!==msgDestino||mesaTelaVisivel!=='mensagens')return;
 const anteriores=msgHistorico.length;
 const map=new Map([...msgHistorico,...d.mensagens].map(m=>[m.id,m]));
 msgHistorico=[...map.values()].sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:BigInt(a.id)>BigInt(b.id)?1:0);
 if(antigas||!anteriores)msgMais=d.mais;
 if(msgHistorico.length!==anteriores||!anteriores)pintarMensagens(!antigas);
 const ultima=d.mensagens.filter(m=>!m.minha).at(-1);
 if(ultima&&!document.hidden&&!antigas){await api('/api/comunidade/mensagens/lidas','POST',{apelido:destino,ate:ultima.id});notificacoesAtualizar();}
 }catch(e){if(v===msgVersao)$('mensagens-status').textContent=e.message;}finally{if(v===msgVersao)msgOcupado=false;}
}
async function abrirConversa(apelido){
 if(msgDestino===apelido)return;
 if($('mensagens-texto').value.trim()&&!confirm('Trocar de conversa e descartar o texto não enviado?'))return;
 msgVersao++;msgDestino=apelido;msgHistorico=[];msgMais=false;msgOcupado=false;msgPendente=null;
 $('mensagens-texto').value='';$('mensagens-status').textContent='';$('mensagens-destino').textContent=apelido;$('mensagens-form').hidden=false;pintarMensagens();
 await buscarMensagens();await atualizarConversas().catch(()=>{});
}
async function atualizarMensagens(){
 if(mesaTelaVisivel!=='mensagens'||document.hidden||!navigator.onLine)return;
 try{await atualizarConversas();await buscarMensagens();}catch(e){if(mesaTelaVisivel==='mensagens')$('mensagens-status').textContent=e.message;}
}
function iniciarMensagens(){
 if(!msgTimer)msgTimer=setInterval(atualizarMensagens,12000);
 atualizarMensagens();
}
$('mensagens-atualizar').onclick=atualizarMensagens;
$('mensagens-antigas').onclick=()=>buscarMensagens(true);
$('mensagens-form').onsubmit=async ev=>{
 ev.preventDefault();if(!msgDestino)return;
 const texto=$('mensagens-texto').value.trim(),destino=msgDestino,v=msgVersao,b=ev.currentTarget.querySelector('button');
 if(!texto)return;
 if(!msgPendente||msgPendente.texto!==texto||msgPendente.apelido!==destino)msgPendente={apelido:destino,texto,chave:crypto.randomUUID()};
 const envio=msgPendente;b.disabled=true;
 try{
 await api('/api/comunidade/mensagens','POST',envio);
 if(v!==msgVersao)return;
 if($('mensagens-texto').value.trim()===texto)$('mensagens-texto').value='';
 msgPendente=null;$('mensagens-status').textContent='Mensagem enviada.';await buscarMensagens();await atualizarConversas();
 }catch(e){if(v===msgVersao)$('mensagens-status').textContent=e.message;}finally{b.disabled=false;}
};
// Campanhas compartilhadas e biblioteca audiovisual local.
let campanhaId=null,campanhaVersao=0,campanhaTimer=null,campanhaCursor=null,campanhaCarregando=false,campanhaMestre=false,campanhaEncerrada=false,campanhaPendente=null,cinemaTimer=null,cinemaAudio=null,cinemaNos=[];
const campanhaBase='/api/comunidade/campanhas';
const mesaXPPendente=new Map();
const campanhaStatus=t=>{$('campanha-status').textContent=t;};
function fecharCinema(){clearTimeout(cinemaTimer);$('campanha-cinema').hidden=true;$('campanha-cinema-arte').replaceChildren();for(const n of cinemaNos){try{n.stop();}catch{}}cinemaNos=[];}
$('campanha-cinema-fechar').onclick=fecharCinema;
for(const id of ['campanha-visual','solo-cinema-visual'])$(id).onchange=()=>{if(!$(id).checked)fecharCinema();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('campanha-cinema').hidden)fecharCinema();});
for(const id of ['campanha-som','solo-cinema-som'])$(id).onchange=async()=>{if(!$(id).checked){fecharCinema();return;}try{cinemaAudio=cinemaAudio||new(window.AudioContext||window.webkitAudioContext)();await cinemaAudio.resume();aviso('Sons cinematográficos ativados.',true);}catch{$(id).checked=false;aviso('Não foi possível ativar o áudio.');}};
function cinemaSolo(texto){if(typeof texto!=='string')return;const d=detectarCinema(texto);if(d.efeito!=='nenhum')exibirCinema({...d,texto});}
function somCinema(efeito){
 if(!$(mesaTelaVisivel==='solo'?'solo-cinema-som':'campanha-som').checked||!cinemaAudio||cinemaAudio.state!=='running')return;
 const ctx=cinemaAudio,t=ctx.currentTime;
 const dur=efeito==='dragao_fogo'?2.8:efeito==='dragao'?1.7:efeito==='tempestade'?2.2:1.3;
 const gain=ctx.createGain();gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.13,t+.09);gain.gain.exponentialRampToValueAtTime(.001,t+dur);gain.connect(ctx.destination);
 const buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*dur),ctx.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<arr.length;i++)arr[i]=Math.random()*2-1;
 const noise=ctx.createBufferSource();noise.buffer=buf;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(efeito==='dragao_fogo'?1500:efeito==='magia'?2400:240,t);filter.frequency.exponentialRampToValueAtTime(efeito==='dragao_fogo'?300:80,t+dur);noise.connect(filter);filter.connect(gain);noise.start(t);cinemaNos.push(noise);
 const osc=ctx.createOscillator();osc.type=efeito==='magia'?'sine':'sawtooth';osc.frequency.setValueAtTime(efeito==='magia'?280:95,t);osc.frequency.exponentialRampToValueAtTime(efeito==='magia'?880:35,t+dur);const g=ctx.createGain();g.gain.value=.15;osc.connect(g);g.connect(gain);osc.start(t);osc.stop(t+dur);cinemaNos.push(osc);
}
function arteDragao(cor,fogo){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 600 300');svg.setAttribute('class','mesa-dragao');
 const paleta={vermelho:'#bd4936',verde:'#4d9862',azul:'#477bc4',preto:'#45465b',branco:'#e6e6e1',dourado:'#cba652'},base=paleta[cor]||paleta.vermelho;
 function path(d,fill,classe){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill',fill);p.setAttribute('stroke','#1d242a');p.setAttribute('stroke-width','3');if(classe)p.setAttribute('class',classe);svg.append(p);}
 path('M280 154 Q185 38 85 30 L116 90 68 96 150 136 124 169 270 193Z',base,'mesa-asa');
 path('M310 160 Q392 28 491 26 L462 86 512 105 432 143 455 167 320 194Z',base,'mesa-asa direita');
 path('M220 202 Q147 217 74 178 Q34 164 24 202 Q74 240 144 241 L260 229Z',base);
 path('M160 213 Q185 151 272 151 Q324 144 346 111 L361 69 392 61 420 83 447 99 430 118 389 124 Q380 185 341 215 L350 263 318 261 296 219 249 225 228 262 194 260 204 223Z',base);
 path('M354 75 L349 39 376 63 391 39 398 66Z','#e3c68e');
 path('M402 93 L418 96 408 102Z','#ffe984');
 path('M390 120 L429 118 410 129Z','#25252b');
 if(fogo){path('M433 118 Q477 82 526 122 L591 112 548 145 588 163 Q503 180 433 130Z','#ea7332','mesa-fogo');path('M439 123 Q478 109 545 139 Q501 154 439 129Z','#ffe090','mesa-fogo nucleo');}
 return svg;
}
function exibirCinema(e){
 if(e.efeito==='nenhum'||document.hidden)return;
 fecharCinema();somCinema(e.efeito);
 if(!$(mesaTelaVisivel==='solo'?'solo-cinema-visual':'campanha-visual').checked){cinemaTimer=setTimeout(fecharCinema,4200);return;}
 const painel=$('campanha-cinema'),arte=$('campanha-cinema-arte');
 painel.className='mesa-cinema efeito-'+e.efeito+((mesaMovimentoReduzido()||acessibilidadeMovimentoReduzido())?' sem-movimento':'');
 if(e.efeito.startsWith('dragao'))arte.append(arteDragao(e.cor,e.efeito==='dragao_fogo'));
 else {const simbolo=el('div',{trovao:'ϟ',explosao:'✹',magia:'✧',tempestade:'☁'}[e.efeito]||'✦','mesa-cinema-simbolo');arte.append(simbolo);}
 $('campanha-cinema-texto').textContent=e.texto.slice(0,300);painel.hidden=false;cinemaTimer=setTimeout(fecharCinema,4200);
}
function detectarCinema(texto){
 const t=texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const dragao=/\bdrag(?:ao|oes)\b/.test(t),fogo=/\b(cospe|cuspiu|cuspindo|sopro|sopra|lanca)\b.{0,45}\b(fogo|chamas)\b/.test(t);
 let efeito=dragao?(fogo?'dragao_fogo':'dragao'):/\btrovao\b/.test(t)?'trovao':/\bexplosao\b/.test(t)?'explosao':/\btempestade\b/.test(t)?'tempestade':/\b(magia|feitico)\b/.test(t)?'magia':'nenhum';
 const cor=[['vermelh','vermelho'],['verd','verde'],['azul','azul'],['negr|pret','preto'],['branc','branco'],['dourad','dourado']].find(([k])=>new RegExp(k).test(t))?.[1]||'vermelho';
 return {efeito,cor};
}
function limparCampanha(){
 clearInterval(campanhaTimer);campanhaTimer=null;campanhaVersao++;campanhaId=null;campanhaCursor=null;campanhaCarregando=false;campanhaPendente=null;campanhaPersonagemAtual='';$('campanha-personagem').replaceChildren(new Option('Sem personagem vinculado',''));
 fecharCinema();$('campanha-historico').replaceChildren();$('campanha-membros').replaceChildren();$('campanha-amigo').replaceChildren();$('campanhas-lista').replaceChildren();$('campanha-texto').value='';$('campanha-sala').hidden=true;$('campanhas-lobby').hidden=false;campanhaStatus('');
}
async function carregarCampanhas(){
 const v=campanhaVersao;
 try{const lista=await api(campanhaBase);if(v!==campanhaVersao||mesaTelaVisivel!=='campanhas')return;
 const alvo=$('campanhas-lista');alvo.replaceChildren();
 if(!lista.length)alvo.append(el('p','Nenhuma mesa ou convite por enquanto.','suave'));
 for(const s of lista){const card=el('article','','mesa-amigo-linha');const info=el('div');info.append(el('strong',s.titulo),el('p','Mestre: '+s.mestre+(s.encerrada?' · Encerrada':s.estado==='convidado'?' · Convite pendente':''),'suave'));card.append(info);
 const b=el('button',s.estado==='convidado'?'Aceitar convite':'Abrir mesa');b.type='button';b.disabled=s.encerrada&&s.estado==='convidado';b.onclick=async()=>{try{if(s.estado==='convidado')await api(campanhaBase+'/'+s.id+'/membros','POST',{acao:'aceitar'});await abrirCampanha(s.id);notificacoesAtualizar(true);}catch(e){campanhaStatus(e.message);}};card.append(b);
 if(s.estado==='convidado'){const rec=el('button','Recusar');rec.type='button';rec.onclick=async()=>{try{await api(campanhaBase+'/'+s.id+'/membros','POST',{acao:'sair'});await carregarCampanhas();notificacoesAtualizar(true);}catch(e){campanhaStatus(e.message);}};card.append(rec);}
 alvo.append(card);}
 }catch(e){if(v===campanhaVersao)campanhaStatus(e.message);}
}
let campanhaPersonagemAtual='',campanhaFichas=[];
function pintarPraticaCampanha(){const sel=$('campanha-pratica'),ant=sel.value,f=campanhaFichas.find(x=>String(x.id)===String(campanhaPersonagemAtual));sel.replaceChildren(new Option('Sem prática',''));const nivel=f?.progressao?.nivel??Math.min(20,1+Math.floor(Math.sqrt((f?.progressao?.total||0)/100)));for(const h of f?.habilidadesDisponiveis||[]){const o=new Option(h.nome+' · '+dominioHabilidade(h).grau,h.id);o.disabled=nivel<h.nivelMin;sel.add(o);}if([...sel.options].some(o=>o.value===ant&&!o.disabled))sel.value=ant;$('campanha-pratica-campo').hidden=campanhaMestre||$('campanha-tipo').value!=='acao'||!f;}
async function carregarPersonagensCampanha(){
 const v=campanhaVersao,lista=await api('/api/personagens');
 if(v!==campanhaVersao)return;
 const sel=$('campanha-personagem');sel.replaceChildren(new Option('Sem personagem vinculado',''));
 for(const f of lista)sel.append(new Option(f.nome,String(f.id)));
 sel.value=campanhaPersonagemAtual;campanhaFichas=lista;pintarPraticaCampanha();
}
$('campanha-personagem-form').onsubmit=async ev=>{
 ev.preventDefault();if(!campanhaId)return;const v=campanhaVersao,b=ev.currentTarget.querySelector('button');b.disabled=true;
 try{await api(campanhaBase+'/'+campanhaId+'/personagem','POST',{personagem:$('campanha-personagem').value||null});if(v!==campanhaVersao)return;await atualizarCampanha();await carregarPersonagensCampanha();campanhaStatus('Personagem vinculado.');}catch(e){if(v===campanhaVersao)campanhaStatus(e.message);}finally{b.disabled=false;}
};
async function preencherConvites(){
 const v=campanhaVersao;const lista=await api('/api/comunidade/amigos');if(v!==campanhaVersao)return;
 const sel=$('campanha-amigo');sel.replaceChildren(new Option('Escolha um amigo',''));for(const a of lista.filter(a=>a.estado==='aceita'))sel.append(new Option(a.apelido,a.apelido));
}
function atualizarTipoCampanha(){$('campanha-efeitos').hidden=!campanhaMestre||$('campanha-tipo').value!=='narracao';pintarPraticaCampanha();}
$('campanha-tipo').onchange=atualizarTipoCampanha;
async function abrirCampanha(id){
 campanhaVersao++;campanhaId=String(id);campanhaCursor=null;campanhaPendente=null;campanhaCarregando=false;$('campanha-historico').replaceChildren();$('campanha-texto').value='';$('campanhas-lobby').hidden=true;$('campanha-sala').hidden=false;
 await atualizarCampanha();if(campanhaId===String(id)){await carregarPersonagensCampanha().catch(e=>campanhaStatus(e.message));if(campanhaMestre&&!campanhaEncerrada)await preencherConvites().catch(e=>campanhaStatus(e.message));}
}
async function atualizarCampanha(){
 if(!campanhaId||campanhaCarregando||document.hidden||!navigator.onLine)return;
 const v=campanhaVersao,id=campanhaId,cursor=campanhaCursor;
 campanhaCarregando=true;
 try{
 const d=await api(campanhaBase+'/'+id+(cursor?'?depois='+cursor:''));
 if(v!==campanhaVersao||mesaTelaVisivel!=='campanhas')return;
 campanhaMestre=d.minha;campanhaEncerrada=d.encerrada;
 $('campanha-sala-titulo').textContent=d.titulo;$('campanha-sala-desc').textContent=d.descricao;
 $('campanha-convidar').hidden=!d.minha||d.encerrada;$('campanha-evento').hidden=d.encerrada;$('campanha-rolar').disabled=d.encerrada;
 $('campanha-sair').textContent=d.minha?'Encerrar campanha':'Sair da campanha';$('campanha-sair').disabled=d.minha&&d.encerrada;
 $('campanha-narracao').disabled=!d.minha;if(!d.minha&&$('campanha-tipo').value==='narracao')$('campanha-tipo').value='acao';atualizarTipoCampanha();
 const membros=$('campanha-membros');membros.replaceChildren();
 $('campanha-personagem-form').hidden=d.encerrada;campanhaPersonagemAtual=d.membros.find(m=>m.eu)?.personagem_id||'';pintarPraticaCampanha();
 for(const m of d.membros){const linha=el('div','','mesa-amigo-linha');linha.append(el('strong',m.apelido+(m.personagem?' · '+m.personagem:'')+(m.mestre?' · Mestre':m.estado==='convidado'?' · Convidado':'')));
 if(d.minha&&!m.eu&&!d.encerrada&&m.estado==='ativo'&&m.personagem){const xp=el('button','Conceder XP');xp.type='button';xp.onclick=async()=>{const id=campanhaId,entrada=prompt('XP para '+m.personagem+' (1 a 1000):');if(entrada===null)return;const quantidade=Number(entrada);if(!Number.isInteger(quantidade)||quantidade<1||quantidade>1000){campanhaStatus('Informe um XP inteiro de 1 a 1000.');return;}const a=id+':'+m.apelido+':'+quantidade;const chave=mesaXPPendente.get(a)||crypto.randomUUID();mesaXPPendente.set(a,chave);xp.disabled=true;try{const r=await api(campanhaBase+'/'+id+'/xp','POST',{apelido:m.apelido,quantidade,chave});mesaXPPendente.delete(a);campanhaStatus(r.duplicado?'Recompensa já registrada.':r.ganho+' XP concedido.');}catch(e){campanhaStatus(e.message);}finally{xp.disabled=false;}};linha.append(xp);}
 if(d.minha&&!m.eu&&!d.encerrada){const b=el('button','Remover');b.type='button';b.onclick=()=>acaoMembroCampanha('remover',m.apelido);linha.append(b);}membros.append(linha);}
 const h=$('campanha-historico'),nomes={narracao:'Narração',acao:'Ação',fala:'Fala',dado:'Dado'};
 let cinema=null;
 for(const e of d.eventos){const item=el('article','','mesa-chat-bolha'+(e.tipo==='narracao'?' narracao':''));item.append(el('strong',e.apelido+(e.personagem_nome?' · '+e.personagem_nome:'')+' · '+nomes[e.tipo]),el('p',e.texto),el('small',new Date(e.criado_em).toLocaleTimeString('pt-BR')));if(e.pratica){const status=el('p','Prática: '+e.pratica.nome+' · '+({pendente:'aguardando mestre',aprovada:'aprovada',recusada:'recusada',limite:'limite atingido'}[e.pratica.status]||e.pratica.status),'suave');item.append(status);if(d.minha&&!d.encerrada&&e.pratica.status==='pendente'){const controles=el('div','','item-ficha-linha');for(const aprovar of [true,false]){const b=el('button',aprovar?'Aprovar +5':'Recusar');b.type='button';b.onclick=async()=>{for(const x of controles.querySelectorAll('button'))x.disabled=true;try{const r=await api(campanhaBase+'/'+id+'/pratica','POST',{evento:e.id,aprovar});status.textContent='Prática: '+e.pratica.nome+' · '+r.status;controles.remove();campanhaStatus(r.ganho?'Proficiência concedida.':'Prática avaliada.');await atualizarCampanha();}catch(err){campanhaStatus(err.message);for(const x of controles.querySelectorAll('button'))x.disabled=false;}};controles.append(b);}item.append(controles);}}h.append(item);campanhaCursor=e.id;
 if(cursor&&e.efeito!=='nenhum')cinema=e;}
 // Uma sala vazia não deve reproduzir efeitos históricos ao entrar.
 if(!campanhaCursor)campanhaCursor='0';
 if(cinema)exibirCinema(cinema);
 if(d.eventos.length){while(h.children.length>300)h.firstChild.remove();h.scrollTop=h.scrollHeight;}
 }catch(e){if(v===campanhaVersao){campanhaStatus(e.message);if([403,404].includes(e.status)){limparCampanha();campanhaStatus(e.message);iniciarCampanhas();}}}
 finally{if(v===campanhaVersao)campanhaCarregando=false;}
}
async function acaoMembroCampanha(acao,apelido){
 if(!campanhaId)return;if(['sair','remover','encerrar'].includes(acao)&&!confirm('Confirma '+acao+'?'))return;
 try{await api(campanhaBase+'/'+campanhaId+'/membros','POST',{acao,apelido});if(acao==='sair'||acao==='encerrar'){limparCampanha();iniciarCampanhas();}else await atualizarCampanha();campanhaStatus('Operação concluída.');}catch(e){campanhaStatus(e.message);}
}
async function enviarEventoCampanha(d){
 if(!campanhaId||campanhaEncerrada)return;
 const id=campanhaId,v=campanhaVersao,assinatura=JSON.stringify(d);
 if(!campanhaPendente||campanhaPendente.assinatura!==assinatura)campanhaPendente={assinatura,corpo:{...d,chave:crypto.randomUUID()}};
 try{await api(campanhaBase+'/'+id+'/eventos','POST',campanhaPendente.corpo);if(v!==campanhaVersao)return;campanhaPendente=null;if(d.tipo!=='dado'&&$('campanha-texto').value.trim()===d.texto)$('campanha-texto').value='';if(d.tipo==='dado')acessibilidadeSomDado();await atualizarCampanha();}catch(e){if(v===campanhaVersao)campanhaStatus(e.message);}
}
$('campanhas-criar').onsubmit=async ev=>{ev.preventDefault();const b=ev.currentTarget.querySelector('button');b.disabled=true;try{const s=await api(campanhaBase,'POST',{titulo:$('campanha-nome').value.trim(),descricao:$('campanha-desc').value.trim()});ev.target.reset();await abrirCampanha(s.id);}catch(e){campanhaStatus(e.message);}finally{b.disabled=false;}};
$('campanha-convidar').onsubmit=ev=>{ev.preventDefault();acaoMembroCampanha('convidar',$('campanha-amigo').value);};
$('campanha-sair').onclick=()=>acaoMembroCampanha(campanhaMestre?'encerrar':'sair');
$('campanha-voltar').onclick=()=>{limparCampanha();iniciarCampanhas();};
$('campanhas-atualizar').onclick=carregarCampanhas;
$('campanha-evento').onsubmit=async ev=>{ev.preventDefault();const b=ev.currentTarget.querySelector('button');b.disabled=true;const tipo=$('campanha-tipo').value,texto=$('campanha-texto').value.trim(),det=detectarCinema(texto),efeito=tipo==='narracao'?($('campanha-efeito').value==='auto'?det.efeito:$('campanha-efeito').value):'nenhum',cor=$('campanha-cor').value==='auto'?det.cor:$('campanha-cor').value;try{await enviarEventoCampanha({tipo,texto,efeito,cor,habilidadeId:tipo==='acao'&&!campanhaMestre?$('campanha-pratica').value||null:null});}finally{b.disabled=false;}};
$('campanha-rolar').onclick=async()=>{const b=$('campanha-rolar');b.disabled=true;try{await enviarEventoCampanha({tipo:'dado',faces:Number($('campanha-dado').value)});}finally{b.disabled=campanhaEncerrada;}};
function iniciarCampanhas(){if(!campanhaTimer)campanhaTimer=setInterval(()=>{if(mesaTelaVisivel!=='campanhas'||document.hidden||!navigator.onLine)return;if(campanhaId)atualizarCampanha();else carregarCampanhas();},5000);if(!campanhaId)carregarCampanhas();}
// ---- Conta e recuperação de acesso ----
const formulariosConta = ['f-login','f-cadastro','f-recuperar','f-redefinir'];
// Feedback de formato local, sem enviar o endereço enquanto a pessoa digita.
for(const id of ['l-email','c-email','r-email']){
 const campo=$(id),status=el('p','','mesa-email-feedback');
 status.id=id+'-feedback';status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 campo.maxLength=254;campo.setAttribute('aria-describedby',status.id);
 campo.after(status);
 let timer;
 function validar(exibir){
  const valor=campo.value.trim();
  const valido=valor!==''&&campo.validity.typeMismatch===false&&
   (typeof window.mesaEmailValido==='function'?window.mesaEmailValido(valor):/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor));
  const mensagem=valor&&!valido?'Informe um endereço completo, como nome@exemplo.com.':'';
  campo.setCustomValidity(mensagem);
  campo.setAttribute('aria-invalid',String(Boolean(mensagem)));
  if(exibir){
   status.textContent=valor?(valido?'Formato de e-mail válido.':mensagem):'';
   status.classList.toggle('email-erro',Boolean(mensagem));
   status.classList.toggle('email-ok',valido);
  }
 }
 campo.addEventListener('input',()=>{validar(false);clearTimeout(timer);timer=setTimeout(()=>validar(true),450);});
 campo.addEventListener('blur',()=>{clearTimeout(timer);validar(true);});
 campo.addEventListener('change',()=>validar(true));
 campo.addEventListener('invalid',()=>validar(true));
 campo.form?.addEventListener('submit',ev=>{validar(true);if(!campo.checkValidity()){ev.preventDefault();ev.stopImmediatePropagation();campo.reportValidity();}},{capture:true});
}

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
$('voltar-inicio').onclick = () => { limparTokenDaUrl(); abrirFormularioConta('f-login'); navegarMesa('gerador'); };
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
function mesaSaudacao(){
 const t=$('mesa-inicio-titulo');if(!t)return;
 const frases={masculino:'Bem-vindo, aventureiro!',feminino:'Bem-vinda, aventureira!',nao_binario:'Boas-vindas, aventureire!',neutro:'Que bom ter você aqui!'};
 const nomes={masculino:'Bem-vindo',feminino:'Bem-vinda',nao_binario:'Boas-vindas',neutro:'Que bom ter você aqui'};
 t.textContent=eu.logado?(eu.nome?((nomes[eu.tratamento]||nomes.neutro)+', '+eu.nome+'!'):(frases[eu.tratamento]||frases.neutro)):'Sua próxima aventura começa aqui.';
}
async function entrar(url, email, senha, tokenBootstrap, manterConectado = false, aceiteTermos = false) {
  try {
    await api(url, 'POST', { email, senha, manterConectado, aceiteTermos, ...(url==='/api/cadastro'?{tratamento:$('c-tratamento').value,nome:$('c-nome').value.trim(),apelido:$('c-apelido').value.trim()}:{}), ...(tokenBootstrap ? { tokenBootstrap } : {}) });
    await atualizarEu(); mostrar('inicio'); aviso('Sua próxima aventura começa agora.', true);
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
 adminTitulo(alvo,conteudo?'Conteúdos e tutorial':'Central de novidades',conteudo?'Gerencie artigos adicionais, exemplos e perguntas frequentes. Os capítulos do tutorial principal ficam disponíveis no aplicativo.':'Publique novidades e avisos visíveis para os jogadores.');
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
 const limpeza=add('section',alvo,'','admin-editor');
 add('h3',limpeza,'Limpeza de avatares pendentes');
 const contador=add('p',limpeza,'Consultando pendências...','suave');
 const refazer=add('button',limpeza,'Tentar limpar até 3 avatares','principal');
 refazer.type='button';
 const retorno=add('p',limpeza,'','suave');
 const consultar=async()=>{
  const dados=await api('/api/admin/manutencao/avatares-pendentes');
  contador.textContent='Arquivos aguardando exclusão: '+dados.pendentes;
  refazer.disabled=!dados.pendentes;
 };
 refazer.onclick=async()=>{
  refazer.disabled=true;retorno.textContent='Verificando arquivos no Storage...';
  try{
   const dados=await api('/api/admin/manutencao/limpar-avatares','POST',{});
   retorno.textContent='Removidos: '+dados.removidos+' · Falhas: '+dados.falhas+'.';
   await consultar();
  }catch(e){retorno.textContent='Não foi possível concluir: '+e.message;refazer.disabled=false;}
 };
 try{await consultar();}catch(e){contador.textContent='Não foi possível consultar as pendências.';refazer.disabled=true;}
 const r=await api('/api/admin/auditoria');
 if(!r.length)add('p',alvo,'Ainda não há ações administrativas registradas.');
 const area=add('div',alvo,'','admin-lista');
 r.forEach(item=>{const art=add('article',area,'','admin-registro');add('strong',art,item.acao);add('p',art,(item.administrador||'Administrador removido')+' · '+new Date(item.criado_em).toLocaleString('pt-BR')+' · '+(item.alvo_tipo||'sistema')+' #'+(item.alvo_id||'—'),'suave');});
}
async function adminExibirModeracao(alvo){
 adminTitulo(alvo,'Moderação da comunidade','Denúncias são analisadas individualmente. Apenas a mensagem explicitamente denunciada é exibida, não a conversa inteira.');
 const lista=await api('/api/admin/denuncias');
 if(!lista.length)add('p',alvo,'Nenhuma denúncia registrada.','suave');
 const rotulos={assedio:'Assédio',ameaca:'Ameaça',spam:'Spam',discriminacao:'Discriminação',outro:'Outro'};
 for(const d of lista){
 const art=add('article',alvo,'','admin-registro');
 add('h3',art,'#'+d.id+' · '+(rotulos[d.motivo]||d.motivo));
 add('p',art,'Denunciado: '+d.denunciado+' · Denunciante: '+d.denunciante+' · Estado: '+d.estado);
 add('p',art,new Date(d.criado_em).toLocaleString('pt-BR'),'suave');
 if(d.detalhes)add('p',art,'Detalhes: '+d.detalhes);
 if(d.mensagem)add('p',art,'Mensagem denunciada: '+d.mensagem,'mesa-denuncia-evidencia');
 if(d.estado==='pendente'){
 for(const estado of ['procedente','improcedente'])botaoAdmin(art,estado==='procedente'?'Considerar procedente':'Considerar improcedente',()=>acaoAdmin(async()=>{
 if(!confirm('Registrar decisão '+estado+'?'))return;
 await api('/api/admin/denuncias/'+d.id,'PATCH',{estado});await carregarResumo();
 },'Decisão registrada.'));
 }
 }
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
  else if(adminSecao==='moderacao')await adminExibirModeracao(alvo);
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


// Solicitação expressa de exclusão: exige senha e frase de confirmação.
$('mesa-exclusao-form').onsubmit=async e=>{
 e.preventDefault();
 const senha=$('mesa-exclusao-senha').value;
 const confirmacao=$('mesa-exclusao-confirmacao').value.trim();
 const status=$('mesa-exclusao-status'),botao=$('mesa-exclusao-botao');
 if(confirmacao!=='EXCLUIR MINHA CONTA'){
  status.textContent='Digite EXCLUIR MINHA CONTA exatamente como indicado.';return;
 }
 if(!eu.logado){status.textContent='Entre na sua conta para concluir esta solicitação.';return;}
 if(eu.papel==='admin'){status.textContent='A exclusão de conta administrativa exige contato com o suporte.';return;}
 if(!window.confirm('Esta ação excluirá permanentemente sua conta e os registros vinculados. Deseja continuar?'))return;
 botao.disabled=true;status.textContent='Processando exclusão...';
 try{
  const r=await api('/api/conta/excluir','POST',{senha,confirmacao});
  $('mesa-exclusao-senha').value='';$('mesa-exclusao-confirmacao').value='';
  status.textContent=r.observacao||'Conta excluída.';
  await atualizarEu();
  mostrar('gerador');
  aviso(r.arquivosPendentes?'Conta excluída. Alguns avatares exigem limpeza adicional pelo suporte.':'Sua conta foi excluída.');
 }catch(err){status.textContent=err.message||'Não foi possível excluir sua conta.';}
 finally{botao.disabled=false;}
};

/* Acessibilidade opcional, por conta do navegador e sem microfone. */
const mesaA11y={fonte:false,contraste:false,movimento:false,velocidade:1,token:0,audio:null};
function acessibilidadeAplicar(){
 document.body.classList.toggle('mesa-fonte-grande',mesaA11y.fonte);
 document.body.classList.toggle('mesa-alto-contraste',mesaA11y.contraste);
 document.documentElement.classList.toggle('mesa-movimento-reduzido',mesaA11y.movimento);
 for(const [id,chave] of [['mesa-fonte-grande','fonte'],['mesa-alto-contraste','contraste'],['mesa-reduzir-movimento','movimento']])$(id).checked=mesaA11y[chave];
 $('mesa-velocidade-voz').value=String(mesaA11y.velocidade);
}
function acessibilidadeSalvar(){
 acessibilidadeAplicar();
 try{localStorage.setItem('mesa-a11y-v1',JSON.stringify({fonte:mesaA11y.fonte,contraste:mesaA11y.contraste,movimento:mesaA11y.movimento,velocidade:mesaA11y.velocidade}));}catch{}
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
 if(final)return Promise.resolve(false);
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
 for(const k of ['fonte','contraste','movimento'])mesaA11y[k]=dados[k]===true;
 if([.75,1,1.25].includes(Number(dados.velocidade)))mesaA11y.velocidade=Number(dados.velocidade);
}catch{}
acessibilidadeAplicar();
$('mesa-acessibilidade-abrir').onclick=()=>{
 const p=$('mesa-acessibilidade-painel'),aberto=p.hidden;
 p.hidden=!aberto;$('mesa-acessibilidade-abrir').setAttribute('aria-expanded',String(aberto));
 if(aberto)$('mesa-acessibilidade-fechar').focus();
};
$('mesa-acessibilidade-fechar').onclick=()=>{
 $('mesa-acessibilidade-painel').hidden=true;$('mesa-acessibilidade-abrir').setAttribute('aria-expanded','false');
 $('mesa-acessibilidade-abrir').focus();
};
for(const [id,chave] of [['mesa-fonte-grande','fonte'],['mesa-alto-contraste','contraste'],['mesa-reduzir-movimento','movimento']]){
 $(id).onchange=()=>{mesaA11y[chave]=$(id).checked;acessibilidadeSalvar();};
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

atualizarEu().then(() => {
  if(eu.logado)noticiasMesa();
  if (new URL(location.href).searchParams.has('reset_token')) {
    abrirFormularioConta('f-redefinir'); mostrar('conta');
  } else {
    const pedida=new URL(location.href).searchParams.get('tela');
    const anterior=history.state?.mesaTela || estadoNavegacao.ler('tela');
    mostrar(!eu.logado?(['termos','privacidade'].includes(pedida)?pedida:'conta'):!history.state?.mesaTela&&TELAS.includes(pedida)?pedida:TELAS.includes(anterior)&&anterior!=='conta'?anterior:'inicio');
    if(mesaTelaVisivel==='gerador'&&estadoNavegacao.ler('modo-gerador')==='npc')modoGeradorNPC(true);
  }
}).catch((e) => {
  // Um erro de rede/banco na inicialização não significa que o usuário saiu.
  // Mantemos o contexto visual e pedimos que tente novamente.
  montarNav();
  if (new URL(location.href).searchParams.has('reset_token')) {
    abrirFormularioConta('f-redefinir'); mostrar('conta');
  } else {
    const pedida=new URL(location.href).searchParams.get('tela');
    mostrar(['termos','privacidade'].includes(pedida)?pedida:'conta');
  }
  aviso('Não foi possível verificar a sessão com o servidor agora. Sua conta pode continuar conectada. Atualize a página e tente novamente. Detalhes: '+e.message);
});


// Mantém a barra nativa; altera apenas sua aparência durante a rolagem.
(function mesaBarrasDinamicas(){
 const raiz=document.documentElement;
 const seletor='.topo,.solo-mensagens,.notificacoes-painel,.mesa-acessibilidade-painel';
 const temporizadores=new WeakMap();
 function mostrarBarra(alvo){
  if(alvo===document || alvo===window || alvo===document.body || alvo===raiz)alvo=raiz;
  if(!(alvo instanceof Element)|| (alvo!==raiz&&!alvo.matches(seletor)))return;
  alvo.classList.add('mesa-rolando');
  clearTimeout(temporizadores.get(alvo));
  temporizadores.set(alvo,setTimeout(()=>{alvo.classList.remove('mesa-rolando');temporizadores.delete(alvo);},1000));
 }
 document.addEventListener('scroll',e=>mostrarBarra(e.target),{capture:true,passive:true});
 raiz.classList.add('mesa-scroll-dinamico');
})();
