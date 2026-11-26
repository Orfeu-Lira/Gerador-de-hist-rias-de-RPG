'use strict';
const xp=require('./xp');
const evolucao=require('./evolucao-nivel');
const grimorio=require('./grimorio');
const vida={Bárbaro:[12,7],Guerreiro:[10,6],Paladino:[10,6],Patrulheiro:[10,6],Bardo:[8,5],Clérigo:[8,5],Druida:[8,5],Monge:[8,5],Ladino:[8,5],Bruxo:[8,5],Feiticeiro:[6,4],Mago:[6,4]};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,txt=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const faixas=[{min:0,nome:'Iniciante',desconto:0},{min:20,nome:'Aprendiz',desconto:0},{min:50,nome:'Proficiente',desconto:1},{min:100,nome:'Especialista',desconto:2},{min:200,nome:'Mestre',desconto:3}];
function proficiencia(h){const pontos=int(h?.proficiencia,0,200)?h.proficiencia:0;let i=0;while(i+1<faixas.length&&pontos>=faixas[i+1].min)i++;return {pontos,grau:faixas[i].nome,desconto:faixas[i].desconto,base:faixas[i].min,proximo:faixas[i+1]?.min??null};}
function custoMana(h){const custo=int(h.mana,0,20)?h.mana:0;return Math.max(custo?1:0,custo-Math.min(Math.floor(custo/2),proficiencia(h).desconto));}
const normalizarNome=n=>txt(n,80).normalize('NFKC').toLowerCase().replace(/\s+/g,' ');
function manualId(n){return 'manual-'+encodeURIComponent(normalizarNome(n));}
function colecao(p){
 const a=p?.aquisicoes_rpg||{},itens=Array.isArray(a.itens)?a.itens.map(x=>({...x})):[],habilidades=Array.isArray(a.habilidades)?a.habilidades.map(x=>({...x})):[],manual=Array.isArray(a.manual)?a.manual.filter(x=>x&&typeof x.id==='string').slice(0,100):[];
 const nomes=new Set(habilidades.map(h=>normalizarNome(h.nome)));
 for(const h of p?.dados?.habilidades||[]){
   if(!h||!txt(h.nome,80)||h.treinavel===false||(h.treinavel!==true&&String(h.descricao||'').startsWith('Ideia narrativa para discutir com o mestre;')))continue;
   const nome=normalizarNome(h.nome);if(nomes.has(nome))continue;nomes.add(nome);
   const id=manualId(h.nome),m=manual.find(x=>x.id===id)||{};
   habilidades.push({...m,id,nome:txt(h.nome,80),descricao:txt(h.descricao,200),nivelMin:int(h.nivelMin,1,20)?h.nivelMin:1,mana:int(h.mana,0,20)?h.mana:0,manual:true,tipo:txt(h.tipo,30)||'Narrativa'});
 }
 return {itens,habilidades,manual,evolucaoNivel:Array.isArray(a.evolucaoNivel)?a.evolucaoNivel:[]};
}
function armazenamento(a){
 const historico=new Map((a.manual||[]).map(x=>[x.id,x]));
 for(const h of a.habilidades.filter(x=>x.manual===true)){
  const {id,proficiencia,praticaDia,praticaHoje,praticaCampanha,praticaTurno,praticaOnline}=h;
  if(proficiencia||historico.has(id))historico.set(id,{id,proficiencia,praticaDia,praticaHoje,praticaCampanha,praticaTurno,praticaOnline});
 }
 const ativos=new Set(a.habilidades.filter(x=>x.manual===true).map(x=>x.id));
 const registros=[...historico.values()].sort((x,y)=>Number(ativos.has(y.id))-Number(ativos.has(x.id))).slice(0,100);
 return {itens:a.itens,habilidades:a.habilidades.filter(x=>!x.manual),manual:registros,evolucaoNivel:a.evolucaoNivel||[]};
}
function premiar(h,{campanhaId,turno,origem='solo',agora=new Date().toISOString()}){
 const antes=proficiencia(h),dia=agora.slice(0,10),gasto=h.praticaDia===dia&&int(h.praticaHoje,0,25)?h.praticaHoje:0;
 const repetiu=origem==='solo'?h.praticaCampanha===String(campanhaId)&&int(h.praticaTurno,0,100000)&&turno-h.praticaTurno<3:typeof h.praticaOnline==='string'&&Date.parse(agora)-Date.parse(h.praticaOnline)<60000;
 const ganho=repetiu?0:Math.min(5,25-gasto,200-antes.pontos);
 if(ganho>0){h.proficiencia=antes.pontos+ganho;h.praticaDia=dia;h.praticaHoje=gasto+ganho;if(origem==='solo'){h.praticaCampanha=String(campanhaId);h.praticaTurno=turno;}else h.praticaOnline=agora;}
 return {ganho,antes,depois:proficiencia(h)};
}
function estado(p,c={},modo='padrao'){
 if(!p)return null;const d=p.dados||{},dnd=d.edicao==='2024',exp=xp.estado(p),nivel=dnd?exp.nivel:Math.min(20,1+Math.floor(Math.sqrt(Math.max(0,exp.total)/100)));
 const mod=Math.floor((Number(d.atributos?.con??10)-10)/2),[faces,fixo]=Object.hasOwn(vida,d.classe)?vida[d.classe]:[8,5];
 const pvMax=dnd?Math.max(1,faces+mod)+(nivel-1)*Math.max(1,fixo+mod):20+(nivel-1)*5,manaMax=modo==='mana'?10+(nivel-1)*5:0;
 const atual=(v,max,old)=>!int(v,0,10000)||!int(old,0,10000)?max:clamp(v+(v>0?Math.max(0,max-old):0),0,max);
 return {nivel,pv:atual(c.pv,pvMax,c.pvMax),pvMax,mana:manaMax?(c.manaMax===0?manaMax:atual(c.mana,manaMax,c.manaMax)):0,manaMax,...(({itens,habilidades})=>({itens,habilidades}))(colecao(p)),modo,dnd,grimorio:grimorio.estado(p,c,nivel,modo),praticaPendente:typeof c.praticaPendente==='string'?c.praticaPendente:null};
}
function erro(s){const e=Error(s);e.status=409;throw e;}
function preparar(e,uso,tipo){
 if(uso==null||uso===''){if(e&&e.pv===0&&tipo==='acao')erro('Sem PV: selecione Pedir socorro / descansar.');return null;}
 if(!e||tipo!=='acao'||typeof uso!=='string')erro('Uso de recurso inválido.');
 if(uso==='socorro')return {tipo:'socorro'};
 if(e.pv===0)erro('Sem PV: não é possível utilizar este recurso.');
 const [kind,id,circulo]=uso.split(':');if(kind==='magia')return grimorio.conjurar(e.grimorio,id,Number(circulo),e.mana);if(!['item','habilidade'].includes(kind)||!id)erro('Recurso inválido.');
 const a=(kind==='item'?e.itens:e.habilidades).find(x=>x.id===id);
 if(!a)erro('Você ainda não possui esse recurso.');if(kind==='habilidade'&&e.grimorio&&a.tipo==='Magia'&&grimorio.identificar(a.nome))erro('Selecione a magia preparada no grimório.');if(e.nivel<a.nivelMin)erro('Requer nível '+a.nivelMin+'.');
 if(kind==='item'&&a.quantidade<1)erro('Item esgotado.');
 const custo=kind==='habilidade'&&e.manaMax?custoMana(a):0;if(custo>e.mana)erro('Mana insuficiente.');
 return {tipo:kind,id:a.id,nome:a.nome,custo,consumivel:kind==='item'&&a.consumivel===true,...(kind==='habilidade'?{dominio:proficiencia(a).grau}: {})};
}
function aplicar(p,anterior,modo,uso,efeito,conquista,tipo,turno,campanhaId,opcoes={}){
 const e=estado(p,anterior,modo),a=colecao(p),eventos=[];if(!e)return {estado:e,eventos,aquisicoes:a};if(tipo==='ajuste'){e.praticaPendente=null;return {estado:e,eventos,aquisicoes:a};}
 if(uso){const c=preparar(e,uso.tipo==='socorro'?'socorro':uso.tipo+':'+uso.id+(uso.tipo==='magia'?':'+uso.circulo:''),'acao');if(c.tipo==='magia'&&e.grimorio.modo!=='mana'){e.grimorio.gastos[c.circulo-1]++;eventos.push('Espaço consumido: '+c.circulo+'º círculo · '+c.nome);}if(c.custo){e.mana-=c.custo;eventos.push('−'+c.custo+' mana · '+c.nome);}if(c.consumivel){a.itens.find(x=>x.id===c.id).quantidade--;eventos.push('Consumido: '+c.nome);}}
 const v=efeito&&typeof efeito==='object'&&!Array.isArray(efeito)?efeito:{};
 if(int(v.pv,-Math.min(100,e.pvMax),Math.min(100,e.pvMax))){const antes=e.pv;e.pv=clamp(e.pv+v.pv,0,e.pvMax);const delta=e.pv-antes;if(delta)eventos.push((delta>0?'+':'')+delta+' PV');}
 if(uso?.tipo==='socorro'&&v.descanso===true&&e.pv>0){const antes=e.mana;e.mana=e.manaMax;if(e.mana>antes)eventos.push('Mana recuperada: +'+(e.mana-antes));}
 if(uso?.tipo==='socorro'&&v.descanso===true&&['curto','longo'].includes(v.descansoTipo)&&!opcoes.testePendente&&e.grimorio){grimorio.descanso(e.grimorio,v.descansoTipo);eventos.push(v.descansoTipo==='longo'?'Descanso longo: preparação liberada'+(e.grimorio.modo==='mana'?'':' e espaços restaurados'):'Descanso curto concluído'+(e.nivel>=5?' · uma troca de magia disponível':''));}
 const g=v.aquisicao;
 if(conquista&&g&&typeof g==='object'&&!Array.isArray(g)&&['item','habilidade'].includes(g.tipo)){
 const nome=txt(g.nome,80),descricao=txt(g.descricao,160),nivelMin=g.nivelMin;
 if(nome&&descricao&&int(nivelMin,1,20)){const lista=g.tipo==='item'?a.itens:a.habilidades,existe=lista.find(x=>x.nome.normalize('NFKC').toLowerCase()===nome.normalize('NFKC').toLowerCase());
 if(!existe&&lista.length<40){const novo={id:String(campanhaId)+'-'+String(turno),nome,descricao,nivelMin};if(g.tipo==='item'){novo.quantidade=1;novo.consumivel=g.consumivel===true;}else {novo.mana=int(g.mana,0,20)?g.mana:0;novo.proficiencia=0;novo.tipo=['Característica','Perícia','Magia','Talento','Narrativa'].includes(g.categoriaHabilidade)?g.categoriaHabilidade:'Narrativa';}lista.push(novo);eventos.push((g.tipo==='item'?'Item adquirido: ':'Habilidade aprendida: ')+nome+(nivelMin>e.nivel?' (bloqueado até nível '+nivelMin+')':''));}
 else if(existe&&g.tipo==='item'&&existe.consumivel&&existe.quantidade<99&&['secundaria','principal','combate','exploracao'].includes(conquista)){existe.quantidade++;eventos.push('Item adquirido: '+existe.nome+' (+1)');}
 }}
 const pratica=uso?.tipo==='habilidade'?uso.id:tipo==='rolagem'?e.praticaPendente:null;
 e.praticaPendente=null;
 if(opcoes.ativa!==false&&pratica&&opcoes.falhou!==true){
   const h=a.habilidades.find(x=>x.id===pratica);
   if(h){
     if(opcoes.testePendente)e.praticaPendente=pratica;
     else if(conquista){
       const {ganho,antes,depois}=premiar(h,{campanhaId,turno,agora:opcoes.agora});
       if(ganho>0){eventos.push('+'+ganho+' proficiência · '+h.nome+' ('+depois.pontos+'/200)');if(antes.grau!==depois.grau)eventos.push('Habilidade evoluída: '+h.nome+' → '+depois.grau);}
     }
   }
 }
 e.itens=a.itens;e.habilidades=a.habilidades;return {estado:e,eventos,aquisicoes:a};
}
function fichaSolo(p,e){
 if(!p||!e)return null;
 const d=p.dados||{},base=Array.isArray(d.inventario)?d.inventario:String(d.equipamentos||'').split('\n').map(nome=>({nome,tipo:'Outros',quantidade:1}));
 const inventario=base.slice(0,32).filter(i=>i&&txt(i.nome,80)).map(i=>({nome:txt(i.nome,80),tipo:txt(i.tipo,30)||'Outros',quantidade:int(i.quantidade,1,99)?i.quantidade:1,equipado:i.equipado===true,descricao:txt(i.descricao,120),origem:'ficha'}));
 for(const i of e.itens||[])inventario.push({...i,origem:'aventura',tipo:i.consumivel?'Consumível':'Outros'});
 const cadastradas=Array.isArray(d.habilidades)?d.habilidades:[],porNome=new Map(cadastradas.filter(h=>h&&txt(h.nome,80)).map(h=>[normalizarNome(h.nome),h]));
 const habilidades=(e.habilidades||[]).map(h=>({...h,tipo:h.tipo||porNome.get(normalizarNome(h.nome))?.tipo||'Narrativa',origem:h.manual?'ficha':'aventura',utilizavel:true}));
 const nomes=new Set(habilidades.map(h=>normalizarNome(h.nome)));
 for(const h of cadastradas.slice(0,24))if(h&&txt(h.nome,80)&&!nomes.has(normalizarNome(h.nome))){
  nomes.add(normalizarNome(h.nome));habilidades.push({nome:txt(h.nome,80),tipo:txt(h.tipo,30)||'Narrativa',descricao:txt(h.descricao,200),origem:'ficha',utilizavel:false,nivelMin:int(h.nivelMin,1,20)?h.nivelMin:1,mana:int(h.mana,0,20)?h.mana:0});
 }
 const recompensas=evolucao.painel(p);
 const livro=e.grimorio;
 const magiasLivro=livro?livro.conhecidas.map(m=>({...m,tipo:'Magia',descricao:'Círculo '+m.circulo+' · '+(livro.preparadas.includes(m.id)?'Preparada':'Não preparada'),origem:'ficha',utilizavel:false,grimorio:true,preparada:livro.preparadas.includes(m.id),nivelMin:1})):[];
 return {inventario,feiticos:[...habilidades.filter(h=>h.tipo==='Magia'&&(!livro||!grimorio.identificar(h.nome)||!livro.conhecidas.some(m=>m.id===grimorio.identificar(h.nome)?.id))),...magiasLivro],habilidades:habilidades.filter(h=>h.tipo!=='Magia'),evolucao:recompensas,grimorio:livro};
}
function persistir(e){return {pv:e.pv,pvMax:e.pvMax,mana:e.mana,manaMax:e.manaMax,praticaPendente:e.praticaPendente??null,grimorio:grimorio.persistir(e.grimorio)};}
module.exports={estado,preparar,aplicar,persistir,fichaSolo,colecao,armazenamento,premiar,manualId,proficiencia,custoMana,faixas};