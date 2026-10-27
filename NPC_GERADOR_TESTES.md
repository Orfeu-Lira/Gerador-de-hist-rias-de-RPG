# Gerador de NPCs — Mesa

## Funcionalidade
- Alternar entre **Aventura completa** e **Apenas NPC** no gerador.
- Gerar um NPC a partir de descrição livre ou da aventura previamente salva na mesma conta.
- Ficha narrativa: nome, papel, aparência, personalidade, história, objetivo, segredo, vínculo, interpretação e gancho.
- Copiar o resultado para a área de transferência.
- Contas autenticadas: últimos 40 NPCs salvos privadamente; abrir ou excluir.
- Visitantes: podem gerar por descrição, sem salvar; usa a geração gratuita de visitante.
- Mesma cota do gerador atual: 5 gerações diárias para usuário, 1 para visitante; administrador sem limite.
- Manutenção interrompe novas gerações de NPC, como ocorre com aventuras.
- Aventura vinculada só é lida se pertencente ao usuário autenticado, validado no servidor.
- Nenhum NPC criado nesta função vira ficha de jogador automaticamente.
- Migração SQL `supabase/008_npcs_gerador.sql` aplicada no Supabase; tabela com RLS e acesso via backend.

## Testes manuais após deploy
1. Gerar NPC por descrição livre enquanto visitante; verificar consumo da cota.
2. Entrar na conta e selecionar aventura existente; gerar NPC relacionado ao enredo.
3. Tentar informar ID de aventura pertencente a outro usuário: deve retornar 404.
4. Consultar NPC na biblioteca, copiar a ficha e excluir um NPC salvo.
5. Verificar que o gerador de aventuras continua igual ao anterior e usa a mesma cota.
6. Em celular, verificar alternância das abas e texto não transbordando.
7. Confirmar que um usuário não acessa NPCs de outro e que o modo manutenção bloqueia geração.
