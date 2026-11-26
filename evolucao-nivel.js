'use strict';
// D&D 2024: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
// Catálogo parcial de nomes públicos das magias de Mago, por círculo; não implementa conjuração.
const magias=[
 ['Alarm','Burning Hands','Charm Person','Color Spray','Comprehend Languages','Detect Magic','Disguise Self','False Life','Feather Fall','Find Familiar','Fog Cloud','Grease','Identify','Jump','Longstrider','Mage Armor','Magic Missile','Shield','Silent Image','Sleep','Thunderwave','Unseen Servant'],
 ['Alter Self','Arcane Lock','Blur','Darkness','Darkvision','Detect Thoughts','Enhance Ability','Enlarge/Reduce','Hold Person','Invisibility','Knock','Levitate','Mirror Image','Misty Step','Scorching Ray','See Invisibility','Shatter','Suggestion','Web'],
 ['Blink','Counterspell','Dispel Magic','Fear','Fireball','Fly','Haste','Hypnotic Pattern','Lightning Bolt','Major Image','Sending','Slow','Water Breathing'],
 ['Arcane Eye','Banishment','Dimension Door','Fire Shield','Greater Invisibility','Ice Storm','Polymorph','Stoneskin','Wall of Fire'],
 ['Animate Objects','Cone of Cold','Dream','Hold Monster','Scrying','Telekinesis','Wall of Force','Wall of Stone'],
 ['Chain Lightning','Disintegrate','Globe of Invulnerability','Mass Suggestion','Sunbeam','True Seeing','Wall of Ice'],
 ['Etherealness','Forcecage','Plane Shift','Prismatic Spray','Reverse Gravity','Teleport'],
 ['Antimagic Field','Control Weather','Maze','Mind Blank','Power Word Stun','Sunburst'],
 ['Foresight','Gate','Meteor Swarm','Prismatic Wall','Time Stop','True Polymorph','Wish']
].flatMap((arr,i)=>arr.map(n=>({id:'m-'+n.toLowerCase().replace(/[^a-z0-9]+/g,'-'),nome:n,circulo:i+1})));
const tecnicas=[
 ['analise','Análise tática','Observe o cenário antes de agir e proponha uma abordagem estratégica.',0],
 ['defesa','Postura defensiva','Adote uma posição defensiva apropriada; o mestre determina o resultado.',0],
 ['rastreio','Rastreamento','Investigue vestígios para tentar seguir alvos ou descobrir rotas.',0],
 ['medicina','Primeiros socorros','Tente estabilizar ou auxiliar alguém com recursos disponíveis; não garante cura.',0],
 ['negociacao','Negociação','Tente uma abordagem diplomática, sem controlar a vontade de outros.',0],
 ['furtividade','Passos silenciosos','Tente se deslocar discretamente quando o ambiente permitir.',0],
 ['oficina','Improvisação de ferramentas','Use materiais disponíveis para tentar criar uma solução prática.',0],
 ['resistencia','Controle da respiração','Prepare-se para suportar esforço ou pressão; não concede imunidade.',0],
 ['reflexos','Reflexos treinados','Tente reagir a um risco percebido, respeitando os testes do cenário.',0],
 ['estudo','Investigação metódica','Examine pistas e organize informações relevantes.',0],
 ['orientacao','Orientação','Tente localizar caminhos seguros usando referências do ambiente.',0],
 ['precisao','Precisão treinada','Prepare uma ação cuidadosa com equipamento ou técnica já conhecida.',0],
 ['memoria','Memória associativa','Relacione informações já conhecidas ao problema atual.',0],
 ['campismo','Preparação de acampamento','Procure um local seguro e organize os recursos disponíveis.',0],
 ['avaliacao','Avaliação de riscos','Examine perigos visíveis antes de definir uma rota.',0],
 ['coordenacao','Coordenação de equipe','Proponha uma ação conjunta aos aliados dispostos a participar.',0],
 ['disfarce','Disfarce improvisado','Tente adaptar roupas ou objetos disponíveis à situação.',0],
 ['escuta','Escuta atenta','Preste atenção a sons e conversas dentro do alcance perceptível.',0],
 ['cartografia','Cartografia prática','Registre caminhos e referências que o personagem encontrou.',0],
 ['equilibrio','Equilíbrio treinado','Tente atravessar superfícies instáveis com movimentos cuidadosos.',0],
 ['interrogacao','Entrevista investigativa','Faça perguntas direcionadas sem presumir a veracidade das respostas.',0],
 ['avaliar','Avaliação de equipamento','Inspecione o estado de um objeto antes de utilizá-lo.',0],
 ['foco','Foco sob pressão','Organize o pensamento em uma situação tensa; não garante resistência a poderes.',0],
 ['evasao','Retirada estratégica','Planeje um recuo respeitando obstáculos e oposição.',0]
].map(([id,nome,descricao,mana])=>({id,nome,descricao,mana,tipo:'Perícia'}));
const norm=s=>String(s||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const nivelNarrativo=x=>Math.min(20,1+Math.floor(Math.sqrt(Math.max(0,Number(x)||0)/100)));
const conjuradores=['Bardo','Clérigo','Druida','Feiticeiro','Mago','Paladino','Patrulheiro','Bruxo'];
function circulo(classe,n){if(classe==='Bruxo')return Math.min(5,Math.ceil(n/2));if(['Paladino','Patrulheiro'].includes(classe))return Math.min(5,Math.floor((n-1)/4)+1);return Math.min(9,Math.ceil(n/2));}
function notas(classe,n){
 const a=['Confira as características da classe e da subclasse no nível '+n+'. Os PV máximos aumentam conforme a classe e Constituição.'];
 if([5,9,13,17].includes(n))a.push('Bônus de proficiência oficial: +'+(2+Math.floor((n-1)/4))+'. Não é o domínio de habilidades do Mesa.');
 if(n===3)a.push('Escolha a subclasse, caso ainda não tenha escolhido.');
 if([4,8,12,16].includes(n)||(classe==='Guerreiro'&&[6,14].includes(n))||(classe==='Ladino'&&n===10))a.push('Escolha um talento elegível, incluindo Melhoria de Atributo.');
 if(n===19)a.push('Escolha um talento épico elegível ou outro talento permitido.');
 if(conjuradores.includes(classe)){
  if(classe==='Mago')a.push('Adicione duas magias elegíveis ao grimório. Confira separadamente a quantidade de magias preparadas e os espaços.');
  else a.push('Confira a tabela da classe para a quantidade de magias preparadas, trocas permitidas e espaços de magia.');
  if(circulo(classe,n)>circulo(classe,n-1))a.push('Acesso a espaços de círculo '+circulo(classe,n)+' conforme a tabela da classe.');
  if(classe==='Bruxo'&&[11,13,15,17].includes(n))a.push('Escolha um Arcano Místico de círculo '+(6+(n-11)/2)+'.');
 }else a.push('Não recebe feitiços automaticamente só por subir de nível. Verifique características ou talentos elegíveis.');
 return a;
}
function nivelAtual(p){
 const d=p?.dados||{};
 if(d.edicao!=='2024')return nivelNarrativo(p?.xp);
 if(p.xp==null)return Math.max(1,Math.min(20,Number(d.nivel)||1));
 const limites=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
 let n=1;while(n<20&&Number(p.xp)>=limites[n])n++;return n;
}
function registrar(p,antes,depois,retroativo=false){
 const a={...(p.aquisicoes_rpg||{})},d=p.dados||{},dd=d.edicao==='2024',classe=d.classe||'',lista=Array.isArray(a.evolucaoNivel)?a.evolucaoNivel.slice():[];
 const novos=[];
 for(let n=antes+1;n<=Math.min(20,depois);n++){
  if(lista.some(r=>r.nivel===n))continue;
  const r={nivel:n,regra:dd?'dnd':'mesa',classe,escolhas:[],jaAplicadas:0,revisado:false,retroativo,limite:n===1?0:dd?(classe==='Mago'?2:0):1,notas:n===1?(dd?['Revise os atributos, espécie, antecedentes, equipamento e características iniciais da classe.'+(classe==='Mago'?' Confira também os seis feitiços iniciais do grimório.':'')]:['Revise a ficha inicial, o inventário e as habilidades antes de jogar.']):dd?notas(classe,n):['Escolha uma técnica narrativa do Mesa, sem garantir sucesso automático.']};
  lista.push(r);novos.push(r);
 }
 return {aquisicoes:{...a,evolucaoNivel:lista},novos};
}
function registros(p){
 // Completa apenas os níveis efetivamente alcançados. A leitura não altera dados;
 // a lista se torna persistente ao resgatar ou revisar, dentro de transação.
 return registrar(p,0,nivelAtual(p),true).aquisicoes;
}
function painel(p){
 if(!p)return [];
 const a=registros(p),d=p.dados||{},lista=a.evolucaoNivel,nomes=new Set([...(d.habilidades||[]),...(a.habilidades||[])].map(h=>norm(h.nome)));
 for(const r of lista)for(const c of r.escolhas||[])nomes.add(norm(c.nome));
 return lista.filter(r=>r.nivel<=nivelAtual(p)).map(r=>{
  const valida=(r.regra==='dnd')===(d.edicao==='2024')&&(r.regra!=='dnd'||r.classe===d.classe);
  const usadas=(r.escolhas||[]).length+(r.jaAplicadas||0);
  const disponiveis=!valida||usadas>=r.limite?[]:(r.regra==='dnd'?magias.filter(m=>m.circulo<=circulo(r.classe,r.nivel)):tecnicas).filter(m=>!nomes.has(norm(m.nome)));
  return {...r,valida,usadas,disponiveis,pendentes:valida?Math.max(0,r.limite-usadas):0};
 }).sort((a,b)=>a.nivel-b.nivel);
}
function escolher(p,nivel,id){
 const a=registros(p),lista=a.evolucaoNivel.map(r=>({...r,escolhas:[...(r.escolhas||[])]})),r=lista.find(x=>x.nivel===nivel);
 const visivel=painel(p).find(x=>x.nivel===nivel),erro=()=>{const e=Error('Recompensa não disponível ou já escolhida.');e.status=409;throw e;};
 if(!r||!visivel?.valida)erro();
 let escolha;
 if(id==='revisar'){
  if(r.revisado)erro();r.revisado=true;escolha={nome:'Revisão do nível '+nivel+' concluída'};
 }else if(id==='ja-aplicada'){
  // Somente retroativos: o jogador pode contabilizar escolhas já presentes na ficha,
  // inclusive magias registradas em português. Não cria item, poder ou XP.
  if(!r.retroativo||visivel.pendentes<1)erro();r.jaAplicadas=(r.jaAplicadas||0)+1;escolha={nome:'Escolha anterior contabilizada'};
 }else{
  const op=visivel.disponiveis.find(x=>x.id===id);if(!op)erro();
  escolha={id:op.id,nome:op.nome,...(r.regra==='dnd'?{circulo:op.circulo}:{descricao:op.descricao})};
  r.escolhas.push(escolha);
  if(r.regra==='mesa'){
   const h=Array.isArray(a.habilidades)?a.habilidades.slice():[];
   h.push({id:'nivel-'+nivel,nome:op.nome,descricao:op.descricao,nivelMin:nivel,mana:op.mana,tipo:op.tipo,proficiencia:0});a.habilidades=h;
  }
 }
 a.evolucaoNivel=lista;return {aquisicoes:a,escolha};
}
module.exports={nivelNarrativo,nivelAtual,registrar,painel,escolher};
