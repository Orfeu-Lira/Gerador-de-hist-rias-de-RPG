'use strict';
const evolucao=require('./evolucao-nivel');
const limites=[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25];
const slots=[[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const aliases={'m-magic-missile':['misseis magicos','missil magico','dardos magicos'],'m-mage-armor':['armadura arcana','armadura de mago'],'m-shield':['escudo arcano','escudo'],'m-sleep':['sono'],'m-fireball':['bola de fogo'],'m-burning-hands':['maos flamejantes'],'m-feather-fall':['queda suave'],'m-detect-magic':['detectar magia','deteccao de magia'],'m-misty-step':['passo nebuloso'],'m-counterspell':['contramagica','contra magia'],'m-invisibility':['invisibilidade'],'m-thunderwave':['onda trovejante'],'m-fly':['voo','voar'],'m-lightning-bolt':['relampago']};
function identificar(nome){const n=norm(nome);return evolucao.magias.find(m=>norm(m.nome)===n||aliases[m.id]?.includes(n));}
function estado(p,c,nivel,modo){
 if(p?.dados?.edicao!=='2024'||p.dados.classe!=='Mago')return null;
 const max=slots[nivel-1].slice(),mapa=new Map(),g=c?.grimorio||{};
 const add=m=>{if(m&&m.circulo<=max.length)mapa.set(m.id,{id:m.id,nome:m.nome,circulo:m.circulo});};
 for(const r of p.aquisicoes_rpg?.evolucaoNivel||[])if(r.regra==='dnd'&&r.classe==='Mago'&&r.nivel<=nivel)for(const x of r.escolhas||[])add(evolucao.magias.find(m=>m.id===x.id));
 for(const h of p.aquisicoes_rpg?.habilidades||[])if(h.tipo==='Magia'&&h.grimorioRetro===true)add(identificar(h.nome));
 for(const h of p.dados?.habilidades||[])if(h.tipo==='Magia'&&h.treinavel!==false&&!String(h.descricao||'').startsWith('Ideia narrativa para discutir com o mestre;'))add(identificar(h.nome));
 const conhecidas=[...mapa.values()].sort((a,b)=>a.circulo-b.circulo||a.nome.localeCompare(b.nome));
 const preparadas=[...new Set(Array.isArray(g.preparadas)?g.preparadas.filter(id=>mapa.has(id)):[])].slice(0,limites[nivel-1]);
 const gastos=max.map((m,i)=>Math.min(m,Math.max(0,Number.isInteger(g.gastos?.[i])?g.gastos[i]:0)));
 return {conhecidas,preparadas,limite:limites[nivel-1],max,gastos,modo,permissao:['livre','uma','fechada'].includes(g.permissao)?g.permissao:'livre',nivel};
}
function falha(msg){const e=Error(msg);e.status=409;throw e;}
function preparar(g,ids){
 if(!g||!Array.isArray(ids)||ids.length>g.limite||ids.some(id=>typeof id!=='string'||!g.conhecidas.some(m=>m.id===id))||new Set(ids).size!==ids.length)falha('Escolha somente magias conhecidas, dentro do limite.');
 if(ids.length!==Math.min(g.limite,g.conhecidas.length))falha('Complete a lista de preparação com as magias disponíveis.');
 const removidas=g.preparadas.filter(id=>!ids.includes(id)).length,adicionadas=ids.filter(id=>!g.preparadas.includes(id)).length;
 if(g.permissao==='fechada'&&(removidas||!adicionadas))falha('Trocas exigem um descanso longo ou Memorizar Magia.');
 if(g.permissao==='uma'&&removidas>1)falha('Após descanso curto, apenas uma troca.');
 return {...g,preparadas:ids.slice(),permissao:'fechada'};
}
function conjurar(g,id,circulo,mana){
 const m=g?.conhecidas.find(x=>x.id===id);
 if(!m||!g.preparadas.includes(id))falha('Prepare o feitiço no grimório antes de conjurá-lo.');
 if(!Number.isInteger(circulo)||circulo<m.circulo||circulo>g.max.length)falha('Círculo de conjuração inválido.');
 if(g.modo==='mana'){if(mana<circulo)falha('Mana insuficiente.');return {tipo:'magia',id,nome:m.nome,circulo,custo:circulo};}
 if(g.gastos[circulo-1]>=g.max[circulo-1])falha('Espaço de magia esgotado.');
 return {tipo:'magia',id,nome:m.nome,circulo,custo:0};
}
function descanso(g,tipo){if(!g)return;if(tipo==='longo'){g.gastos=g.max.map(()=>0);g.permissao='livre';}else if(tipo==='curto'&&g.nivel>=5&&g.permissao!=='livre')g.permissao='uma';}
function persistir(g){return g?{preparadas:g.preparadas,gastos:g.gastos,permissao:g.permissao}:null;}
module.exports={estado,preparar,conjurar,descanso,persistir,identificar};
