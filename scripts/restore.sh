#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${HOME}/backups/sono-leve"

R='\033[0;31m'; Y='\033[1;33m'; G='\033[0;32m'; N='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       Sono Leve — Restaurar Backup           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Verificar backups disponíveis ────────────────────────────────────────────
if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls "${BACKUP_DIR}"/*.sql.gz 2>/dev/null)" ]; then
  echo -e "${R}❌ Nenhum backup encontrado em ${BACKUP_DIR}${N}"
  exit 1
fi

ULTIMO_BACKUP=$(ls -t "${BACKUP_DIR}"/*.sql.gz | head -1)
NOME_ARQUIVO=$(basename "${ULTIMO_BACKUP}")
DATA_ARQUIVO=$(echo "${NOME_ARQUIVO}" | grep -oP '\d{8}_\d{6}' | \
  sed 's/\(....\)\(..\)\(..\)_\(..\)\(..\)\(..\)/\3\/\2\/\1 \4:\5:\6/')
TAMANHO=$(du -sh "${ULTIMO_BACKUP}" | cut -f1)

echo -e "${Y}  ⚠ ATENÇÃO: Esta operação substituirá todos os dados atuais do banco.${N}"
echo ""
echo "  Backup a restaurar:"
echo "    Arquivo : ${NOME_ARQUIVO}"
echo "    Data    : ${DATA_ARQUIVO}"
echo "    Tamanho : ${TAMANHO}"
echo ""

read -rp "  Confirmar restauração? (s/N): " CONFIRMAR
if [[ ! "${CONFIRMAR}" =~ ^[Ss]$ ]]; then
  echo "  Cancelado."
  exit 0
fi

# ─── Autenticação ─────────────────────────────────────────────────────────────
echo ""
read -rsp "  Senha do PostgreSQL: " SENHA_DIGITADA; echo ""

if ! docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres\
    psql -U postgres -c '\q' >/dev/null 2>&1; then
  echo -e "${R}❌ Senha incorreta.${N}"
  exit 1
fi

echo -e "${G}  ✓ Autenticado${N}"

# ─── Restaurar ────────────────────────────────────────────────────────────────
echo ""
echo "  Restaurando..."

# Terminar conexões ativas no banco
docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres\
  psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sono_leve' AND pid <> pg_backend_pid();" \
  >/dev/null 2>&1 || true

# Recriar banco limpo
docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres\
  psql -U postgres -c "DROP DATABASE IF EXISTS sono_leve;" >/dev/null
docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres\
  psql -U postgres -c "CREATE DATABASE sono_leve;" >/dev/null

# Restaurar dump
gunzip -c "${ULTIMO_BACKUP}" | \
  docker exec -i -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres \
  psql -U postgres sono_leve >/dev/null

echo -e "${G}  ✓ Banco restaurado com sucesso${N}"
echo ""
echo "  Backup aplicado: ${NOME_ARQUIVO}"
echo ""
