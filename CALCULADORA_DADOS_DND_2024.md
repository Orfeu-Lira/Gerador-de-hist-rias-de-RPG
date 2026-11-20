# Mesa — Calculadora de dados D&D 5e (2024)

## Fluxos disponíveis
A aba Dados permite rolagens livres, ataque, teste/resistência, dano e cura, com modificador de atributo, bônus de proficiência e outros bônus/penalidades. O RPG Solo utiliza o mesmo módulo de regras para interpretar rolagens, com valores sorteados pelo servidor.

### Ataques e testes
- **Ataque:** role 1d20, aplique os bônus e compare o total com a CA informada. 20 natural acerta e causa crítico independentemente da CA; 1 natural erra. Vantagem/desvantagem usa o maior/menor dos dois d20.
- **Teste/resistência:** compare com a CD informada. 20 natural não é sucesso automático nem 1 natural falha automática em testes de atributo e resistência.
- Depois de acertar, use **Preparar dano do ataque**. Se for crítico, o Mesa marcará automaticamente o campo de dano crítico. A proficiência é removida da rolagem de dano preparada; o jogador deve confirmar quais dados e bônus sua arma/magia utiliza.

### Dano
- Role os dados principais, os dados adicionais e some bônus fixos/penalidades.
- **Acerto crítico:** dobre os dados principais e adicionais; **não dobre os bônus fixos**.
- **Redução fixa:** subtraia primeiro e limite o dano a zero.
- **Resistência:** divida o dano por 2, arredondando para baixo.
- **Vulnerabilidade:** dobre o dano restante, depois de aplicar a resistência.
- **Imunidade:** dano final zero para aquele tipo.
- Esses controles se referem a **uma única parcela de dano de um tipo**. Caso um ataque cause dano cortante + ígneo, realize as contas separadamente para aplicar as respectivas proteções corretamente.

### Exemplo calculado
Dano de uma fonte: 1d8 (rolou 7) + 1d6 (rolou 5) + 3 fixos = 15. Se houver redução fixa de 2, resistência e vulnerabilidade, a conta é 15 - 2 = 13; resistência: piso(13 / 2) = 6; vulnerabilidade: 6 × 2 = **12**.

Exemplo de crítico: 1d8 + 1d6 + 4 passa a 2d8 + 2d6 + 4. Os bônus fixos não são duplicados.

## Cobertura de testes
Os testes determinísticos ficam em `tests/dice-rules.test.cjs`, executados pelo GitHub Actions. Cobrem cálculo normal, crítico, bônus negativos, piso zero, CA/CD, ataques naturais, vantagem/desvantagem, redução fixa, resistência, vulnerabilidade e imunidade.

A animação e o efeito sonoro de dados permanecem separados do resultado matemático. O RNG local usa `crypto.getRandomValues` quando disponível, e o RPG Solo usa `crypto.randomInt` no backend.

## Limitações
- A calculadora não substitui decisões do mestre nem interpreta automaticamente talentos, classes, tipos de arma, immunidades específicas, salvamentos que reduzam dano, dano de efeitos contínuos, resistências condicionais ou regras opcionais.
- Não busca automaticamente a CA da criatura nem a ficha do personagem; os valores são informados pelo jogador ou mestre.
- Em dano misto, calcule cada tipo separadamente.
- A IA que narra o modo Solo solicita rolagens estruturadas, mas o mestre deve verificar se os adicionais e dificuldades propostos estão corretos.

## Referência de regras
- D&D Free Rules (2024), Playing the Game: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game
- Glossário: https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary

Esse documento descreve a implementação do Mesa, sem reproduzir integralmente material protegido por direitos autorais.
