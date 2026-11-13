#!/usr/bin/env python3
"""Simulação matemática OFFLINE de rajadas de usuários no Mesa.

NÃO envia requisições de rede, NÃO testa capacidade real do Vercel,
Supabase ou Gemini. Os tempos e a concorrência são PREMISSAS, não benchmarks.
Uso: python tests/simulacao_carga.py
"""
import heapq
import random


def simular(usuarios, paralelo, duracao_media_s, seed=42):
    """Uma requisição por usuário, todas chegam no mesmo instante (rajada)."""
    rng = random.Random(seed)
    livres = [0.0] * paralelo
    heapq.heapify(livres)
    tempos = []
    for _ in range(usuarios):
        inicio = heapq.heappop(livres)
        duracao = duracao_media_s * rng.uniform(0.8, 1.2)
        termino = inicio + duracao
        tempos.append(termino)
        heapq.heappush(livres, termino)
    tempos.sort()
    return {
        "p50": round(tempos[int((usuarios - 1) * .50)], 2),
        "p95": round(tempos[int((usuarios - 1) * .95)], 2),
        "maior": round(tempos[-1], 2),
        "acima_30s": sum(t > 30 for t in tempos),
    }


def relatorio():
    cenarios = [
        ("Consultas ao banco", 3, .08, [20, 100, 300, 500]),
        ("Geração de IA", 5, 8., [3, 10, 30, 60]),
    ]
    print("MESA — SIMULAÇÃO DE CARGA, NÃO TESTE DE PRODUÇÃO")
    print("Rajadas simultâneas; variação da duração +-20%; premissas hipotéticas.")
    for nome, concorrencia, duracao, cargas in cenarios:
        print(f"\n{nome} | capacidade assumida={concorrencia} | média={duracao}s")
        print("usuários | p50 (s) | p95 (s) | máximo (s) | >30s")
        for usuarios in cargas:
            r = simular(usuarios, concorrencia, duracao)
            print(f"{usuarios:>8} | {r['p50']:>7.2f} | {r['p95']:>7.2f} | "
                  f"{r['maior']:>10.2f} | {r['acima_30s']:>4}")
    print("\nImportante: a quantidade real de instâncias, conexões de banco, cotas,"
          " latência de rede e limites da API Gemini não foram medidos.")


if __name__ == "__main__":
    relatorio()
