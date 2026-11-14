# Mesa — auditoria dos 40 requisitos do vídeo (14/11/2026)

**Origem:** vídeo enviado pelo usuário `461242.mp4`, com lista de "40 requisitos para seu app feito com IA não ser processado". A lista foi extraída da tela do vídeo. **O título do vídeo não corresponde a uma certificação jurídica.** Nenhum conjunto de controles evita todos os ataques ou processos.

Legenda:
- **Já existia:** foi verificada implementação no código/banco; não significa que passou em pentest.
- **Reforçado:** recebeu código, interface ou procedimento novo nesta etapa.
- **Parcial/pendente:** faltam evidências, decisões do responsável ou serviços externos.
- **Inaplicável agora:** o Mesa é gratuito e não possui cobrança própria.

| # | Requisito do vídeo | Estado no Mesa | Evidência / pendência |
|---|---|---|---|
| 1 | Autenticação segura | Já existia | Senha autenticada no backend, sessão no PostgreSQL e cookie HttpOnly; MFA para o usuário final não implementado |
| 2 | Controle de acesso | Já existia | Regras de propriedade nas rotas e acesso admin verificado no servidor; testar duas contas fictícias |
| 3 | Criptografia de dados | Parcial | Trânsito HTTPS e PostgreSQL TLS com verificação de certificado; criptografia em repouso do fornecedor precisa ser conferida |
| 4 | HTTPS/TLS | Já existia | Produção em HTTPS, banco PostgreSQL com TLS; testes dinâmicos de certificados pendentes |
| 5 | Hashing de senhas | Já existia | Hash bcrypt com custo 12 |
| 6 | SQL injection | Já existia | Consultas SQL parametrizadas; sem garantia absoluta contra vulnerabilidades futuras |
| 7 | XSS/CSRF | Já existia/parcial | DOM utiliza textContent para entradas; Helmet/CSP e Origin checks no servidor; testes dinâmicos e revisão após alterações |
| 8 | Rate limiting | Já existia | Limites persistentes de login, cadastro e recuperação; adicionado limite de exclusão de conta |
| 9 | Proteção de APIs | Já existia | CORS/origens permitidas, sessão, autorização, limites de payload; revisar endpoints novos |
| 10 | Auditoria de dependências | **Reforçado** | Workflow de GitHub Actions em push, PR e toda segunda-feira, executando npm audit e verificação estática; alertas ainda precisam ser acompanhados |
| 11 | Política de privacidade | Já existia/atualizada | Página pública, revista com informação sobre IA e fornecedores; revisão jurídica ainda pendente |
| 12 | Bases legais | Pendente | O responsável deve definir e documentar a base legal de cada operação; não afirmar que há consentimento universal |
| 13 | Minimização de dados | Já existia/parcial | Conta pede e-mail e senha; instrução de não enviar dados sensíveis; revisão sistemática de logs e retenção pendente |
| 14 | Finalidades documentadas | **Reforçado** | Política pública e inventário inicial de tratamento em PLANO_PRIVACIDADE_INCIDENTES_MESA.md |
| 15 | Gestão de consentimento | Parcial | Aceite de Termos no cadastro; cookies essenciais são informativos. Consentimentos opcionais/revogáveis serão necessários caso recursos dependentes de consentimento sejam adicionados |
| 16 | Política de cookies | Já existia | Aviso público de sessão e preferências locais; revisar se fornecedores externos passam a instalar tecnologias opcionais |
| 17 | Direitos dos titulares | Já existia | Exportação JSON e canal de suporte LGPD |
| 18 | Exclusão de dados | **Reforçado** | Nova exclusão da própria conta mediante senha e confirmação. Remove registros ligados à conta no PostgreSQL, invalida sessões e tenta limpar avatares. Cópias de segurança e arquivos não removidos exigem processo específico |
| 19 | Retenção de dados | Parcial | Plano de retenção e lacunas documentados; prazos finais ainda não aprovados; não prometer eliminação integral imediata |
| 20 | Contratos com operadores | Pendente | Conferir DPA/contratos, jurisdição e transferências de Vercel, Supabase, Google Gemini e terceiros. Nenhum contrato foi assinado nesta revisão |
| 21 | Termos de uso | Já existia | Página pública; revisão jurídica pendente |
| 22 | Transparência de preços | Inaplicável agora | Não há planos pagos no Mesa; publicar valores e tributos antes de futura monetização |
| 23 | Cobranças transparentes | Inaplicável agora | Não há cobrança no aplicativo |
| 24 | Cancelamento de assinaturas | Inaplicável agora | Não há assinaturas no aplicativo |
| 25 | Política de reembolso | Inaplicável agora | Não há venda própria; preparar política se iniciar comércio |
| 26 | Identificação do fornecedor | Parcial | E-mail público já publicado; identificação legal completa do responsável ainda depende de dados confirmados |
| 27 | Publicidade transparente | Inaplicável no momento | Sem anúncios próprios identificados no código revisado; futuras publicidades deverão ser rotuladas e revisadas |
| 28 | Depoimentos autênticos | Regra editorial | Não publicar avaliações ou depoimentos inventados; verificar materiais existentes antes de campanha publicitária |
| 29 | Licenças de uso | Parcial | Créditos e links de músicas, uso do player oficial para Frieren; auditoria de todas as obras e efeitos sonoros pendente |
| 30 | Transparência sobre IA | **Reforçado** | Política explica solicitações ao Gemini, respostas automatizadas, possíveis erros e alerta contra envio de dados pessoais |
| 31 | Backups automatizados | **Não verificado** | Não ativados por esta revisão. Confirmar no painel do Supabase frequência, retenção, criptografia, PITR e testar restauração. Não usar GitHub público como backup de dados pessoais |
| 32 | Logs seguros | **Reforçado** | Middleware genérico de erro passou a registrar apenas código/nome, sem texto de consultas/valores privados. Revisar retenção e acesso aos logs de provedores |
| 33 | Monitoramento de ameaças | Parcial | Logs operacionais disponíveis; alertas, detecção e plantão ainda precisam de configuração/validação |
| 34 | Resposta a incidentes | **Reforçado** | Procedimento inicial de identificação, contenção, investigação, correção, recuperação e revisão documentado |
| 35 | Notificação de incidentes | **Reforçado em procedimento** | Manual descreve avaliação de comunicação à ANPD/titulares e consulta jurídica; rotina real ainda não exercitada |
| 36 | Testes de segurança | **Reforçado** | Smoke test anônimo e verificação estática no repositório; testes autenticados de ponta a ponta e pentest independentes pendentes |
| 37 | Revisão de código | **Reforçado** | Workflow de verificações automáticas; revisão humana por PR/branch protection ainda não confirmada |
| 38 | Privilégios administrativos | Já existia/parcial | Permissões admin verificadas em middleware e exclusão pública desabilitada para admin; MFA e auditoria de provedores pendentes |
| 39 | Gestão de vulnerabilidades | **Reforçado** | SECURITY.md, auditoria recorrente de dependências e procedimento de triagem; prazos e responsável operacional a definir |
| 40 | Auditoria de conformidade | **Auditoria inicial criada** | Este documento e plano operacional; auditoria externa, laudo jurídico e comprovação de controles ainda não realizados |

