# Segurança do Mesa

Se você descobrir uma possível vulnerabilidade que possa expor contas, campanhas, dados pessoais, chaves ou infraestrutura do Mesa, **não publique detalhes técnicos exploráveis em uma issue pública**.

Envie um relato privado para **matheusrenner323@gmail.com** com informações suficientes para reproduzir o problema sem afetar outras contas. Não envie senhas, tokens ou dados de terceiros.

O contato serve para análise e correção. Não há compromisso de prazo de resposta nem programa público de recompensa em dinheiro.

## Diretrizes para colaboradores
- Nunca commit senhas, arquivos de ambiente, chaves de IA, chaves administrativas, certificados privados ou tokens.
- Não exponha credenciais do banco ou endpoints administrativos no frontend.
- Preserve autenticação e autorização no servidor, verificando o dono de cada registro.
- Use parâmetros SQL, valide entradas e arquivos, limite abuso e atualize dependências.
- Não reproduza ataques em contas alheias, nem realize testes de carga em produção.
- Se uma credencial aparecer no Git, revogue-a ou rotacione-a; apagar o arquivo não apaga o histórico.

Este documento não afirma que o sistema está livre de vulnerabilidades.
