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
 ['precisao','Precisão treinada','Prepare uma ação cuidadosa com equipamento ou técnica já conhecida.',0]
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
function registrar(p,antes,depois){
 const a={...(p.aquisicoes_rpg||{})},d=p.dados||{},dd=d.edicao==='2024',classe=d.classe||'',lista=Array.isArray(a.evolucaoNivel)?a.evolucaoNivel.slice():[];
 const novos=[];
 for(let n=antes+1;n<=Math.min(20,depois);n++){
  if(!dd&&n%2!==0)continue;if(lista.some(r=>r.nivel===n))continue;
  const r={nivel:n,regra:dd?'dnd':'mesa',classe,escolhas:[],limite:dd?(classe==='Mago'?2:0):1,notas:dd?notas(classe,n):['Escolha uma técnica narrativa do Mesa, sem garantir sucesso automático.']};
  lista.push(r);novos.push(r);
 }
 return {aquisicoes:{...a,evolucaoNivel:lista},novos};
}
function painel(p){
 const a=p?.aquisicoes_rpg||{},d=p?.dados||{},lista=Array.isArray(a.evolucaoNivel)?a.evolucaoNivel:[],nomes=new Set([...(d.habilidades||[]),...(a.habilidades||[])].map(h=>norm(h.nome)));
 for(const r of lista)for(const c of r.escolhas||[])nomes.add(norm(c.nome));
 return lista.map(r=>{
  const valida=(r.regra==='dnd')===(d.edicao==='2024')&&(r.regra!=='dnd'||r.classe===d.classe);
  const disponiveis=!valida||r.escolhas.length>=r.limite?[]:(r.regra==='dnd'?magias.filter(m=>m.circulo<=circulo(r.classe,r.nivel)):tecnicas).filter(m=>!nomes.has(norm(m.nome)));
  return {...r,disponiveis};
 }).sort((a,b)=>b.nivel-a.nivel);
}
function escolher(p,nivel,id){
 const a={...(p.aquisicoes_rpg||{})},lista=Array.isArray(a.evolucaoNivel)?a.evolucaoNivel.map(r=>({...r,escolhas:[...r.escolhas]})):[],r=lista.find(x=>x.nivel===nivel);
 const op=painel(p).find(x=>x.nivel===nivel)?.disponiveis.find(x=>x.id===id);
 if(!r||!op){const e=Error('Recompensa não disponível ou já escolhida.');e.status=409;throw e;}
 const escolha={id:op.id,nome:op.nome,...(r.regra==='dnd'?{circulo:op.circulo}:{descricao:op.descricao})};
 r.escolhas.push(escolha);
 if(r.regra==='mesa'){
  const h=Array.isArray(a.habilidades)?a.habilidades.slice():[];
  h.push({id:'nivel-'+nivel,nome:op.nome,descricao:op.descricao,nivelMin:nivel,mana:op.mana,tipo:op.tipo,proficiencia:0});
  a.habilidades=h;
 }
 a.evolucaoNivel=lista;return {aquisicoes:a,escolha};
}
module.exports={nivelNarrativo,registrar,painel,escolher};
