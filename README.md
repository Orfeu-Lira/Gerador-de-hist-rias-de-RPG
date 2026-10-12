# Mesa — servidor local

Gerador de histórias para RPG com login, limite de uso e painel do dono.
Roda só no seu computador (http://localhost:3000). Não tem pagamento nem hospedagem ainda.

## Como rodar

1. Instale o Node.js (versão 20.6 ou mais nova) em nodejs.org. Confira com `node -v`.
2. Abra esta pasta no VS Code e, no terminal, rode: `npm install`
3. Copie `.env.example` para `.env` e edite:
   - `SESSION_SECRET`: um texto longo e aleatório.
   - `ADMIN_EMAIL`: o e-mail que vai virar administrador.
   - `ANTHROPIC_API_KEY`: deixe vazio para usar uma aventura de exemplo (sem custo).
4. Rode: `npm start` e abra http://localhost:3000
5. Cadastre-se com o e-mail do `ADMIN_EMAIL`: essa conta vê o painel e não tem limite.

## O que cada arquivo faz (leia nesta ordem)

| Arquivo | Papel |
|---|---|
| `public/index.html` | A estrutura das telas |
| `public/style.css` | O visual |
| `public/app.js` | A lógica da tela (navegador) |
| `server.js` | As regras: login, limites, permissões |
| `ia.js` | A conversa com a IA (a chave fica aqui, no servidor) |
| `db.js` | As tabelas do banco SQLite (`mesa.db`, criado sozinho) |

## Regras de segurança já aplicadas

- Senha guardada só como hash (bcrypt). Erro de login genérico.
- Cookie de sessão `httpOnly` e `sameSite`; sessão trocada ao entrar.
- Consultas ao banco com parâmetros (contra SQL injection).
- Textos exibidos com `textContent` (contra XSS).
- Limites conferidos no servidor: 1 geração para visitante (por cookie e por IP), 5 por dia para usuário, sem limite para admin.
- Entradas validadas no servidor; limite de tentativas de login e de gerações por minuto; `helmet` para cabeçalhos de segurança.
- Cada usuário só vê e apaga as próprias aventuras.

## Exercícios para você aprender mexendo

1. Mude `LIMITE_USUARIO_DIA` em `server.js` e veja o contador da tela mudar.
2. Adicione um gênero novo (precisa mudar em `server.js` **e** em `public/app.js`; descubra por quê).
3. Em `style.css`, troque a cor `--lacre` e veja os botões mudarem.
4. Crie uma rota `GET /api/ola` em `server.js` que devolva `{ "mensagem": "olá" }` e abra no navegador.

## O que falta antes de ir para a internet

- Pagamento de assinatura (use um serviço pronto; nunca guarde cartão).
- Confirmar o e-mail no cadastro (hoje, na internet, qualquer um poderia se cadastrar com o `ADMIN_EMAIL` antes de você) e recuperar senha por e-mail.
- HTTPS e `secure: true` no cookie; guardar sessões em um armazenamento próprio (a memória é só para testes).
- Banco de produção (PostgreSQL, por exemplo) e cópias de segurança.
- Revisar termos de uso, privacidade e LGPD.
