#!/usr/bin/env bash
# Conferência LOCAL de um backup lógico do PostgreSQL em formato custom/tar.
# NÃO conecta ao Supabase e NÃO restaura ou apaga dados.
# Uso: bash tests/verify-backup-archive.sh ./backup-mesa.dump
set -euo pipefail
if [ "$#" -ne 1 ] || [ ! -f "$1" ] || [ ! -s "$1" ]; then
  echo "Informe caminho de um backup existente e não vazio." >&2
  exit 2
fi
if ! command -v pg_restore >/dev/null 2>&1; then
  echo "Instale o cliente PostgreSQL para disponibilizar pg_restore." >&2
  exit 2
fi
listagem="$(mktemp)"
trap 'rm -f "$listagem"' EXIT
pg_restore --list "$1" > "$listagem" || {
  echo "Backup não reconhecido ou arquivo corrompido." >&2
  exit 1
}
faltou=0
for tabela in usuarios aventuras personagens_dnd personagem_avatares mesa_solo_campanhas mesa_solo_mensagens; do
  if ! grep -Eq " TABLE (DATA )?public ${tabela} " "$listagem"; then
    echo "FALTA estrutura da tabela essencial: ${tabela}" >&2
    faltou=1
  else
    echo "OK: estrutura de ${tabela} presente no catálogo do arquivo."
  fi
done
if [ "$faltou" -ne 0 ]; then
  echo "Backup incompleto. Não restaurar em produção." >&2
  exit 1
fi
echo "Catálogo do backup parece conter as tabelas principais."
echo "ATENÇÃO: isso NÃO comprova restauração funcional, integridade dos dados, arquivos de avatares ou agendamento de backup."
echo "Realize ensaio de restauração em banco NOVO e isolado, nunca sobre produção."
