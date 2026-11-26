'use strict';
const xp=require('./xp');
const vida={Bárbaro:[12,7],Guerreiro:[10,6],Paladino:[10,6],Patrulheiro:[10,6],Bardo:[8,5],Clérigo:[8,5],Druida:[8,5],Monge:[8,5],Ladino:[8,5],Bruxo:[8,5],Feiticeiro:[6,4],Mago:[6,4]};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,txt=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
function colecao(p){const a=p?.aquisicoes_rpg||{};return {itens:Array.isArray(a.itens)?a.itens.map(x=>({...x})):[],habilidades:Array.isArray(a.habilidades)?a.habilidades.map(x=>({...x})):[]};}
function estado(p,c={},modo='padrao'){
 if(!p)return null;const d=p.dados||{},dnd=d.edicao==='2024',exp=xp.estado(p),nivel=dnd?exp.nivel:Math.min(20,1+Math.floor(Math.sqrt(Math.max(0,exp.total)/100)));
 const mod=Math.floor((Number(d.atributos?.con??10)-10)/2),[faces,fixo]=Object.hasOwn(vida,d.classe)?vida[d.classe]:[8,5];
 const pvMax=dnd?Math.max(1,faces+mod)+(nivel-1)*Math.max(1,fixo+mod):20+(nivel-1)*5,manaMax=modo==='mana'?10+(nivel-1)*5:0;
 const atual=(v,max,old)=>!int(v,0,10000)||!int(old,0,10000)?max:clamp(v+(v>0?Math.max(0,max-old):0),0,max);
 return {nivel,pv:atual(c.pv,pvMax,c.pvMax),pvMax,mana:manaMax?atual(c.mana,manaMax,c.manaMax):0,manaMax,...colecao(p),modo,dnd};
}
function erro(s){const e=Error(s);e.status=409;throw e;}
function preparar(e,uso,tipo){
 if(uso==null||uso===''){if(e&&e.pv===0&&tipo==='acao')erro('Sem PV: selecione Pedir socorro / descansar.');return null;}
 if(!e||tipo!=='acao'||typeof uso!=='string')erro('Uso de recurso inválido.');
 if(uso==='socorro')return {tipo:'socorro'};
 if(e.pv===0)erro('Sem PV: não é possível utilizar este recurso.');
 const [kind,id]=uso.split(':');if(!['item','habilidade'].includes(kind)||!id)erro('Recurso inválido.');
 const a=(kind==='item'?e.itens:e.habilidades).find(x=>x.id===id);
 if(!a)erro('Você ainda não possui esse recurso.');if(e.nivel<a.nivelMin)erro('Requer nível '+a.nivelMin+'.');
 if(kind==='item'&&a.quantidade<1)erro('Item esgotado.');
 const custo=kind==='habilidade'&&e.manaMax?a.mana:0;if(custo>e.mana)erro('Mana insuficiente.');
 return {tipo:kind,id:a.id,nome:a.nome,custo,consumivel:kind==='item'&&a.consumivel===true};
}
function aplicar(p,anterior,modo,uso,efeito,conquista,tipo,turno,campanhaId){
 const e=estado(p,anterior,modo),a=colecao(p),eventos=[];if(!e||tipo==='ajuste')return {estado:e,eventos,aquisicoes:a};
 if(uso){const c=preparar(e,uso.tipo==='socorro'?'socorro':uso.tipo+':'+uso.id,'acao');if(c.custo){e.mana-=c.custo;eventos.push('−'+c.custo+' mana · '+c.nome);}if(c.consumivel){a.itens.find(x=>x.id===c.id).quantidade--;eventos.push('Consumido: '+c.nome);}}
 const v=efeito&&typeof efeito==='object'&&!Array.isArray(efeito)?efeito:{};
 if(int(v.pv,-Math.min(100,e.pvMax),Math.min(100,e.pvMax))){const antes=e.pv;e.pv=clamp(e.pv+v.pv,0,e.pvMax);const delta=e.pv-antes;if(delta)eventos.push((delta>0?'+':'')+delta+' PV');}
 if(uso?.tipo==='socorro'&&v.descanso===true&&e.pv>0){const antes=e.mana;e.mana=e.manaMax;if(e.mana>antes)eventos.push('Mana recuperada: +'+(e.mana-antes));}
 const g=v.aquisicao;
 if(conquista&&g&&typeof g==='object'&&!Array.isArray(g)&&['item','habilidade'].includes(g.tipo)){
 const nome=txt(g.nome,80),descricao=txt(g.descricao,160),nivelMin=g.nivelMin;
 if(nome&&descricao&&int(nivelMin,1,20)){const lista=g.tipo==='item'?a.itens:a.habilidades,existe=lista.find(x=>x.nome.normalize('NFKC').toLowerCase()===nome.normalize('NFKC').toLowerCase());
 if(!existe&&lista.length<40){const novo={id:String(campanhaId)+'-'+String(turno),nome,descricao,nivelMin};if(g.tipo==='item'){novo.quantidade=1;novo.consumivel=g.consumivel===true;}else novo.mana=int(g.mana,0,20)?g.mana:0;lista.push(novo);eventos.push((g.tipo==='item'?'Item adquirido: ':'Habilidade aprendida: ')+nome+(nivelMin>e.nivel?' (bloqueado até nível '+nivelMin+')':''));}
 else if(existe&&g.tipo==='item'&&existe.consumivel&&existe.quantidade<99&&['secundaria','principal','combate','exploracao'].includes(conquista)){existe.quantidade++;eventos.push('Item adquirido: '+existe.nome+' (+1)');}
 }}
 e.itens=a.itens;e.habilidades=a.habilidades;return {estado:e,eventos,aquisicoes:a};
}
function persistir(e){return {pv:e.pv,pvMax:e.pvMax,mana:e.mana,manaMax:e.manaMax};}
module.exports={estado,preparar,aplicar,persistir,colecao};