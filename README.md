# Mesa — gerador de histórias para RPG

O frontend estático é publicado no GitHub Pages e a API Node.js roda separadamente no Render. O SQLite e as sessões ficam no disco persistente do serviço Render.

## Publicação do backend no Render

1. Envie esta versão do repositório ao GitHub. O `.env` local não deve ser enviado; ele foi removido do índice do Git e está ignorado. A remoção não apaga valores do histórico público anterior: trate qualquer chave que já esteve nele como comprometida.
2. No Render, crie um serviço usando **New > Blueprint** e selecione este repositório. O `render.yaml` define o serviço Node `mesa-rpg-api`, o comando `npm ci`, o comando `npm start`, Node 22 e um disco persistente de 1 GB montado em `/var/data`.
3. O Blueprint configura `NODE_ENV=production`, `FRONTEND_ORIGIN=https://orfeu-lira.github.io`, `DATABASE_PATH=/var/data/mesa.db` e gera valores secretos para `SESSION_SECRET` e `ADMIN_BOOTSTRAP_TOKEN`. Não substitua os segredos por valores fracos nem os coloque no repositório.
4. Aguarde o primeiro deploy do Render e copie o hostname HTTPS que ele atribuir ao serviço. O formato será `https://<NOME-DO-SERVICO>.onrender.com`; o nome/URL real só existe depois que o serviço for criado. Não inclua caminho nem barra final ao preencher a configuração do frontend.
5. Se quiser geração por IA, defina `ANTHROPIC_API_KEY` como variável **secreta** no serviço Render usando uma chave nova. `ANTHROPIC_MODEL` é opcional. Sem chave de IA a API usa a aventura de exemplo.

O caminho persistente do banco é controlado por `DATABASE_PATH`; o Blueprint aponta para `/var/data/mesa.db`. As sessões também são armazenadas nessa mesma base SQLite e o cookie dura sete dias. Não remova, recrie nem mude o disco montado em `/var/data` se quiser manter contas, aventuras e sessões. O plano indicado no Blueprint é pago porque discos persistentes não estão disponíveis em todos os planos. SQLite com um único disco é apropriado para uma instância do serviço; não escale horizontalmente para múltiplas instâncias.

## Publicação do frontend no GitHub Pages

1. No repositório GitHub, abra **Settings > Pages** e selecione **GitHub Actions** como origem da publicação.
2. Edite `config.js` no repositório: substitua o valor vazio de `apiBaseUrl` pela URL HTTPS real do Render obtida no passo anterior, por exemplo no formato `https://<NOME-DO-SERVICO>.onrender.com`. Não use essa expressão entre sinais de menor/maior literalmente: preencha o hostname que o Render criou.
3. Envie essa alteração para `main`. O workflow `.github/workflows/pages.yml` publica somente `index.html`, `style.css`, `app.js` e `config.js`, mantendo o site no endereço de project site `https://orfeu-lira.github.io/Gerador-de-hist-rias-de-RPG/`.
4. O Pages usa o caminho relativo `./` para seus recursos, então funciona sob o prefixo `/Gerador-de-hist-rias-de-RPG/`. A origem CORS, por outro lado, não contém o caminho: é exatamente `https://orfeu-lira.github.io`, já definida em `FRONTEND_ORIGIN`.

Se o hostname do Render mudar, atualize `config.js` e publique o Pages novamente. A configuração vazia incluída no repositório é intencional até a criação do serviço; a interface mostra um aviso enquanto não houver URL de API.

## Administrador inicial

O cadastro público nunca concede administração com base no e-mail. O Render gera um `ADMIN_BOOTSTRAP_TOKEN` secreto. Depois do primeiro deploy, consulte esse valor no painel privado de variáveis do serviço, abra **Criar conta** no site publicado e informe esse token no campo opcional junto com o e-mail e a senha da conta do proprietário. Somente a primeira conta criada com o token correto recebe o papel de administrador; os cadastros seguintes são usuários comuns, mesmo que conheçam o e-mail do proprietário. O token não é enviado no endereço do site, mas sim no corpo HTTPS do pedido de cadastro. Após confirmar que o painel de administrador aparece, remova `ADMIN_BOOTSTRAP_TOKEN` das variáveis do Render. Se não houver administrador e o token for removido, será necessário configurar um novo token secreto para completar o bootstrap.

`SESSION_SECRET` e `ADMIN_BOOTSTRAP_TOKEN` precisam permanecer privados. Para desenvolvimento local, copie `.env.example` para `.env`, substitua os placeholders por valores próprios e execute `npm start` (Node 22.9 ou superior). Não reutilize em produção os segredos do ambiente local.

## Variáveis de ambiente

| Variável | Onde / finalidade |
|---|---|
| `NODE_ENV` | Render: `production`; ativa cookie seguro, CORS estrito e confiança no proxy Render. |
| `FRONTEND_ORIGIN` | Render: origem exata `https://orfeu-lira.github.io`, sem caminho ou wildcard. |
| `DATABASE_PATH` | Render: `/var/data/mesa.db`, no disco persistente do Blueprint. Local: `./mesa.db`. |
| `SESSION_SECRET` | Segredo obrigatório, com ao menos 32 caracteres; o Blueprint gera um valor. |
| `ADMIN_BOOTSTRAP_TOKEN` | Segredo obrigatório em produção, com ao menos 32 caracteres; usado apenas para o primeiro admin e removido depois. |
| `ANTHROPIC_API_KEY` | Render: segredo opcional para geração real; sem ela é usada a resposta de exemplo. Revogue a chave antiga exposta e crie outra. |
| `ANTHROPIC_MODEL` | Opcional; nome do modelo Anthropic. |
| `PORT` | Definida pelo Render; a aplicação usa `3000` como padrão local. |

## Segurança, limitações e operação

- CORS permite somente a origem configurada e nunca combina wildcard com credenciais. As chamadas do navegador incluem cookies; em produção eles usam `SameSite=None; Secure`, `HttpOnly` e proxy confiável do Render. Pedidos mutáveis de outra origem são recusados.
- O frontend e o Render são domínios distintos. Alguns navegadores ou configurações de privacidade bloqueiam cookies de terceiros mesmo com esses atributos; nesse caso login e sessão podem não funcionar. Um domínio próprio com frontend e API em subdomínios do mesmo site é uma possível evolução.
- O disco persistente protege contra reinício e novo deploy do serviço, mas não substitui backups. SQLite nesta configuração não suporta várias instâncias da API compartilhando o mesmo banco.
- Não há confirmação de e-mail, recuperação de senha, cobrança, backup automatizado ou revisão legal/LGPD. Configure monitoramento e backups adequados antes de uso crítico.
- A remoção do `.env` deste commit impede novos rastreamentos, mas não remove o conteúdo dos commits anteriores do histórico público. Revogue/reemita qualquer chave de API que esteve nesse arquivo e atualize apenas o segredo no Render. Não reutilize nem publique o valor antigo.
- Este repositório não consegue configurar contas externas, criar o serviço na sua conta Render ou publicar o GitHub Pages. Esses passos dependem de acesso às suas contas; nenhum deploy foi executado.
