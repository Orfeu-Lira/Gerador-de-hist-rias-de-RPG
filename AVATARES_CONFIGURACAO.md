# Mesa — Avatares privados para fichas (etapa 1)

## Implementado nesta branch (Preview)
- Retrato padrão estilizado na ficha; opção **Enviar imagem** e **Remover avatar**.
- Upload JPG/PNG/WebP com recorte central quadrado de 400×400, convertido para WebP no navegador.
- Máximo do arquivo original: 8 MB. Máximo convertido: 384 KB.
- Upload e download autenticados pelo backend Express, com autorização por proprietário da ficha.
- Armazenamento em bucket **privado** `mesa-avatares` do Supabase Storage, com metadados na tabela `public.personagem_avatares`.
- Ao excluir uma ficha, o servidor tenta apagar também o arquivo do Storage.
- Nenhum avatar prévio ou alteração de ficha necessária; dados JSONB das fichas antigas continuam intactos.
- **Gerar avatar com IA ainda não está implementado** (etapa 2).

## Ativação necessária antes de testar
1. Supabase Dashboard > SQL Editor: executar `supabase/005_avatar_storage.sql` no mesmo projeto do Mesa. O SQL cria um bucket privado e a tabela de vínculo.
2. Vercel > Environment Variables > Preview: definir **SUPABASE_URL** (URL HTTPS do projeto Supabase) e **SUPABASE_SERVICE_ROLE_KEY** (chave secreta service_role/secret key apropriada para o Supabase Storage, exclusiva do servidor). Não enviar a chave em mensagens, frontend, prints ou repositório.
3. Fazer redeploy da branch `feature/mesa-redesign-v1` e abrir a nova implantação Preview.
4. Abrir Personagens, selecionar uma ficha **já salva**, enviar imagem e confirmar prévia. Para ficha nova, salvar primeiro e reabri-la na biblioteca.
5. Recarregar navegador, reabrir a mesma ficha, conferir avatar; testar remover, substituir, excluir a ficha e abrir outra conta para confirmar acesso negado.
6. Publicar apenas após testes. **Produção main não foi modificada.**

## Privacidade
A aplicação não coloca a chave do Storage no navegador, não gera links públicos, não aceita caminhos arbitrários no upload e usa sessão para carregar o avatar. O upload é convertido pelo navegador; o backend confere cabeçalho WebP e tamanho em bytes. A atualização ou remoção do arquivo é limitada à ficha pertencente ao usuário.

## Observações
- O recorte inicial é central e automático; ajuste interativo com zoom e posicionamento fica para futura melhoria.
- O botão só é habilitado após salvar/reabrir a ficha, para que já exista um ID válido.
- No futuro, geração de avatar por IA poderá salvar no mesmo bucket por uma API de imagem, mantendo upload manual.