## Correções desta etapa
1. Rota de exclusão de conta com autenticação, senha, confirmação, rate limit e exclusão em cascata; remove também contadores de quota vinculados.
2. Interface na Política de Privacidade para exclusão da conta e aviso explícito sobre irreversibilidade e limites de armazenamento.
3. Logs internos do middleware 500 passaram a omitir mensagens de erro com possível conteúdo confidencial.
4. GitHub Actions adicionou revisão semanal de dependências e verificações estáticas de código.
5. Política de Privacidade revisada para esclarecer uso de IA e fornecedores.
6. Plano de resposta a incidentes, mapa de tratamento e backup/restauração registrados.

## Validação e limitações
Foram feitas inspeção estática de JavaScript, de HTML/CSS e verificação da estrutura de chaves estrangeiras no Supabase. O código foi publicado na branch main. **A nova exclusão deve ser testada primeiro com conta fictícia e avatar fictício**; não apagar contas de usuários reais para testar.

**Não foram concluídos:** pentest, auditoria jurídica, validação da recuperação de backup, verificação de contratos de fornecedores, configuração de alertas 24/7, testes reais com duas contas, revisão histórica completa de segredos no Git, controle de MFA próprio nem confirmação da execução bem-sucedida do workflow semanal.

Uma plataforma nunca fica “à prova de processos” apenas por seguir uma lista. Segurança e conformidade exigem revisão contínua, políticas verdadeiras e resposta efetiva a incidentes.
