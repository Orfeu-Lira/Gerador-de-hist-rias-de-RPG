# Mesa — Plano operacional de segurança, privacidade e incidentes

**Status:** guia interno inicial, não é certificação, contrato, parecer jurídico, garantia de disponibilidade nem compromisso de prazo de resposta. Atualizar ao modificar fornecedores ou recursos. Contato público: matheusrenner323@gmail.com.

## 1. Inventário de processamento e finalidades (LGPD)
| Categoria | Por que existe | Local de processamento conhecido | Exclusão |
| --- | --- | --- | --- |
| Conta: e-mail, hash bcrypt de senha, sessão | Login e segurança | PostgreSQL/Supabase, backend Vercel | Nova rota autenticada de exclusão; sessões invalidadas |
| Prompts, histórias e NPCs | Gerar e salvar aventuras | Banco Supabase, envio para API Gemini quando solicitado | Conteúdo atrelado à conta é removido com ela |
| Fichas, avatares, campanhas e mensagens | Funcionalidades escolhidas | Supabase PostgreSQL/Storage, Gemini para narração | Dados em banco excluídos por cascata; arquivos no Storage têm limpeza por tentativa e suporte para pendências |
| Suporte e auditoria administrativa | Atendimento, operação e segurança | Supabase e registros técnicos da hospedagem | Chamados vinculados à conta excluídos; auditoria administrativa exige análise específica |
| Controles de uso, registros técnicos | Mitigação de abusos, diagnóstico | PostgreSQL/Vercel | Têm prazos próprios a definir; índices/HMAC não representam anonimização irreversível |
| Recursos externos: fontes, áudio, vídeo YouTube | Exibição solicitada | Fornecedores externos | O Mesa não controla a retenção desses fornecedores |

**Bases legais específicas ainda devem ser avaliadas pelo responsável jurídico.** Não afirmar que todas as atividades dependem de consentimento; nem usar o aviso de cookies essenciais como consentimento para tecnologias opcionais. Se analytics/publicidade forem ativados no futuro, rever finalidade, transparência, base legal e escolhas antes da implantação.

## 2. Retenção — política em elaboração
Os prazos concretos de logs técnicos, cópias de segurança e retenções exigidas por lei **ainda não foram fixados**. Não prometer eliminação imediata em backups ou em provedores externos. A exclusão da conta remove registros associados no banco transacional; imagens no Storage são excluídas por tentativa, e possíveis falhas devem ser acompanhadas pelo suporte. Reavaliar retenções para sessões expiradas, redefinição de senha, identificadores de quota, registros de segurança, chamados e conteúdo de jogadores. Registrar decisão, justificativa e data antes de habilitar uma rotina destrutiva em produção.

## 3. Gestão de incidentes
1. **Identificar:** alerta de erro, acesso não autorizado, exposição de credencial, abuso, indisponibilidade, conteúdo de conta acessível por outra conta. Anotar horário, natureza, endpoints e evidência mínima, sem copiar dados pessoais desnecessários.
2. **Conter:** pausar geração ou rota afetada, reduzir permissões, revogar token e bloquear credenciais comprometidas. Evitar alterações destrutivas de dados para esconder o incidente.
3. **Investigar:** analisar logs de Vercel/Supabase e auditorias de administração com acesso restrito, correlacionar horário e versão do deploy; não salvar senhas ou tokens em tickets.
4. **Corrigir:** fazer alterações no backend, validação, regras de acesso ou banco, revisar com outro colaborador e testar com duas contas fictícias.
5. **Restaurar:** usar procedimento de rollback da Vercel e, se necessário, restauração do banco apenas após verificar o impacto e a consistência. Não restaurar dados pessoais excluídos sem análise adequada.
6. **Avaliar comunicação:** registrar natureza do incidente, riscos aos titulares, categorias e volume aproximado, medidas adotadas; consultar orientação atual da ANPD e assessoria jurídica para decidir notificações e prazos. Não inventar janela universal.
7. **Revisar:** documentar causa, medida preventiva, teste de regressão, responsável e data.

Contato externo: matheusrenner323@gmail.com. Não há telefone 24h, encarregado formalmente designado ou acordo de nível de serviço confirmado; não declarar o contrário.

## 4. Backups e restauração
O banco usa Supabase. **A existência, frequência, retenção e capacidade de restauração de backups automatizados ainda não foram verificadas no painel do projeto.** Não confundir migrações SQL versionadas com cópias dos dados. Ações necessárias:
- Verificar no Supabase plano ativo, política de backups, possibilidade de PITR, retenção e permissões.
- Definir cópias criptografadas, guarda por prazo mínimo necessário, restrição de acesso e uma restauração de teste em ambiente separado.
- Garantir que segredos, backups e arquivos com dados pessoais nunca sejam adicionados ao repositório GitHub.
- Registrar os resultados dos ensaios de restauração, inclusive recuperação de avatares e efeito das exclusões da conta.

## 5. Operadores, contratos, marcas e cobrança
- Supabase, Vercel, Google Gemini e provedores de mídia: identificar documentos contratuais/DPA aplicáveis, políticas de dados e transferências, sem declarar assinatura de contratos não verificados.
- Revisar licenças de músicas, conteúdo de D&D e bibliotecas do projeto. Manter créditos e preferir conteúdo original ou licenciado.
- O Mesa está apresentado como **gratuito**; cobrança, preços, plano de assinatura, cancelamento e reembolso são inaplicáveis **enquanto não houver comercialização**. Antes de ativar pagamentos, especificar valores finais, impostos, cancelamento, renovação, política legalmente adequada e fornecedor de pagamentos.
- Revisar identificação verdadeira do fornecedor/controlador, inclusive se há inscrição empresarial aplicável. Não publicar CNPJ, endereço ou identificação inventados.
- Nunca publicar depoimentos, resultados ou alegações de segurança/compliance sem base verificável.

## 6. Auditorias e manutenção
- GitHub Actions: revisão semanal de dependências de produção e verificações estáticas, além de execução em push e PR.
- Corrigir vulnerabilidades com base no impacto e testar antes de atualizar dependências em produção.
- Proteger contas de administração com autenticação forte, acesso mínimo e, quando disponível, MFA nas contas **dos provedores** GitHub, Vercel e Supabase. MFA do usuário final no Mesa ainda não foi implementado.
- Controlar mudanças no código, reduzir acesso direto à branch principal, revisar PR e registrar deploys.
- Não existe pentest independente, backup validado, SLA de incidentes ou auditoria jurídica concluída. Manter estes itens marcados como pendentes.

## 7. Exercícios de validação
- Verificar sem login que API de aventuras, fichas, NPCs, campanhas e exportação retorna 401.
- Com duas contas fictícias, tentar acessar ou excluir objetos cruzados por ID.
- Exercitar solicitação de exportação, exclusão de conta fictícia e limpeza de avatar, incluindo falhas de Storage.
- Testar rate limits sem gerar bloqueios em usuários reais.
- Medir erros e latência em preview **com banco isolado**, sem carga elevada em produção.
- Repetir auditoria após inclusão de um novo provedor, forma de pagamento ou recurso de IA.
