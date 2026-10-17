# Mesa — módulo D&D 5e revisado (2024)

## Fonte e edição
- D&D 5e com regras revisadas de 2024.
- Referências: https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character e https://www.dndbeyond.com/srd (SRD 5.2.1).
- Material escrito no Mesa deve respeitar a licença aplicável ao SRD e sua atribuição quando apropriado. Não copiar conteúdo completo de livros proprietários.

## Implementado nesta primeira fase (Preview)
- Menu exclusivo **Personagens** para usuários autenticados.
- Formulário de personagem: nome, classe, espécie, antecedente, nível e anotações.
- Compra de atributos base (point buy): FOR, DES, CON, INT, SAB, CAR, intervalo de 8 a 15.
- Custos: 8=0; 9=1; 10=2; 11=3; 12=4; 13=5; 14=7; 15=9; orçamento até 27.
- Modificadores calculados por floor((atributo - 10)/2).
- O backend valida o orçamento de 27 pontos novamente para impedir envio de valores inválidos via API.
- Salvar, listar, editar e excluir fichas **do próprio usuário** no banco.
- Aba **Tutor D&D**: perguntas em português ao Gemini (somente para usuários autenticados), 6 consultas/dia, sem acesso de escrita nas fichas, com aviso de confirmação na referência oficial.

## Limitações explícitas
- Bônus de atributos por antecedentes, talentos de origem, espécies, proficiências, equipamentos, PV/CA, magias e progressão de classes **ainda não são aplicados**. Campos classe/espécie/antecedente são anotações nesta etapa; não ativam poderes ou cálculos.
- Point buy não obriga gastar exatamente 27 (pode-se salvar uma distribuição com pontos restantes); o limite máximo é aplicado.
- A IA explica conceitos, mas suas respostas podem ter falhas e precisam ser verificadas contra o SRD/livro de regras.
- Interface/rotas preparadas, mas não houve ainda teste integrado em Vercel Preview e Supabase.

## Antes de testar
1. Supabase SQL Editor: executar `supabase/004_personagens_dnd.sql` no banco já configurado.
2. Aguardar deploy Preview da branch `feature/mesa-redesign-v1`.
3. Entrar com uma conta de teste, abrir **Personagens**, criar personagem, usar 27 pontos, salvar.
4. Recarregar página: reabrir Personagens, conferir persistência; editar e excluir; testar usuário diferente não acessar fichas de terceiros.
5. Testar Tutor D&D com pergunta como "Como funciona um teste de habilidade?" e verificar resposta.
6. Testar novamente o gerador, os dados, o histórico e o fluxo de login. Só publicar após concluir os testes.

## Próximas etapas
- Seleção de classe, espécie, antecedente a partir das referências permitidas do SRD.
- Bônus de antecedentes conforme regras 2024 (somente opções autorizadas e validadas).
- Atributos finais, PV, CA, deslocamento, proficiências, perícias, equipamentos, magias, talentos.
- Modo de compra de pontos, arranjo padrão ou rolagem 4d6 descartando menor.
- Roteiros didáticos da IA com fontes confiáveis e verificação de regras.
