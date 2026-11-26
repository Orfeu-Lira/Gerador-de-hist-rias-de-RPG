'use strict';
const limites=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
const categorias=Object.freeze({interpretacao:15,pista:35,enigma:50,obstaculo:75,exploracao:75,combate:100,secundaria:200,principal:500});
const nomes={interpretacao:'Interpretação relevante',pista:'Pista descoberta',enigma:'Enigma resolvido',obstaculo:'Obstáculo superado',exploracao:'Exploração significativa',combate:'Combate concluído',secundaria:'Missão secundária',principal:'Missão principal',mestre:'Recompensa do mestre'};
function nivelDe(x){let n=1;for(let i=1;i<limites.length;i++)if(x>=limites[i])n=i+1;return n;}
function estado(p){if(!p)return null;const d=p.dados||{},dnd=d.edicao==='2024',n=Math.max(1,Math.min(20,Number(d.nivel)||1)),total=p.xp==null?(dnd?limites[n-1]:0):Number(p.xp);return {personagem:p.nome,total,nivel:dnd?nivelDe(total):null,proximo:dnd?(limites[nivelDe(total)]??null):null,base:dnd?limites[nivelDe(total)-1]:0,ativo:p.xp!=null};}
function sugestao(c,t,rolagem,teste){return t==='ajuste'||teste||rolagem?.passou===false||!Object.hasOwn(categorias,c)?null:c;}
async function conceder(client,{personagemId,usuarioId,origem,campanhaId,chave,categoria,quantidade}){
 const p=(await client.query('SELECT id,nome,dados,xp FROM public.personagens_dnd WHERE id=$1 AND usuario_id=$2 FOR UPDATE',[personagemId,usuarioId])).rows[0];if(!p)return null;
 const antes=estado(p),old=await client.query('SELECT 1 FROM public.mesa_xp_historico WHERE origem=$1 AND campanha_id=$2 AND chave=$3 AND personagem_id=$4',[origem,campanhaId,chave,personagemId]);if(old.rowCount)return {...antes,ganho:0,duplicado:true};
 const soma=(await client.query("SELECT COALESCE(sum(quantidade),0)::int AS total FROM public.mesa_xp_historico WHERE personagem_id=$1 AND origem=$2 AND criado_em>=now()-interval '24 hours'",[personagemId,origem])).rows[0].total;
 if(origem==='solo'){
 if(!Object.hasOwn(categorias,categoria))return {...antes,ganho:0};
 const recente=await client.query("SELECT 1 FROM public.mesa_xp_historico WHERE personagem_id=$1 AND origem='solo' AND campanha_id=$2 AND categoria=$3 AND CASE WHEN origem='solo' THEN chave::integer ELSE -1000 END >= $4::integer-3 LIMIT 1",[personagemId,campanhaId,categoria,chave]);if(recente.rowCount)return {...antes,ganho:0};
 quantidade=Math.min(categorias[categoria],1000-soma);
 }else if(origem==='multiplayer'){if(!Number.isInteger(quantidade)||quantidade<1||quantidade>1000)return {...antes,ganho:0};quantidade=Math.min(quantidade,3000-soma);}else return null;
 quantidade=Math.min(quantidade,(p.dados.edicao==='2024'?355000:1000000000)-antes.total);if(quantidade<=0)return {...antes,ganho:0};
 const total=antes.total+quantidade,nivel=p.dados.edicao==='2024'?nivelDe(total):null;
 await client.query('INSERT INTO public.mesa_xp_historico(personagem_id,origem,campanha_id,chave,categoria,quantidade) VALUES($1,$2,$3,$4,$5,$6)',[personagemId,origem,campanhaId,chave,categoria,quantidade]);
 const novo=(await client.query("UPDATE public.personagens_dnd SET xp=$2,dados=CASE WHEN $3::int IS NULL THEN dados ELSE jsonb_set(dados,'{nivel}',to_jsonb($3::int)) END,atualizado_em=now() WHERE id=$1 RETURNING id,nome,dados,xp",[personagemId,total,nivel])).rows[0];return {...estado(novo),ganho:quantidade,categoria:nomes[categoria],subiu:nivel!==null&&nivel>antes.nivel};
}
module.exports={limites,categorias,nomes,nivelDe,estado,sugestao,conceder};