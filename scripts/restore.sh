#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${HOME}/backups/sono-leve"

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1m'; N='\033[0m'
ok()   { echo -e "  ${G}✓${N}  $1"; }
warn() { echo -e "  ${Y}⚠${N}  $1"; }
err()  { echo -e "  ${R}✗${N}  $1"; }
sep()  { echo -e "\n${B}  ── $1${N}"; }

echo ""
echo -e "${Y}  ╔══════════════════════════════════════════════╗${N}"
echo -e "${Y}  ║       Sono Leve — Restaurar Backup           ║${N}"
echo -e "${Y}  ╚══════════════════════════════════════════════╝${N}"
echo ""

# ─── Verificar backups disponíveis ────────────────────────────────────────────
if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls "${BACKUP_DIR}"/*.sql.gz 2>/dev/null)" ]; then
  err "Nenhum backup encontrado em ${BACKUP_DIR}"
  exit 1
fi

ULTIMO_BACKUP=$(ls -t "${BACKUP_DIR}"/*.sql.gz | head -1)
NOME_ARQUIVO=$(basename "${ULTIMO_BACKUP}")
DATA_ARQUIVO=$(echo "${NOME_ARQUIVO}" | grep -oP '\d{8}_\d{6}' | \
  sed 's/\(....\)\(..\)\(..\)_\(..\)\(..\)\(..\)/\3\/\2\/\1 \4:\5:\6/')
TAMANHO=$(du -sh "${ULTIMO_BACKUP}" | cut -f1)

warn "ATENÇÃO: Esta operação substituirá todos os dados atuais do banco."
echo ""
echo -e "  Backup a restaurar:"
echo -e "    Arquivo : ${B}${NOME_ARQUIVO}${N}"
echo -e "    Data    : ${DATA_ARQUIVO}"
echo -e "    Tamanho : ${TAMANHO}"
echo ""
read -rp "  Confirmar restauração? (s/N): " CONFIRMAR
if [[ ! "${CONFIRMAR}" =~ ^[Ss]$ ]]; then
  echo "  Cancelado."
  exit 0
fi

# ─── Autenticação ─────────────────────────────────────────────────────────────
sep "Autenticação"
echo ""
read -rsp "  Senha do PostgreSQL: " SENHA_DIGITADA; echo ""

if ! docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres \
    psql -U postgres -c '\q' >/dev/null 2>&1; then
  err "Senha incorreta."
  exit 1
fi
ok "Autenticado"

# ─── Restaurar ────────────────────────────────────────────────────────────────
sep "Restaurando banco"
echo ""

docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres \
  psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sono_leve' AND pid <> pg_backend_pid();" \
  >/dev/null 2>&1 || true

docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres \
  psql -U postgres -c "DROP DATABASE IF EXISTS sono_leve;" >/dev/null

docker exec -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres \
  psql -U postgres -c "CREATE DATABASE sono_leve;" >/dev/null

gunzip -c "${ULTIMO_BACKUP}" | \
  docker exec -i -e PGPASSWORD="${SENHA_DIGITADA}" sono-leve-postgres \
  psql -U postgres sono_leve >/dev/null

echo ""
echo -e "${G}  ╔══════════════════════════════════════════════╗${N}"
echo -e "${G}  ║      ✅  Banco restaurado com sucesso!       ║${N}"
echo -e "${G}  ╚══════════════════════════════════════════════╝${N}"
echo ""
echo -e "  Backup aplicado: ${B}${NOME_ARQUIVO}${N}"
echo ""
