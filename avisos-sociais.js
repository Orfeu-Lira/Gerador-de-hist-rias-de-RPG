'use strict';
// Identidade por ocorrência, não por pessoa/categoria. Novos convites/solicitações não herdam o descarte anterior.
const categorias=['solicitacoes','mensagens','fichas','convites','denuncias'];
const cte=`WITH amigos AS (
 SELECT CASE WHEN a=$1 THEN b ELSE a END AS pessoa,estado,solicitante,criado_em FROM public.mesa_amizades WHERE $1 IN(a,b)
), permitidos AS (
 SELECT a.* FROM amigos a JOIN public.usuarios v ON v.id=a.pessoa
 WHERE (v.bloqueado_ate IS NULL OR v.bloqueado_ate<=now()) AND NOT EXISTS(SELECT 1 FROM public.mesa_bloqueios b WHERE (b.autor=$1 AND b.alvo=a.pessoa) OR(b.alvo=$1 AND b.autor=a.pessoa))
), eventos AS (
 SELECT 'solicitacoes'::text AS categoria,'solicitacao:'||a.pessoa::text||':'||extract(epoch FROM a.criado_em)::text AS chave,p.apelido AS apelido FROM permitidos a JOIN public.mesa_perfis p ON p.usuario_id=a.pessoa WHERE a.estado='pendente' AND a.solicitante<>$1
 UNION ALL SELECT 'mensagens','mensagem:'||m.id::text,NULL FROM public.mesa_mensagens_privadas m JOIN permitidos a ON a.pessoa=m.remetente AND a.estado='aceita' WHERE m.destinatario=$1 AND m.lida_em IS NULL
 UNION ALL SELECT 'fichas','ficha:'||f.personagem_id::text||':'||extract(epoch FROM f.criado_em)::text,NULL FROM public.mesa_fichas_compartilhadas f JOIN public.personagens_dnd p ON p.id=f.personagem_id JOIN permitidos a ON a.pessoa=p.usuario_id AND a.estado='aceita' WHERE f.destinatario=$1 AND f.vista_em IS NULL
 UNION ALL SELECT 'convites','convite:'||m.campanha_id::text||':'||extract(epoch FROM m.convite_criado_em)::text,NULL FROM public.mesa_campanha_membros m JOIN public.mesa_campanhas_online c ON c.id=m.campanha_id JOIN permitidos a ON a.pessoa=c.mestre AND a.estado='aceita' WHERE m.usuario_id=$1 AND m.estado='convidado' AND NOT c.encerrada
 UNION ALL SELECT 'denuncias','denuncia:'||d.id::text,NULL FROM public.mesa_denuncias d WHERE $2::boolean AND d.estado='pendente'
), visiveis AS (
 SELECT e.* FROM eventos e WHERE NOT EXISTS(SELECT 1 FROM public.mesa_avisos_sociais_dispensados d WHERE d.usuario_id=$1 AND d.chave=e.chave)
)`;
const listar=cte+` SELECT
 count(*) FILTER(WHERE categoria='solicitacoes')::int AS solicitacoes,
 count(*) FILTER(WHERE categoria='mensagens')::int AS mensagens,
 count(*) FILTER(WHERE categoria='fichas')::int AS fichas,
 count(*) FILTER(WHERE categoria='convites')::int AS convites,
 count(*) FILTER(WHERE categoria='denuncias')::int AS denuncias,
 COALESCE(json_agg(apelido ORDER BY apelido) FILTER(WHERE categoria='solicitacoes'),'[]'::json) AS solicitantes
 FROM visiveis`;
const descartar=cte+` INSERT INTO public.mesa_avisos_sociais_dispensados(usuario_id,chave)
 SELECT $1,chave FROM visiveis WHERE ($3::text IS NULL OR categoria=$3)
 ON CONFLICT(usuario_id,chave) DO NOTHING`;
module.exports={categorias,listar,descartar};
