#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "╔══════════════════════════════════════╗"
echo "║   Sono Leve — Atualização            ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "1/3 → Baixando atualizações..."
git pull

echo ""
echo "2/3 → Reconstruindo e reiniciando containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "3/3 → Limpando imagens antigas..."
docker image prune -f

echo ""
echo "✅ Atualização concluída em $(date '+%d/%m/%Y %H:%M:%S')"
echo ""
docker compose -f docker-compose.prod.yml ps
