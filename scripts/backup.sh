#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${HOME}/backups/sono-leve"
RETENTION_MAX=3
TIMESTAMP=$(TZ="America/Sao_Paulo" date +"%Y%m%d_%H%M%S")
LOG_FILE="${BACKUP_DIR}/backup.log"

# Carregar variáveis do .env
if [ ! -f "${PROJECT_DIR}/.env" ]; then
  echo "❌ .env não encontrado em ${PROJECT_DIR}"
  exit 1
fi
set -a; source "${PROJECT_DIR}/.env"; set +a

BACKUP_FILE="${BACKUP_DIR}/sono_leve_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

log() {
  echo "[$(TZ="America/Sao_Paulo" date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "→ Iniciando backup do banco '${POSTGRES_DB}'..."

docker exec sono-leve-postgres \
  pg_dump -U postgres "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "✓ Backup salvo: $(basename "${BACKUP_FILE}") (${SIZE})"

# Manter apenas os últimos N backups
PARA_REMOVER=$(ls -t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -n +"$((RETENTION_MAX + 1))")
if [ -n "${PARA_REMOVER}" ]; then
  REMOVED=$(echo "${PARA_REMOVER}" | wc -l)
  echo "${PARA_REMOVER}" | xargs rm -f
  log "→ ${REMOVED} backup(s) antigo(s) removido(s)"
fi

COUNT=$(ls "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l)
log "✓ Total de backups mantidos: ${COUNT}/${RETENTION_MAX}"
