# Mesa — plano de teste de carga inspirado no vídeo (2026-11-13)

## O que o vídeo propõe
Em vez de comemorar quando o aplicativo funciona com uma pessoa, testar a experiência sob acessos simultâneos, medir a latência da API, identificar gargalos em cache, índices e consultas, corrigir e repetir o teste. O vídeo menciona um exemplo de 100 usuários virtuais durante cerca de 10 minutos e ressalta que escalar a 1.000 usuários não pode ser apenas uma promessa.

## Melhorias implementadas
- **Cache curto de informações públicas** (`GET /api/publico/informacoes`): 15 segundos por instância, combinando requisições simultâneas. Não armazena contas, dados de sessão, avatares, fichas, campanhas ou respostas privadas.
- **Índices no PostgreSQL**: `mesa_conteudos_publicados_atualizacao_idx` acompanha a lista pública por atualização; `aventuras_usuario_id_desc_idx` acompanha histórico de aventuras ordenado por ID.
- **Cenário k6 progressivo** em `tests/load-staging.js`: 10 -> 30 -> 100 usuários virtuais por 10 minutos, GET somente para `/api/health` e `/api/publico/informacoes`. Medidas: erro, p95, tempo por endpoint. O script recusa os domínios de produção conhecidos e exige confirmação explícita.
- **Simulação matemática offline** anterior em `tests/simulacao_carga.py`, apenas para estimar filas, não para medir a infraestrutura.

## Como executar de forma responsável
1. Criar deployment de **homologação com banco isolado**; a URL de Preview da Vercel por si só **não** garante isolamento do banco ou das variáveis do ambiente de produção.
2. Instalar k6 em uma máquina com acesso à rede.
3. Autorizar e executar: `k6 run -e BASE_URL=https://sua-homologacao.vercel.app -e MESA_LOAD_TEST_APPROVED=yes tests/load-staging.js`
4. Conferir: p50/p95/p99, falhas HTTP, aumento de latência, timeouts, CPU/memória no Vercel, conexões e consultas lentas do PostgreSQL.
5. Reduzir carga ou interromper ao detectar falhas graves. Repetir depois das correções.
6. Para testar o Gemini, usar um **ensaio separado e autorizado**, com orçamento, cotas e limites definidos; este script não usa IA nem escreve dados.

## O que foi verificado nesta etapa
- Índices novos foram criados no Supabase e conferidos por nome.
- Código JavaScript do servidor passou na verificação de sintaxe.
- Deploy foi submetido ao Vercel e seu estado precisa ser confirmado.
- **Nenhum teste real com 100 usuários foi feito contra o Mesa.** A execução precisa de ambiente isolado.

## Restrições e limites
Os usuários virtuais representam requisições de leitura, não sessões autenticadas. Os limites reais do Gemini, a experiência com 1.000 usuários, a concorrência de escrita, a recuperação sob falhas e a velocidade em diferentes regiões **continuam desconhecidos**. Um cache curto não equivale a garantia de escala. Não há licença para bombardear a aplicação pública.
