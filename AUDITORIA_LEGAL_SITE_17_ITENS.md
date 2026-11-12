# Mesa — checklist do vídeo “17 coisas pro seu site feito com IA não ser processado”

Revisão técnica inicial: 12/11/2026. **Não é uma certificação legal nem substitui revisão por profissional habilitado.**

| Item | Situação do Mesa | Próximo cuidado |
|---|---|---|
| 1. Política de privacidade | **Adicionada** em `/?tela=privacidade`. | Conferir inventário real de fornecedores, finalidades, retenção e responsável. |
| 2. Termos de serviço | **Adicionados** em `/?tela=termos`, linkados no rodapé e cadastro. Aceite de novos cadastros validado pelo servidor e versão registrada. | Revisar com responsável jurídico. |
| 3. Aviso de cookies | **Adicionado aviso informativo** de cookie de sessão e preferências locais. | Revisitar se entrar analytics, pixels ou publicidade; aí implantar consentimento granular quando exigido. |
| 4. Política de reembolso | **Não aplicável por enquanto.** O Mesa não cobra pelo aplicativo na versão atual. | Antes de vender algo, definir preços, condições e regras de cancelamento/reembolso. |
| 5. Formulários para direitos LGPD | **Disponíveis para usuários logados** via formulário Suporte, com assuntos LGPD específicos. | Criar canal público para ex-usuários e não cadastrados e procedimento operacional para atender solicitações. |
| 6. Apenas dados necessários | Há campos reduzidos na conta (e-mail e senha protegida) e conteúdo opcional de RPG. | Mapear coleta de IP, logs e retenção; revisar minimização com inventário de dados. |
| 7. Scripts de tracking | **Não foram adicionados** pixels ou analytics pelo código desta tarefa. | Auditar serviços e terceiros periodicamente; não inserir scripts sem transparência e base apropriada. |
| 8. Acessibilidade | Layout responsivo, rótulos em formulários, controles focáveis e mensagens acessíveis já existentes. | Testes reais com leitores de tela, teclado, zoom 200% e validação WCAG. |
| 9. Alt nas imagens | Imagens HTML encontradas usam atributo `alt`. Ilustrações SVG têm descrição nos dados. | Auditar uploads, imagens futuras e outras mídias. |
| 10. Contraste corrigido | **Parcial**: cores de páginas legais e avisos foram definidas visando legibilidade. | Rodar auditoria automatizada e manual de contraste WCAG; corrigir todos os componentes. |
| 11. Navegação por teclado | Menu lateral, formulários e controles usam botões/links nativos e atalhos já existentes. | Testar foco, modais, widgets de áudio e ordem de tabulação em celular e desktop. |
| 12. Sem avaliação falsa | Nenhum módulo de depoimentos falsos foi inserido. | Não inventar avaliações, números de usuários ou certificações. |
| 13. Sem promessas falsas | Textos legais deixam claro que IA falha e que a plataforma está em desenvolvimento. | Conferir toda comunicação de marketing periodicamente. |
| 14. Copyright de imagens | Termos alertam para direitos autorais; músicas existentes são acompanhadas de crédito/licença. | **Pendente:** verificar origem/licenças de TODOS os ícones, imagens, fontes, músicas e conteúdo de terceiros. |
| 15. Dados da empresa | **Pendente**: não foram inventados razão social, CNPJ, endereço ou contato externo. | Definir/confirmar quem é o responsável legal e seu canal público; publicar dados verdadeiros aplicáveis. |
| 16. Conformidade com a LGPD | **Parcial**: transparência publicada, acesso a direitos via suporte, autorização por conta e registro do aceite. | Inventário de tratamento, bases legais, retenção, exclusão de conta, contratos com fornecedores, canal para não logados e revisão jurídica. |
| 17. Riscos jurídicos | Esta lista torna visíveis as lacunas. | Fazer revisão jurídica final e manter documentos atualizados ao alterar o produto. |

## Observações técnicas
- O aviso de cookies é **informativo**, não simula consentimento para publicidade. Não adicionar tracking sem reavaliar.
- O aceite dos novos usuários é validado na API e persistido com data e versão em `public.usuarios` (migração `supabase/011_termos_aceite.sql`).
- O suporte LGPD exige login na versão atual. Não afirmar que atende pessoas sem conta.
- As políticas descrevem a tecnologia conhecida do projeto e explicitamente apontam pontos ainda não definidos.
- Ao obter os dados do responsável legal, atualizar as páginas em `public/index.html` e verificar necessidades de identificação pública.

## Roteiro de validação manual
1. Navegar para `/?tela=privacidade` e `/?tela=termos`, abrir links pelo rodapé e pelo cadastro.
2. Confirmar aviso de cookies, fechar e atualizar; verificar que continua fechado.
3. Tentar criar conta sem aceitar termos: deve falhar. Com checkbox marcado, cadastro deve registrar versão e data.
4. Abrir Suporte autenticado e escolher solicitação LGPD; confirmar que chega ao painel de chamados.
5. Testar leitura com leitor de tela, tabulação, foco, zoom e cores.
6. Auditar cookies com as ferramentas do navegador e acesso a terceiros.
