# Mesa — Recuperação de senha, tutorial de dados e próximas etapas

## O que já existe nesta branch
- Interface de recuperação ("Esqueceu sua senha?") e redefinição via link.
- Endpoints `POST /api/senha/solicitar` e `POST /api/senha/redefinir`.
- Tokens aleatórios, armazenados apenas como SHA-256, uso único e validade de 20 minutos.
- Em caso de redefinição bem-sucedida, sessões existentes são removidas.
- Mensagem genérica ao solicitar recuperação, para não revelar se um e-mail possui conta.
- Dicas de criação de senhas e explicação do token inicial de administrador.
- Navegação lateral (desktop) e tutorial ilustrado dos dados, com explicações de d4, d6, d8, d10, d12, d20 e um exemplo de teste.

## Necessário ANTES de habilitar a recuperação
1. Supabase > SQL Editor: executar `supabase/003_recuperacao_senha.sql` **uma única vez**, no projeto correspondente.
2. Configurar uma conta em um serviço de envio de e-mail compatível com o endpoint Resend. Verificar seu domínio de remetente conforme as exigências do provedor. Nunca inserir as chaves no GitHub.
3. Vercel > Environment Variables (primeiro em Preview):
   - `RESEND_API_KEY`: chave secreta de envio.
   - `RESET_EMAIL_FROM`: remetente autorizado, por exemplo `Mesa <contato@dominio-verificado.exemplo>` (ilustrativo).
   - `PASSWORD_RESET_URL`: endereço HTTPS da página Mesa, sem parâmetros, que receberá `?reset_token=...`.
4. Fazer novo deploy de Preview, testar com uma conta **de teste** e validar que o link expira, não pode ser reutilizado e invalida sessões anteriores.
5. Somente após testes completos, ativar em Production.

## Segurança e limites
- Nunca mostrar dicas personalizadas que possam revelar a senha real.
- O token administrativo é EXCLUSIVAMENTE para criar a primeira conta administradora; jogadores comuns deixam em branco.
- Os limites de requisição usam memória por instância e devem evoluir para armazenamento compartilhado antes de uso em grande escala. Também é recomendável incluir defesa contra abuso por e-mail.
- A implementação ainda **não foi validada em produção**. Se e-mail não estiver configurado, retorna 503 em vez de alegar que enviou algo.
- Evite compartilhar links de recuperação em prints ou conversas; eles dão acesso à redefinição de senha.

## Planejamento: fichas e pontos de D&D
Aguarda definição da edição (D&D 5e 2014 ou regras revisadas 2024) para evitar aplicar cálculos, espécies, antecedentes, talentos e criação de personagem incompatíveis.
Após definição: projetar esquema de dados; construir CRUD de fichas associadas a usuário; atributos e modificadores; HP/CA; perícias, proficiências, recursos, condições e descansos; regras de distribuição de atributos (incluindo point buy de 27 pontos se escolhido) e assistente educacional com explicações verificadas.
O assistente de IA não deverá inventar regras oficiais: informar edição, distinguir regra de sugestão e citar fonte/referência quando houver.
