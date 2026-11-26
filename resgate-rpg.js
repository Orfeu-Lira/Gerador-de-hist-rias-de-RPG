'use strict';
const recursos=require('./recursos-rpg'),aliados=require('./companheiros'),grimorio=require('./grimorio');
const txt=(x,n)=>typeof x==='string'?x.trim().slice(0,n):'',norm=x=>txt(x,100).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' '),int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
const tipos=['item','habilidade','magia','companheiro','pet','familiar'];
function progresso(c,turno){const s=c?.resgateRpg||{};return {ate:Math.max(0,Number(turno)||0),cursor:Number.isInteger(s.cursor)?s.cursor:-1,pendentes:Array.isArray(s.pendentes)?s.pendentes.slice(0,160):[],resultado:Array.isArray(s.resultado)?s.resultado:[],concluido:s.concluido===true};}
function publico(s){return {ate:s.ate,cursor:s.cursor,concluido:s.concluido,resultado:s.resultado,total:s.resultado.filter(x=>x.status==='resgatado').length};}
function candidatos(rows){const grupos=new Map();for(const r of rows){const n=Number(r.numero);if(!Number.isInteger(n)||n<0)continue;const g=grupos.get(n)||{};g[r.papel]=r;grupos.set(n,g);}
 return [...grupos].flatMap(([numero,g])=>!g.mestre||g.mestre.teste||g.mestre.tipo==='ajuste'||g.jogador?.tipo==='ajuste'?[]:[{numero,acao:txt(g.jogador?.texto,1800),narracao:txt(g.mestre.texto,4700)}]);}
function chave(t,n){return (['companheiro','pet','familiar'].includes(t)?'aliado':t==='magia'?'habilidade':t)+':'+norm(n);}
function revisar(s,candidatos,retorno){
 const mapa=new Map(candidatos.map(x=>[x.numero,x])),lista=s.pendentes.map(x=>({...x}));
 for(const x of (Array.isArray(retorno)?retorno:[]).slice(0,32).sort((a,b)=>Number(a?.numero)-Number(b?.numero))){
  const c=mapa.get(x?.numero),nome=txt(x?.nome,80),evidencia=txt(x?.evidencia,300);
  if(!c||!nome||!tipos.includes(x.tipo)||!['ganho','perda'].includes(x.acao)||evidencia.length<12||!c.narracao.includes(evidencia))continue;
  const k=chave(x.tipo,nome),anterior=lista.find(y=>y.chave===k);
  if(x.acao==='perda'){if(anterior)anterior.perdido=true;continue;}
  if(anterior)continue; // não supor que repetição de menção equivale a nova aquisição
  const descricao=txt(x.descricao,160);if(!descricao||lista.length>=160)continue;
  lista.push({chave:k,tipo:x.tipo,nome,descricao,numero:x.numero,evidencia,quantidade:int(x.quantidade,1,99)?x.quantidade:1,nivelMin:int(x.nivelMin,1,20)?x.nivelMin:1,mana:int(x.mana,0,20)?x.mana:0,consumivel:x.consumivel===true,pvMax:int(x.pvMax,1,500)?x.pvMax:null,pv:int(x.pv,0,500)?x.pv:null,manaMax:int(x.manaMax,0,200)?x.manaMax:0,forma:txt(x.forma,20),cor:txt(x.cor,20),olhos:txt(x.olhos,20),perdido:false});
 }
 return lista;
}
function aplicar(p,c,s,logs,campanhaId,modo){
 const a=recursos.colecao(p),d=p.dados||{},lista=aliados.estado(c),resultados=[];
 const baseItems=Array.isArray(d.inventario)?d.inventario.map(i=>i.nome):String(d.equipamentos||'').split('\n');
 const eventos=(logs||[]).flatMap(r=>Array.isArray(r.recursos_evento)?r.recursos_evento:[]).filter(x=>typeof x==='string');
 const nomesLog=new Set(eventos.flatMap(x=>{const m=x.match(/^(?:Item adquirido: |Habilidade aprendida: |Consumido: |Novo (?:companheiro|pet|familiar): |Resgate retroativo: )(.+?)(?: \(\+1\)| \(bloqueado até nível \d+\))?$/);return m?[norm(m[1])]:[];}));
 const dnd=d.edicao==='2024',existentes=new Set([...a.habilidades,...(d.habilidades||[])].map(h=>norm(h.nome)));
 const magiasConhecidas=grimorio.estado(p,c,Math.max(1,Math.min(20,Number(d.nivel)||1)),modo)?.conhecidas||[];
 for(const x of s.pendentes){const registro={nome:x.nome,tipo:x.tipo,numero:x.numero,evidencia:x.evidencia,status:'resgatado'},n=norm(x.nome);
  if(x.perdido){registro.status='consumido ou perdido';}
  else if(nomesLog.has(n)){registro.status='já registrado';}
  else if(x.tipo==='item'){
   if(baseItems.some(i=>norm(i)===n)||a.itens.some(i=>norm(i.nome)===n))registro.status='já registrado';
   else if(a.itens.length>=40)registro.status='revisão manual: inventário cheio';
   else a.itens.push({id:'retro-'+campanhaId+'-'+x.numero+'-'+resultados.length,nome:x.nome,descricao:x.descricao,nivelMin:x.nivelMin,quantidade:x.quantidade,consumivel:x.consumivel});
  }else if(['habilidade','magia'].includes(x.tipo)){
   const m=x.tipo==='magia'?grimorio.identificar(x.nome):null;
   if(existentes.has(n)||(m&&magiasConhecidas.some(h=>h.id===m.id)))registro.status='já registrado';
   else if(dnd&&x.tipo==='magia'&&(d.classe!=='Mago'||!m||m.circulo>Math.ceil((Number(d.nivel)||1)/2)))registro.status='revisão manual: regras de classe';
   else if(dnd&&x.tipo==='habilidade')registro.status='revisão manual: característica de D&D';
   else if(a.habilidades.length>=40)registro.status='revisão manual: limite de habilidades';
   else{a.habilidades.push({id:'retro-'+campanhaId+'-'+x.numero+'-'+resultados.length,nome:m?m.nome:x.nome,descricao:x.descricao,nivelMin:x.nivelMin,mana:x.mana,proficiencia:0,tipo:x.tipo==='magia'?'Magia':'Narrativa',...(m?{grimorioRetro:true}:{})});existentes.add(n);}
  }else{
   if(lista.some(h=>norm(h.nome)===n))registro.status='já registrado';
   else if(x.pvMax===null||x.pv===null||x.pv>x.pvMax)registro.status='revisão manual: PV não confirmados';
   else if(lista.length>=12||lista.filter(h=>h.ativo).length>=6||(dnd&&x.tipo==='familiar'&&lista.some(h=>h.ativo&&h.tipo==='familiar')))registro.status='revisão manual: limite ou regra de familiar';
   else lista.push({id:'retro-'+campanhaId+'-'+x.numero+'-'+resultados.length,nome:x.nome,tipo:x.tipo,descricao:x.descricao,pv:x.pv,pvMax:x.pvMax,mana:0,manaMax:0,ativo:true,status:'ativo',visual:aliados.visual(x),turno:x.numero});
  }
  resultados.push(registro);
 }
 return {aquisicoes:recursos.armazenamento(a),companheiros:lista,resultado:resultados};
}
module.exports={progresso,publico,candidatos,revisar,aplicar};
