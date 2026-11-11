# Mesa — Notificações de suporte v1 e evolução para RPG online

## Disponível nesta entrega
- Sino reservado a administrador, com contador de chamados ainda não lidos.
- Lista dos 50 chamados mais recentes com assunto, e-mail de contato e data.
- Marcar um chamado como lido, marcar todos como lidos, ou abrir a central de suporte.
- Indicador de leitura separado por administrador (múltiplos administradores não interferem uns nos outros).
- Atualização enquanto o aplicativo estiver aberto e visível (consultas até a cada 60 segundos).
- Acesso no servidor protegido por sessão autenticada + papel `admin`; SQL parametrizado; dados da API não são armazenados no cache PWA.
- Migração aditiva `supabase/007_notificacoes_admin.sql` já aplicada no Supabase do Mesa. RLS habilitado.

## Limites atuais
- Apenas avisos **dentro** do Mesa. Não envia e-mail nem push com aplicativo fechado.
- Os avisos representam chamados enviados pelo formulário do suporte, inclusive feedbacks. Não há leitura de mensagens da caixa de e-mail externa.
- A leitura é persistente, mas a lista mostra só os 50 chamados mais recentes; o total de não lidos considera todos.
- As notificações dependem de conexão com a internet e sessão de administrador válida.
- Sem chat em tempo real nesta etapa.

## Proposta futura — RPG Solo com Mestre IA
**Visão:** permitir que pessoas sem um grupo de RPG também possam viver campanhas completas no Mesa. Um jogador controla o próprio personagem e a IA atua como mestre, narrando acontecimentos e reagindo a cada decisão. O modo solo complementa, mas não substitui, o futuro modo multiplayer.

### Experiência desejada
1. **Iniciar campanha solo:** escolher gênero, tom, cenário, nível de experiência e personagem (incluindo ficha já criada no Mesa).
2. **Mestre IA narrativo:** apresentar uma cena curta, personagens e um problema inicial. A cada ação escrita pelo jogador, narrar consequências coerentes com o que aconteceu anteriormente.
3. **Escolhas livres:** o jogador pode escrever qualquer ação razoável; sugestões de ações são opcionais, não menus obrigatórios.
4. **Regras e dados:** inicialmente modo narrativo, com rolagens feitas pelo jogador e resultados validados pelo servidor. Depois, suporte opcional a sistemas de regras específicos, com mecânicas testadas.
5. **Memória de campanha:** salvar cenas, decisões, locais, NPCs, missões, estado da ficha e um resumo de longo prazo para manter a continuidade ao reabrir a partida.
6. **Agência do jogador:** a IA não decide pensamentos, falas ou ações do personagem do usuário; descreve ambiente, NPCs e consequências, indicando claramente quando uma jogada precisa ser resolvida.
7. **Controles:** pausar, continuar, revisar acontecimentos, reiniciar cena quando apropriado, exportar campanha, excluir dados e controlar limites de custo/uso de IA.

### MVP sugerido
- Uma campanha solo por conta durante o teste inicial, com histórico persistente e interface de chat em turnos.
- Resposta da IA com **narração + estado atualizado + indicação de teste de dado (quando necessário)**, estruturada e validada no backend.
- Resumos periódicos de memória para evitar que a IA esqueça personagens e acontecimentos, e limites explícitos de tamanho de contexto.
- IA não recebe acesso irrestrito ao banco de dados; alterações de vida, inventário e progresso passam por validação no servidor.
- Testar consistência, retomada após desconexão, uso em celular/PWA, moderação de conteúdo e custos antes de liberar a todos.

**Status:** ideia aprovada para o planejamento; ainda não implementada nem liberada para jogadores.

## Roteiro futuro — Mesa como lugar de jogar RPG
1. **Comunicação:** chat por mesa, canais, notificações push opcionais e avisos por e-mail transacional. Exigir opt-in de notificações e proteção contra spam.
2. **Mesas e convites:** criar mesas de jogo, papéis de mestre/jogador, convites privados, presença e sessões agendadas.
3. **Mesa virtual básica:** rolagens sincronizadas, fichas vinculadas à campanha, registros de ações e inventário compartilhável por permissão.
4. **Jogabilidade colaborativa:** cenas, mapas, tokens, turnos, iniciativa e ferramentas de mestre. Definir primeiro as regras de cada sistema para não inventar mecânicas.
5. **Escala e segurança:** moderação, bloqueios, exportação de campanhas, limites de armazenamento, logs e monitoramento de custos.

## Como testar
1. Login de administrador: sino aparece; visitante e jogador comum não veem o sino e não podem acessar /api/admin/notificacoes.
2. Enviar chamado numa conta de jogador; abrir app de administrador conectado e observar contador (na próxima atualização ou após recarregar).
3. Marcar como lido, recarregar e confirmar que continua lido.
4. Enviar mais um chamado e usar «Marcar todas como lidas»; observar o contador zerar.
5. Abrir um chamado na administração e confirmar que não há exposição de fichas ou senhas.
6. Testar em tela pequena e PWA instalado.
