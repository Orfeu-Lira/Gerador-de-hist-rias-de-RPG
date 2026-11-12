# Mesa — revisão dos 17 itens do vídeo (12/11/2026)

Este checklist é uma auditoria inicial de produto, **não** um atestado de conformidade legal nem garantia de que o site não possa ser processado. O vídeo é um alerta genérico, não uma lista oficial de requisitos legais. A aplicação efetiva das obrigações depende da atividade real e da legislação.

| Item | Situação | Observações / ação |
| --- | --- | --- |
| 1. Política de privacidade | **Versão inicial disponível** | Página dentro do Mesa com categorias de dados, finalidades, uso do Gemini, Supabase/Vercel, conservação e direitos. Precisa de revisão jurídica e identificação do controlador. |
| 2. Termos de serviço | **Versão inicial disponível** | Condições e limitações do serviço gratuito, IA e conteúdo gerado. Revisar versão final. |
| 3. Aviso de cookies | **Informativo disponível** | Informa cookie essencial de sessão e armazenamento local. Botão **Entendi** não representa consentimento para rastreamento opcional. Se forem adicionadas ferramentas de analytics/ads, avaliar base legal e implementar escolhas reais antes de ativá-las. |
| 4. Política de reembolso | **Inaplicável por ora** | O Mesa é descrito como gratuito e não há cobrança implementada; criar política específica somente se começar a vender recursos ou assinaturas. |
| 5. Formulários LGPD | **Canal implementado** | Categorias no suporte para acesso, correção, exclusão e dúvidas; autenticação necessária. É preciso confirmar contato público para solicitações de quem não tem conta. |
| 6. Só os dados necessários | **Revisão parcial** | Cadastro usa e-mail/senha, conteúdo opcional é fornecido pelo jogador. Revisar logs, quotas/IPs, retenção e textos livres; evitar pedir dados sensíveis. |
| 7. Scripts de tracking | **Não foram encontrados scripts explícitos de analytics no HTML principal** | Há fontes externas e serviços usados por recursos escolhidos. Monitorar scripts/dependências a cada atualização e documentar transferências. |
| 8. Acessibilidade | **Parcialmente implementada** | Marcação semântica e foco visível; adicionado link para pular ao conteúdo. Falta auditoria assistiva com leitores de tela e testes WCAG. |
| 9. Alt nas imagens | **HTML estático verificado** | Imagens estáticas identificadas têm texto alternativo; repetir a revisão para conteúdos dinâmicos e imagens futuras. |
| 10. Contraste | **Revisão pendente** | Ajustes visuais existentes não substituem medição formal em todas as telas, incluindo alertas e estados desabilitados. |
| 11. Navegação por teclado | **Melhorada** | Atalho de navegação e indicação de foco; falta teste de ponta a ponta sem mouse, incluindo menus, diálogos e player. |
| 12. Sem avaliações falsas | **Regra editorial** | Não publicar depoimentos, avaliações, números de usuários ou notas sem evidências verificáveis e consentimento quando necessário. |
| 13. Sem promessas falsas | **Regra editorial** | Não afirmar que a IA é infalível nem prometer disponibilidade, originalidade ou conformidade jurídica garantida. |
| 14. Copyright de imagens | **Revisão recorrente** | Avatares enviados são responsabilidade de quem os compartilha; ícones internos e trilhas externas devem respeitar licença e atribuição. Auditar arquivos do repositório e links de terceiros. |
| 15. Dados da empresa / responsável | **Pendente de dados reais** | Confirmar nome/identificação do responsável, contato público e, se aplicável, dados empresariais. **Não inventar CNPJ ou endereço**. |
| 16. Conformidade LGPD | **Em progresso, não certificada** | Páginas de transparência, suporte e exportação limitada de dados. Falta formalizar bases legais, registros de tratamento, prazos, operadores e fluxo de incidentes. |
| 17. Outros riscos jurídicos | **Revisão pendente** | Revisão especializada sobre propriedade intelectual, marcas de RPG, conteúdo de terceiros, condições de fornecedores, moderação e eventual monetização. |

## Melhorias técnicas entregues nesta etapa
- Página de Privacidade e Termos e aviso informativo de cookies já presentes.
- Formulários de suporte com categorias LGPD.
- **Novo botão de exportação** em Privacidade, ligado à rota autenticada `GET /api/conta/meus-dados`. Gera JSON limitado a 1000 registros por coleção, exclui senhas/hash/tokens e avisa que imagens originais, logs e demais dados precisam de solicitação adicional.
- **Novo link de pular para o conteúdo**, visível ao receber foco pelo teclado, com tratamento de movimento reduzido.

## Pendências prioritárias antes de anunciar conformidade jurídica
1. Confirmar contato público (e-mail dedicado) e identificação real do controlador, sem expor dados desnecessários.
2. Revisar regras de retenção e descarte de contas, fotos, campanhas, suporte e dados técnicos.
3. Fazer auditoria de contraste, teclado e leitor de tela em cada fluxo principal.
4. Documentar todos os fornecedores, finalidades, acessos, transferências e incidentes.
5. Verificar bases legais adequadas, políticas comerciais futuras e revisar documentos com profissional jurídico.

## Referências institucionais
- ANPD, direitos dos titulares: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares
- ANPD, guia de cookies: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais

Não usar o título do vídeo ("17 coisas para seu site com IA não ser processado") como promessa de imunidade jurídica.
