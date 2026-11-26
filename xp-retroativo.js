'use strict';
const xp=require('./xp');
function progresso(c,turno){const r=c?.retroXP||{},ate=Number.isInteger(r.ate)?Math.max(0,Math.min(Number(turno)||0,r.ate)):Number(turno)||0;return {ate,cursor:Math.max(0,Math.min(ate,Number(r.cursor)||0)),total:Math.max(0,Number(r.total)||0)};}
function candidatos(rows,pagos){
 const ja=new Set(pagos.map(r=>Number(r.chave))),grupos=new Map();
 for(const r of rows){const n=Number(r.numero);if(!Number.isInteger(n)||n<1||ja.has(n))continue;const g=grupos.get(n)||{};g[r.papel]=r;grupos.set(n,g);}
 return [...grupos].flatMap(([numero,g])=>{if(!g.jogador||!g.mestre||g.mestre.teste||g.jogador.tipo==='ajuste'||g.mestre.tipo==='ajuste'||(/^\[Rolagem validada pelo servidor:/.test(g.jogador.texto)&&/; falha\.|1 natural, falha no ataque/.test(g.jogador.texto)))return [];
 return [{numero,acao:String(g.jogador.texto).slice(0,1800),narracao:String(g.mestre.texto).slice(0,4700)}];});
}
function validar(candidatos,respostas,pagos){
 const mapa=new Map(candidatos.map(r=>[r.numero,r])),vistos=new Set(pagos.map(r=>Number(r.chave))),historico=pagos.map(r=>({numero:Number(r.chave),categoria:r.categoria})),validos=[];
 for(const r of (Array.isArray(respostas)?respostas:[]).slice(0,10).sort((a,b)=>Number(a?.numero)-Number(b?.numero))){
  const c=mapa.get(r?.numero);if(!c||vistos.has(r.numero)||!Object.hasOwn(xp.categorias,r.categoria)||typeof r.evidencia!=='string'||r.evidencia.trim().length<12||!c.narracao.includes(r.evidencia.trim()))continue;
  if(historico.some(h=>h.categoria===r.categoria&&Math.abs(h.numero-r.numero)<=3))continue;
  vistos.add(r.numero);historico.push(r);validos.push({numero:r.numero,categoria:r.categoria});
 }return validos;
}
module.exports={progresso,candidatos,validar};
