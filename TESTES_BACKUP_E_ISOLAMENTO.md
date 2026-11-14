# Mesa — verificação de backups e teste de isolamento (14/11/2026)

## Resultado que foi possível confirmar

- Projeto Supabase de produção: estado `ACTIVE_HEALTHY`; **não prova backup**.
- Ramificações de banco disponíveis: nenhuma (`branches: []`).
- Ambientes personalizados do projeto Vercel: nenhum.
- Estrutura RLS: as 11 tabelas sensíveis revisadas estão com RLS ligado e **sem SELECT/INSERT direto** para os papéis `anon` e `authenticated`.
- Bucket de avatares `mesa-avatares`: privado e limitado a 384 KiB.
- Chaves estrangeiras: conteúdos do usuário usam `ON DELETE CASCADE`, exceto auditoria administrativa `ON DELETE SET NULL`. Existem também registros técnicos de sessão/limite de uso removidos pela rotina da aplicação.
- Fluxo de exclusão: auditado estaticamente, **ainda não executado usando uma conta fictícia**.
- Disponibilidade e retenção de backups automáticos: **NÃO VERIFICADAS**; ferramentas atualmente conectadas não expõem a tela de backups ou permitem baixar/restaurar um backup.

## Ambiente de testes isolado

A cotação atual para uma branch de Supabase foi **US$ 0,01344 por hora**, apenas computação base. Isso representa aproximadamente **US$ 9,68 para 30 dias contínuos** (720 h), **antes de armazenamento, egress e outros consumos**. Consultar custo real de branch/plano e obter autorização explícita antes de criar. Nenhuma branch paga foi criada nesta etapa. Uma branch pode possuir recursos próprios, mas **Preview da Vercel não basta por si só**: confirmar variáveis `DATABASE_URL`, `SUPABASE_URL` e chaves somente de homologação antes de executar ações com dados.

## Etapas para verificar backup real

1. Abrir `Supabase Dashboard → Database → Backups` e verificar se existem backups, datas, retenção e possibilidade de restauração. O painel é a fonte de verdade para o projeto atual.
2. Em projetos Free, não presumir backup automático. Em planos pagos, verificar política real de backups; consultar [documentação oficial](https://supabase.com/docs/guides/platform/backups).
3. Se houver arquivo lógico de backup acessível, conferir localmente seu catálogo sem enviá-lo ao GitHub:
   `bash tests/verify-backup-archive.sh /caminho/backup-mesa.dump`
4. Criar **banco NOVO, vazio e isolado**; restaurar o backup somente nesse banco. Validar tabelas, registros fictícios, referências, políticas RLS, funcionalidades de login e acesso à Storage quando aplicável. Nenhuma ferramenta conectada executou esta etapa.
5. Conferir que nenhuma restauração recoloca acidentalmente em produção dados de contas previamente excluídas.
6. Documentar horário, duração, falhas e resultado. Backups de banco não necessariamente incluem objetos do Storage, configurações externas e segredos; avaliar proteção separada.

## Teste de segurança real com duas contas

O arquivo `tests/security-two-accounts.mjs` realiza requisições autenticadas de **somente leitura**, sem apagar nem criar recursos. Precisa de:
- URL HTTPS de deployment de homologação Vercel;
- banco isolado confirmado (`MESA_STAGING_DB_ISOLATED=yes`);
- contas de teste A e B com senhas passadas apenas por variáveis de ambiente;
- uma campanha fictícia salva por cada conta (`MESA_TEST_A_CAMPAIGN_ID` e `MESA_TEST_B_CAMPAIGN_ID`).

O teste verifica:
- visitante sem sessão recebe 401 ao consultar campanha;
- cada conta reconhece a própria sessão;
- cada titular recebe 200 ao consultar sua campanha;
- a outra conta recebe 404 ao tentar acessar campanha alheia;
- exportação e histórico de aventuras exigem sessão própria;
- respostas privadas trazem `Cache-Control: no-store`.

Exemplo (não preencher credenciais em arquivo público):
```bash
MESA_STAGING_URL=https://SEU-PREVIEW-ISOLADO.vercel.app \
MESA_STAGING_DB_ISOLATED=yes \
MESA_TEST_A_EMAIL='usuario-a@exemplo.test' MESA_TEST_A_PASSWORD='senha-do-teste-A' MESA_TEST_A_CAMPAIGN_ID=101 \
MESA_TEST_B_EMAIL='usuario-b@exemplo.test' MESA_TEST_B_PASSWORD='senha-do-teste-B' MESA_TEST_B_CAMPAIGN_ID=102 \
node tests/security-two-accounts.mjs
```

**Não executar esse script na produção.** Após criar um banco isolado, criar os dois usuários via interface de homologação e preparar duas campanhas fictícias; não usar dados reais do banco de produção como fixtures.

## O que NÃO está concluído

- Confirmação do plano atual do Supabase e da existência de backup automático.
- Download de backup e restauração controlada bem-sucedida.
- Duas contas de teste efetivamente criadas e testadas em ambiente separado.
- Teste de remoção de uma conta fictícia, incluindo avatar.
- Relatório de testes de recuperação do PWA e fluxos reais de usuário.

A publicação de ferramentas/testes não equivale à execução e aprovação desses ensaios.
