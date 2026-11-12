# Auditoria de segurança — 21 pontos do vídeo (12/11/2026)

**Escopo:** código do Mesa na branch main; configurações observáveis do Vercel e do Supabase; inspeção estática da aplicação; verificação SQL de grants e RLS. **Isto não é um pentest, um laudo jurídico, um teste autenticado completo nem garantia contra invasões, vazamentos ou processos judiciais.**

Legenda: **Atendido (verificado)** = evidência no código/banco; **Reforçado** = alteração nesta revisão; **Parcial** = há proteção, mas faltam testes ou decisões; **Pendente** = precisa de ação adicional.

| Nº | Ponto do vídeo | Situação | Evidências e pendências |
|---|---|---|---|
| 1 | Chave de API protegida | Atendido (código) | Chave Gemini e serviço Supabase são usados no backend, via variáveis de ambiente. Confirmar permissões de contas de terceiros e rotação em caso de exposição. |
| 2 | Nunca expor .env | Atendido na árvore atual | .gitignore protege .env e derivados; apenas .env.example contém valores vazios. O histórico Git não foi exaustivamente examinado. |
| 3 | Nenhuma senha no código | Parcial | Senhas de usuários ficam como hash bcrypt; conexões e chaves vêm de ambiente. Não foi realizada verificação histórica de todos os commits e serviços externos. |
| 4 | Login real | Atendido (código) | Login no servidor com bcrypt, sessão persistida no PostgreSQL, cookie httpOnly e regeneração de sessão. Falta teste autenticado de ponta a ponta. |
| 5 | Permissão no servidor | Atendido (código) | Middleware admin e verificações de dono de aventuras, NPCs, fichas e campanhas. Precisa teste cruzado com duas contas de teste. |
| 6 | Não confiar no ID da tela | Atendido (código) | IDs recebidos são validados e combinados com usuario_id da sessão; não confiar em dados do navegador para autorização. |
| 7 | Cada usuário só vê o seu | Parcial | Rotas consultadas possuem filtros de propriedade. Ainda não houve teste dinâmico entre duas contas independentes. |
| 8 | Banco travado | Atendido (verificado) | Todas as tabelas de aplicação examinadas estão com RLS ativo e sem SELECT/INSERT/UPDATE/DELETE para anon/authenticated. Consulta da estrutura e das permissões realizada no banco. |
| 9 | Firebase, Supabase e Storage | Atendido (verificado) | Usa Supabase, sem Firebase. Bucket mesa-avatares privado, permite WebP e impõe limite de tamanho. Upload do backend ganhou validação do contêiner RIFF. |
| 10 | Admin protegido | Atendido (código) | Endpoints /api/admin passam por autenticação e verificação de papel no servidor. Verificar periodicamente delegações e acessos. |
| 11 | Debug desligado | Parcial | Erros de cliente são genéricos e não há dump de variáveis de ambiente em respostas. Logs internos continuam para diagnóstico; revisar sua retenção e acesso. |
| 12 | Erro sem detalhes | Atendido (código) | Middleware de erro retorna mensagem genérica em HTTP 500. Não confundir com silêncio absoluto dos logs internos. |
| 13 | Validar tudo no servidor | Parcial | Validação de IDs, gêneros, tamanhos, tipos, permissões e uploads. Novas rotas exigem revisão; não existe garantia universal. |
| 14 | Limpar o que o usuário manda | Atendido parcialmente | Frontend usa textContent e criação segura de elementos, sem innerHTML para conteúdo de usuário; texto e campos são limitados no backend. Auditar continuamente prompt injection e conteúdo gerado. |
| 15 | Upload protegido | Reforçado | WebP, tamanho, assinatura RIFF e primeiro bloco válido; autorização do dono e bucket privado. Antivírus/transcodificação no servidor ainda não instalados. |
| 16 | Sem SQL injection | Atendido (código revisado) | Queries com parâmetros e sem concatenação observada de entrada do usuário em texto SQL. Revisão estática não é prova formal. |
| 17 | Limite de tentativas | **Reforçado** | Nova tabela privada mesa_rate_limits; bloqueios persistentes para cadastro (5/30min por IP), login (20/15min por IP e 8/15min por e-mail) e recuperação (5/15min por IP). Contagem atômica; IP/e-mail transformados em HMAC. |
| 18 | Git sem senha vazada | Parcial | Árvore main atual sem .env real, chave óbvia ou certificado nos arquivos examinados. Não houve busca histórica completa nem verificação de alertas secretos do GitHub. |
| 19 | Headers e CORS certos | **Reforçado** | Vercel: CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP. Backend verifica Origin e usa Cache-Control no-store para API. É preciso teste em navegador para compatibilidade do CSP. |
| 20 | Testar como estranho | Parcial | Criado tests/security-smoke.mjs para conferir GETs privados sem sessão, CORS malicioso e headers, sem afetar contas. **Não executado contra o site em produção**: ambiente desta auditoria sem conexão DNS de saída. |
| 21 | Auditoria com IA | **Parcial** | Código, banco, Storage, estrutura do repositório e deploy revisados; análise e evidências registradas. Faltam pentest independente, auditoria de dependências, testes com duas contas, políticas de retenção e revisão legal. |

