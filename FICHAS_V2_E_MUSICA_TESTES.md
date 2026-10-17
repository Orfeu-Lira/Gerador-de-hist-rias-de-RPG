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

## Música medieval gravada — seleção online com crédito
- Player no topo com **Tocar/Pausar**, seleção de ambiente e volume persistente. Reproduz áudio real do Wikimedia Commons (requer conexão), sem autoplay e sem cobrança de IA.
- **Taverna:** "Medieval Story", Frank Schröter — CC BY 4.0 — https://commons.wikimedia.org/wiki/File:Medieval_Story_by_Frank_Schr%C3%B6ter.ogg
- **Floresta:** "Medieval Dream", Frank Schröter — CC BY 4.0 — https://commons.wikimedia.org/wiki/File:Medieval_Dream_by_Frank_Schr%C3%B6ter.ogg
- **Jornada:** "Chominciamento de Gioia", gravação Ririkuku — CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Chominciamento_de_Gioia1.ogg
- Há indicação de autor, música, licença Creative Commons e link à fonte na própria interface. Não foram modificadas as gravações.
- Arquivos continuam no Wikimedia Commons e são acessados pelo player por meio de URLs de redirecionamento oficial da Wikimedia. É necessário verificar no Preview se os redirecionamentos e a reprodução Ogg funcionam no navegador.
- Se uma faixa não carregar, a interface indica falha e mantém a opção de abrir a fonte para ouvi-la. Sem reproduzir áudio automaticamente, sem custos de API de música.
- Se no futuro quisermos hospedar as faixas no próprio Mesa, precisamos preservar os mesmos créditos e condições de licença, incluindo compartilhamento sob mesma licença para modificações de obra CC BY-SA.

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
7. Testar **Tocar**, mudar entre Taverna, Floresta e Jornada, pausar e controlar volume. Confirmar três gravações reais (não síntese), links de créditos e mensagem de falha caso o Commons fique indisponível. Testar silêncio automático antes do clique.
8. Testar no celular: abas horizontais flexíveis, inventário e player.
9. Testar acesso de outra conta (cada ficha pertence ao seu usuário).
10. Testar funcionalidades anteriores: aventuras, histórico, dados, login, upload de avatar.

**Verificações feitas:** sintaxe de `server.js` e `public/app.js`; teste isolado de validação para nova ficha D&D, ficha narrativa, ficha antiga, data inválida e quantidade inválida. **Não foi executado um teste real no navegador nem no banco do usuário.**

**A publicação na main não deve ser realizada antes da validação no Preview.**
