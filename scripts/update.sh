#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

echo "╔══════════════════════════════════════╗"
echo "║   Sono Leve — Atualização            ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "1/4 → Backup antes do deploy..."
if docker ps --filter "name=^sono-leve-postgres$" --filter "status=running" --format "{{.Names}}" | grep -q "^sono-leve-postgres$"; then
  "${SCRIPT_DIR}/backup.sh"
else
  echo "  postgres não está rodando, pulando backup."
fi

echo ""
echo "2/4 → Baixando atualizações..."
git pull

echo ""
echo "3/4 → Reconstruindo e reiniciando containers..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo ""
echo "4/4 → Limpando imagens antigas..."
docker image prune -f

echo ""
echo "✅ Atualização concluída em $(date '+%d/%m/%Y %H:%M:%S')"
echo ""
docker compose -f docker-compose.prod.yml --env-file .env ps
