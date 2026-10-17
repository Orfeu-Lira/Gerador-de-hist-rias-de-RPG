# Mesa — Fichas v2 + música ambiente (Preview)

Atualização de 16/10/2026. Implementado somente na branch `feature/mesa-redesign-v1`. A produção `main` segue intacta até testes.

## Interface
- A ficha possui 5 abas: Identidade, Atributos, Inventário, Habilidades e História.
- Os campos antigos continuam na ficha: nome, classe/especialidade, cenário, atributos D&D quando aplicáveis, retrato por upload, notas e botão Salvar.
- O botão **Salvar ficha** permanece fora das abas e salva o conjunto inteiro.
- As regras D&D de compra de 27 pontos continuam apenas em fantasias; fichas narrativas não recebem cálculos D&D inventados.
- Histórico do navegador e compatibilidade: fichas antigas recebem listas iniciais a partir de `equipamentos` quando ainda não tiverem `inventario`.

## Inventário
- Botão **Sugerir kit inicial** continua usando classe/especialidade e cenário.
- Itens têm nome (até 80), categoria, quantidade (1 a 99), sinalização de equipado, descrição opcional (até 120) e remover.
- Até 32 tipos de item por ficha; lista salva no JSONB em `dados.inventario`; cópia textual em `dados.equipamentos` para compatibilidade.
- **Equipado** é só marcação manual; não calcula dano, classe de armadura nem aplica regras automaticamente.

## Habilidades e evolução
- Inserção e remoção manual de até 24 habilidades, com tipo e descrição; `dados.habilidades`.
- **Sugerir temas** apresenta ideias narrativas contextualizadas pela classe/especialidade, explicitamente **sem conceder poderes, proficiências ou magias**. O mestre valida toda habilidade.
- Diário de até 30 registros com data, nível no momento e descrição; `dados.evolucao`. Não aumenta atributos nem libera habilidades automaticamente.

## Música folk original
- Player próximo ao topo do site com botão **Tocar/Pausar**, seleção de **Folk medieval**, **Floresta** ou **Jornada** e controle de volume.
- Os sons são sintetizados localmente pela Web Audio API com melodia e acordes próprios do Mesa — **não** um arquivo musical de terceiros nem uma gravação profissional. Não há direitos musicais externos ou custo de streaming.
- A música só começa depois de clicar em Tocar; seleção de clima e volume ficam no armazenamento local do navegador. O áudio prossegue ao navegar entre seções do app enquanto a mesma página permanecer aberta.
- Nenhum custo de API nem reprodução automática.

## Segurança e persistência
- Backend aceita até 32KB nas rotas de salvar fichas; outras rotas JSON mantêm 10KB (exceto avatar).
- Os campos opcionais novos são validados no servidor (tipo, tamanho, números e formato de data); fichas anteriores seguem aceitas.
- JSONB `public.personagens_dnd.dados` já suporta estes campos: **nenhuma nova migração SQL**.
- O botão de avatar com IA permanece desativado; upload manual continua disponível.

## Checklist obrigatório no Preview
1. Entrar e abrir **Personagens**. Abrir Orfeu (ficha antiga), conferir identidade, pontos e histórico de notas.
2. Alternar por todas as abas; verificar que os cálculos D&D só aparecem no cenário de fantasia.
3. Em **Inventário**, clicar em **Sugerir kit inicial**, adicionar item, ajustar categoria, quantidade e equipado, incluir descrição. Salvar ficha e reabrir; verificar persistência.
4. Em **Habilidades**, criar uma habilidade própria, editar sua descrição, usar **Sugerir temas** e salvar; conferir persistência.
5. Na aba **História**, registrar conquista no diário, editar anotações, salvar e recarregar; conferir persistência.
6. Testar uma ficha de Piratas e mares: campos narrativos, sugestões pertinentes e **ausência** de cálculos D&D.
7. Testar **Tocar**, mudar entre Folk, Floresta e Jornada, pausar e controlar volume. Testar silêncio automático antes do primeiro clique.
8. Testar no celular: abas horizontais flexíveis, inventário e player.
9. Testar acesso de outra conta (cada ficha pertence ao seu usuário).
10. Testar funcionalidades anteriores: aventuras, histórico, dados, login, upload de avatar.

**Verificações feitas:** sintaxe de `server.js` e `public/app.js`; teste isolado de validação para nova ficha D&D, ficha narrativa, ficha antiga, data inválida e quantidade inválida. **Não foi executado um teste real no navegador nem no banco do usuário.**

**A publicação na main não deve ser realizada antes da validação no Preview.**
