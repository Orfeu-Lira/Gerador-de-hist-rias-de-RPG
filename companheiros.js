'use strict';
const tipos=['companheiro','pet','familiar'],formas=['humanoide','lobo','raposa','gato','ave','dragao','cavalo','serpente','criatura'],cores=['preto','branco','cinza','marrom','vermelho','dourado','verde','azul','roxo'];
const txt=(x,n)=>typeof x==='string'?x.trim().slice(0,n):'';
const int=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const norm=x=>txt(x,600).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function visual(g){
 const t=norm(g.descricao+' '+g.nome),forma=formas.includes(g.forma)?g.forma:/raposa/.test(t)?'raposa':/lobo|cao|cachorro/.test(t)?'lobo':/gato|felino/.test(t)?'gato':/corvo|coruja|ave|falcao|aguia/.test(t)?'ave':/dragao/.test(t)?'dragao':/cavalo/.test(t)?'cavalo':/cobra|serpente/.test(t)?'serpente':g.tipo==='companheiro'?'humanoide':'criatura';
 const cor=cores.includes(g.cor)?g.cor:/negr|pret/.test(t)?'preto':/branc/.test(t)?'branco':/cinz/.test(t)?'cinza':/vermelh|ruiv/.test(t)?'vermelho':/dourad|loiro/.test(t)?'dourado':/verde/.test(t)?'verde':/azul/.test(t)?'azul':/rox|violet/.test(t)?'roxo':'marrom';
 const olhos=cores.includes(g.olhos)?g.olhos:'dourado';return {forma,cor,olhos};
}
function estado(c){
 return (Array.isArray(c?.companheiros)?c.companheiros:[]).slice(0,12).filter(x=>x&&typeof x.id==='string'&&tipos.includes(x.tipo)&&int(x.pvMax,1,500)&&int(x.pv,0,x.pvMax)&&int(x.manaMax,0,200)&&int(x.mana,0,x.manaMax)).map(x=>({...x,visual:visual({...x,...x.visual}),ativo:x.ativo!==false}));
}
function aplicar(c,efeitos,{turno=0,tipo='acao',teste=false,dnd=false,mana=false}={}){
 const lista=estado(c),eventos=[];
 if(tipo==='ajuste'||teste||!efeitos||typeof efeitos!=='object')return {lista,eventos};
 // Aplica somente diferenças a aliados existentes e ativos; uma vez por turno.
 const vistos=new Set();
 for(const v of (Array.isArray(efeitos.companheiros)?efeitos.companheiros:[]).slice(0,6)){
  if(!v||vistos.has(v.id))continue;vistos.add(v.id);const x=lista.find(a=>a.id===v.id&&a.ativo);if(!x)continue;
  for(const [chave,recurso,max] of [['deltaPv','pv','pvMax'],['deltaMana','mana','manaMax']])if(int(v[chave],-x[max],x[max])){
   const antes=x[recurso];x[recurso]=Math.max(0,Math.min(x[max],antes+v[chave]));const delta=x[recurso]-antes;
   if(delta)eventos.push(x.nome+' · '+(delta>0?'+':'')+delta+(recurso==='pv'?' PV':' MP'));
  }
  if(v.status==='partiu'||v.status==='morto'){x.ativo=false;x.status=v.status;if(v.status==='morto')x.pv=0;eventos.push(x.nome+(v.status==='morto'?' · morreu na narrativa':' · deixou o grupo'));}
 }
 const g=efeitos.novoCompanheiro;
 if(g&&typeof g==='object'&&g.vinculoConfirmado===true&&tipos.includes(g.tipo)&&lista.length<12&&lista.filter(x=>x.ativo).length<6){
  const nome=txt(g.nome,60),descricao=txt(g.descricao,400);
  if(nome&&descricao&&int(g.pvMax,1,500)&&!lista.some(x=>norm(x.nome)===norm(nome))&&!(dnd&&g.tipo==='familiar'&&lista.some(x=>x.ativo&&x.tipo==='familiar'))){
   const manaMax=mana&&int(g.manaMax,0,200)?g.manaMax:0;
   const x={id:'aliado-'+turno,nome,tipo:g.tipo,descricao,pv:g.pvMax,pvMax:g.pvMax,mana:manaMax,manaMax,ativo:true,status:'ativo',visual:visual(g),turno};
   if(!lista.some(a=>a.id===x.id)){lista.push(x);eventos.push('Novo '+g.tipo+': '+nome);}
  }
 }
 return {lista,eventos};
}
module.exports={estado,aplicar,visual};
