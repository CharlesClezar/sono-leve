#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

echo "╔══════════════════════════════════════╗"
echo "║   Sono Leve — Atualização            ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "1/3 → Baixando atualizações..."
git pull

echo ""
echo "2/3 → Reconstruindo e reiniciando containers..."
docker compose -f infra/docker-compose.prod.yml --env-file .env up -d --build

echo ""
echo "3/3 → Limpando imagens antigas..."
docker image prune -f

echo ""
echo "✅ Atualização concluída em $(date '+%d/%m/%Y %H:%M:%S')"
echo ""
docker compose -f infra/docker-compose.prod.yml --env-file .env ps
