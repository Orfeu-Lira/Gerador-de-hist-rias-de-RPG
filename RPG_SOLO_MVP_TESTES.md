# RPG Solo · Mestre IA — MVP implementado

A segunda aba do Mesa é uma experiência separada do Gerador e permite narrar campanhas individuais.

## Fluxo
1. Entre na conta (salvamento vinculado exclusivamente ao usuário autenticado).
2. Abra a segunda aba **RPG Solo · IA**.
3. Escolha uma aventura previamente criada no Gerador **ou** forneça uma ideia livre. É possível adicionar alterações à aventura salva já no início.
4. Defina título, gênero e tom; o Mestre IA abre a primeira cena.
5. Escreva livremente uma ação do personagem, ou selecione **Pedir modificação da história** para solicitar mudança de enredo, cenário, tom, etc.
6. A IA recebe a premissa, o resumo persistente e até 16 mensagens recentes. O servidor salva a resposta e a ação em sequência no Supabase.
7. Retome ou exclua campanhas na mesma aba, em qualquer dispositivo com a mesma conta.

## Limites e segurança
- Versão inicial textual: não altera ficha, inventário, HP ou rolagens do usuário.
- 30 narrações por dia por conta normal, contabilizadas separadamente das cotas do gerador. Administrador sem limite; criação da cena inicial consome uma narração.
- Até 300 turnos por campanha, 40 campanhas mais recentes na lista.
- Autorização por proprietário na API para leitura, inserção e exclusão; campanhas de terceiros não podem ser selecionadas.
- RLS ativo em `mesa_solo_campanhas` e `mesa_solo_mensagens`; acesso direto de papéis `anon`/`authenticated` revogado.
- Proteção contra mensagens concorrentes na mesma campanha usando marcação atômica de processamento, com recuperação de travamento antigo.
- Texto do jogador como dados ficcionais no prompt; resposta da IA estruturada e validada.
- IA não controla a vontade do protagonista; pode aceitar retcons e alterações do usuário.
- O banco salva todas as mensagens; o contexto enviado ao modelo usa um resumo acumulado e mensagens recentes para controlar custo e tamanho.
- Atualizações do gerador original permanecem independentes.
- Necessário login e conexão com a internet; não há execução offline da IA.

## Testes de aceitação
1. Visitante: vê a aba, mas precisa fazer login para iniciar e salvar.
2. Conta A: criar campanha por texto livre, executar ação, pedir ajuste, fechar e reabrir a página e confirmar persistência.
3. Conta A: escolher aventura salva do gerador e criar campanha contextualizada.
4. Conta B: não consegue ler campanhas nem aventuras da conta A usando IDs diretos.
5. Falha de Gemini: feedback de erro, sem turno incompleto nem cota consumida.
6. Dois envios simultâneos: segundo recebe conflito em vez de produzir turno duplicado.
7. Excluir campanha: mensagens excluídas em cascata; aventuras de origem preservadas.
8. Testar responsividade em desktop, tablet e celular e compatibilidade com PWA.

## Status de validação
- Migração de banco aplicada ao Supabase e RLS verificado.
- Sintaxe JavaScript do backend, IA e frontend validada.
- Testes reais de narração autenticada e de interação no navegador requerem usuário de teste e acesso à API em execução.