## Correção adicional: recuperação de senha
Durante a auditoria descobrimos que public.redefinicoes_senha, exigida pelo código da recuperação por e-mail, **não existia na produção**. A tabela foi criada com tokens **somente em forma de hash**, expiração, FK para usuários, RLS e nenhum grant direto de usuários externos. A estrutura foi confirmada; o fluxo real de entrega e consumo de e-mail ainda não foi testado.

## Avaliação automatizada do Supabase
O consultor de segurança identificou somente o aviso informativo **RLS Enabled No Policy** para 18 tabelas. Nesse projeto, o modelo é deliberadamente **backend-only**: clientes anon/authenticated não têm grants de tabela, e os dados são fornecidos apenas após autenticação/autorização do servidor. Não criar políticas públicas para suprimir o aviso; manter a arquitetura restritiva. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## O que foi testado
- Sintaxe dos arquivos JavaScript alterados durante a revisão.
- Consulta direta ao Supabase para confirmar RLS e grants das tabelas.
- Contagem atômica de rate-limit executada em transação SQL revertida.
- Configuração do Vercel consultada para verificar estado de deployment READY.
- Inspeção de caminhos do repositório principal e arquivos de configuração.
  
**Não testado:** navegação autenticada real; leitura de conteúdo sob duas contas distintas; ataques reais; reprodução de problemas de segurança em terceiros; funcionamento integral do envio de e-mail; headers via resposta HTTP de cliente real; compatibilidade de todos os navegadores com CSP.

## Pendências prioritárias
1. Executar smoke test: `MESA_BASE_URL=https://historiasrpg.vercel.app node tests/security-smoke.mjs` em ambiente com internet, sem credenciais.
2. Testar com duas contas fictícias: usuário A não pode ler, editar ou excluir recursos do usuário B, inclusive tentando alterar IDs em requisições.
3. Revisar e atualizar dependências e habilitar alertas de dependência e secret scanning no GitHub, verificando todo o histórico de commits.
4. Verificar a configuração de produção das chaves, acesso ao Vercel/Supabase/GitHub e rotacionar imediatamente qualquer segredo historicamente exposto.
5. Concluir política de retenção/exclusão de dados e revisão jurídica por profissional especializado em privacidade, copyright e termos de serviço.
6. Fazer testes de CSP/headers e acessibilidade em navegadores reais, incluindo o PWA Android.
7. Definir monitoração de incidentes, backups, testes de restauração e processo de resposta/aviso a titulares conforme a legislação aplicável.

## Limites e riscos
Nenhuma lista de 21 itens garante que um site não seja processado. A proteção do código-fonte **não significa esconder JavaScript enviado ao navegador**: esse código é visível para usuários. A proteção real das chaves e dados deve ocorrer no backend, nas permissões e no banco de dados.

Contribuições de terceiros, licenças de mídia, dados pessoais, consentimento, retenção e obrigações legais exigem acompanhamento contínuo. O responsável deve verificar essas condições com assessoria adequada antes de qualquer declaração de conformidade integral.
