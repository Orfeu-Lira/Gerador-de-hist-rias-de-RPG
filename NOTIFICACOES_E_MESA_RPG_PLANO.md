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
