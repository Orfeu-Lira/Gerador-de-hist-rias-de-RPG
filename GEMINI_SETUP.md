# Mesa — integração com Gemini

A integração Gemini está na branch `feature/gemini-integration`.

## Configuração
- Defina `GEMINI_API_KEY` **somente no ambiente do servidor**, nunca em arquivos publicados no GitHub Pages.
- Opcionalmente, defina `GEMINI_MODEL` (padrão: `gemini-2.5-flash`). Verifique disponibilidade e cota gratuita na sua conta Google AI Studio.
- Sem a variável `GEMINI_API_KEY`, o servidor retorna uma aventura de exemplo (MOCK).
- O servidor ainda exige `SESSION_SECRET` (mínimo de 32 caracteres), e em produção também `FRONTEND_ORIGIN` e `ADMIN_BOOTSTRAP_TOKEN` (mínimo de 32 caracteres quando não há administrador).
- O frontend continua usando `config.js` com `apiBaseUrl` vazio até existir uma URL HTTPS real do backend.

## Hospedagem
O arquivo `render.yaml` original usa um disco persistente e plano pago. **Esta branch ainda não modifica a hospedagem.** O banco SQLite atual guarda usuários, sessões e aventuras em disco. Hospedagens efêmeras podem apagar esses dados; não use cadastro real sem armazenamento persistente.

## Próximos passos
1. Escolher hospedagem de backend e armazenamento persistente apropriados.
2. Configurar variáveis de ambiente secretas no provedor.
3. Testar geração e erros da API Gemini.
4. Preencher `config.js` com a URL HTTPS real e testar CORS/cookies entre domínios.
