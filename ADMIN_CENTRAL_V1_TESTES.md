# Central do Mestre — Administração v1 (Mesa)

## Status de entrega
Código em branch de revisão, **não publicado em produção**. A migração `supabase/006_central_admin.sql` **já foi aplicada com sucesso** ao projeto Supabase `raxcheouibmwmynwlqii` e as cinco tabelas novas tiveram RLS confirmado via consulta. Executar testes de permissão e dados antes do deploy. A migração é aditiva e não apaga usuários, fichas ou aventuras.

## Oito áreas
1. **Visão geral**: usuários, aventuras, personagens, aventuras do dia e chamados pendentes; série agregada de 14 dias.
2. **Usuários**: busca/paginação de 20 contas; papel, cadastro, último login, suspensão (1/7/30 dias) ou reativação. Não é possível suspender a própria conta ou contas administrativas. Sessões de usuário suspenso são invalidadas.
3. **Relatórios**: gráfico de atividade, ranking dos gêneros e CSV agregado. Não expõe aventuras privadas.
4. **Novidades**: criar, editar e publicar comunicados, exibidos na página pública de notícias.
5. **Conteúdos e tutorial**: publicar FAQs, exemplos e textos auxiliares no tutorial. Os dez passos principais permanecem fixos em app.js neste estágio; edições do conteúdo base precisarão de uma fase posterior.
6. **Suporte**: jogadores autenticados enviam e consultam seus chamados; administração classifica e responde. Limite de cinco mensagens por hora por IP.
7. **Configurações**: aviso público e modo manutenção, que bloqueia novas solicitações de geração de aventuras e do tutor no servidor com status 503. Não afeta login/consulta de fichas.
8. **Auditoria**: últimas 100 alterações administrativas de usuários, conteúdos, avisos, tickets e configuração. Não registra segredos ou senhas.

## Proteções
- Verificação do papel `admin` no servidor para cada rota `/api/admin`.
- `PATCH` passou a exigir origem autorizada, como POST/PUT/DELETE. Requisições não autorizadas recebem 403.
- SQL parametrizado; conteúdo remoto exibido com textContent; formulários limitam comprimento e enumerados.
- Tabelas privadas com RLS ativo e revogação de acesso direto de `anon`/`authenticated`. API usa PostgreSQL privado existente.
- Não há funcionalidade para alterar papel de admin, excluir contas, apagar histórias ou visualizar fichas de terceiros.

## Ordem de ativação
1. Revisar SQL e rotas no PR.
2. Migração `006_central_admin.sql` já aplicada e confirmada no Supabase atual. Não é necessário executá-la novamente neste projeto.
3. Validar colunas/tabelas por consultas somente leitura.
4. Testar via Preview: visitante e usuário devem receber 401/403 em rotas administrativas; admin deve acessar todas.
5. Testar busca, suspensão de uma conta de teste, encerramento da sessão e reativação; criar comunicado em rascunho e publicado; chamado e resposta.
6. Verificar que o modo manutenção impede gerador e tutor, mas permite login/consulta. Desativar manutenção ao terminar.
7. Executar smoke tests de gerador, dados, fichas, tutorial e música; só depois publicar na `main`.
8. Conferir build Vercel e logs. Em caso de falha, manter produção na versão anterior.

## Atenções para próxima fase
- Auditoria é registro de ações administrativas de aplicação (não coleta tentativas de login/IPs); logs de autenticação exigem projeto adicional.
- Logs de auditoria acompanham a alteração por inserção subsequente; para garantia transacional estrita, reunir mutação e log em uma única transação no futuro.
- A listagem administrativa é limitada a 100 publicações/chamados mais recentes para manter a UI ágil.
- Não há envio de e-mail automático sobre respostas aos chamados; o jogador vê respostas dentro do Mesa.
- O modo manutenção controla geração de IA e tutor; não bloqueia outras ações do aplicativo.
