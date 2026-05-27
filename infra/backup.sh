#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${HOME}/backups/sono-leve"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
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
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "→ Iniciando backup do banco '${POSTGRES_DB}'..."

docker exec postgres \
  pg_dump -U postgres "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "✓ Backup salvo: $(basename "${BACKUP_FILE}") (${SIZE})"

# Remover backups antigos
REMOVED=$(find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
[ "${REMOVED}" -gt 0 ] && log "→ ${REMOVED} backup(s) antigo(s) removido(s)"

COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" | wc -l)
log "✓ Total de backups mantidos: ${COUNT} (últimos ${RETENTION_DAYS} dias)"
