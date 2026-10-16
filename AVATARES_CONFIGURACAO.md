# Mesa — Avatares privados para fichas (etapa 1)

## Implementado nesta branch (Preview)
- Retrato padrão estilizado na ficha; opção **Enviar imagem** e **Remover avatar**.
- Upload JPG/PNG/WebP com recorte central quadrado de 400×400, convertido para WebP no navegador.
- Máximo do arquivo original: 8 MB. Máximo convertido: 384 KB.
- Upload e download autenticados pelo backend Express, com autorização por proprietário da ficha.
- Armazenamento em bucket **privado** `mesa-avatares` do Supabase Storage, com metadados na tabela `public.personagem_avatares`.
- Ao excluir uma ficha, o servidor tenta apagar também o arquivo do Storage.
- Nenhum avatar prévio ou alteração de ficha necessária; dados JSONB das fichas antigas continuam intactos.
- **Gerar avatar com IA implementado nesta branch (ainda pendente de teste com API real).** Estilos: Fantasia ilustrada, Realismo cinematográfico, Anime ou Pintura clássica. A aparência é opcional. O Gemini usa nome, cenário, classe/especialidade, espécie e resumo da aventura. O navegador otimiza para WebP e envia ao armazenamento privado após uma geração bem-sucedida. Limite de 2 gerações diárias por usuário (6 para admin).

## Ativação necessária antes de testar
1. Supabase Dashboard > SQL Editor: executar `supabase/005_avatar_storage.sql` no mesmo projeto do Mesa. O SQL cria um bucket privado e a tabela de vínculo.
2. Vercel > Environment Variables > Preview: definir **SUPABASE_URL** (URL HTTPS do projeto Supabase) e **SUPABASE_SERVICE_ROLE_KEY** (chave secreta service_role/secret key apropriada para o Supabase Storage, exclusiva do servidor). Não enviar a chave em mensagens, frontend, prints ou repositório.
3. Fazer redeploy da branch `feature/mesa-redesign-v1` e abrir a nova implantação Preview.
4. Abrir Personagens, selecionar uma ficha **já salva**, enviar imagem e confirmar prévia. Para ficha nova, salvar primeiro e reabri-la na biblioteca.
5. Recarregar navegador, reabrir a mesma ficha, conferir avatar; testar remover, substituir, excluir a ficha e abrir outra conta para confirmar acesso negado.
6. Publicar apenas após testes. **Produção main não foi modificada.**

## Geração de avatar por IA — teste no Preview
1. Confirme que a variável `GEMINI_API_KEY` está configurada no ambiente Preview do Vercel e tem acesso faturado ao modelo de imagens `gemini-3.1-flash-lite-image`.
2. **Opcional**: `GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image` para selecionar o modelo independentemente daquele usado nas aventuras (`GEMINI_MODEL`).
3. No Preview, abra **Personagens**, selecione uma ficha salva, escolha **Estilo do avatar**, descreva a aparência se quiser e clique em **Gerar avatar com IA**.
4. Aguarde; se a API retornar imagem, ela será otimizada e salva automaticamente. Recarregue a tela e confira se o avatar persiste.
5. Faça o teste com uma ficha narrativa de outro gênero e confirme que o resultado corresponde ao cenário.
6. Erros de falta de quota, modelo não habilitado ou timeout devem exibir aviso legível. Revise os logs do Vercel para o HTTP status do Gemini sem expor a chave.
7. **Atenção aos custos:** o modelo de imagens pode ser cobrado separadamente. Não compartilhar chaves nem usar produção antes de validar despesas e testes.

## Privacidade
A aplicação não coloca a chave do Storage no navegador, não gera links públicos, não aceita caminhos arbitrários no upload e usa sessão para carregar o avatar. O upload é convertido pelo navegador; o backend confere cabeçalho WebP e tamanho em bytes. A atualização ou remoção do arquivo é limitada à ficha pertencente ao usuário.

## Observações
- O recorte inicial é central e automático; ajuste interativo com zoom e posicionamento fica para futura melhoria.
- O botão só é habilitado após salvar/reabrir a ficha, para que já exista um ID válido.
- A geração por IA agora usa o mesmo bucket do upload manual, sem disponibilizar o avatar publicamente. O usuário pode substituir o retrato por upload ou gerar um novo avatar.

## Diagnóstico em 16/10/2026
- A API Gemini retornou HTTP 429 para geração de imagem: não é erro do Supabase nem da ficha.
- Conforme a tabela oficial de preços, modelos Gemini 3.1 Flash Lite Image e Flash Image **não têm modalidade gratuita de geração de imagens via API**. Pode ser necessário ativar faturamento no Google AI Studio / projeto correspondente antes de continuar. Não efetivar nenhuma cobrança sem verificar o orçamento.
- Modelo padrão do servidor atualizado para `gemini-3.1-flash-lite-image`; se existir `GEMINI_IMAGE_MODEL` no Vercel, ela prevalece. Atualizar seu valor manualmente para o modelo atual e fazer redeploy.
- Erros 429 dependem de cota, faturamento ou acesso na conta Google; não se corrigem redefinindo contadores do Mesa.
- O Chrome exibiu alerta **Perigoso** no domínio Preview. Antes de logar ou inserir chaves nesse endereço, investigar o motivo do alerta no Safe Browsing/Google Search Console e verificar se a URL corresponde ao projeto Vercel legítimo. Não contornar proteção do Chrome.
