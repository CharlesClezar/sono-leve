#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

echo "╔══════════════════════════════════════╗"
echo "║   Sono Leve — Setup do Servidor      ║"
echo "║   (execute apenas uma vez)           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Verificar .env
if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado."
  echo "   Copie .env.example para .env e preencha os valores antes de continuar."
  exit 1
fi

# Carregar variáveis do .env
set -a; source .env; set +a

# 1. Criar rede compartilhada
echo "1/3 → Rede Docker 'infra'..."
if docker network inspect infra >/dev/null 2>&1; then
  echo "     ✓ já existe"
else
  docker network create infra
  echo "     ✓ criada"
fi

# 2. Subir postgres-shared
echo "2/3 → Postgres compartilhado..."
if docker ps --filter "name=postgres-shared" --filter "status=running" | grep -q "postgres-shared"; then
  echo "     ✓ já está rodando"
else
  docker compose -f infra/docker-compose.yml --env-file .env up -d

  echo -n "     aguardando ficar saudável"
  until docker exec postgres-shared pg_isready -U postgres >/dev/null 2>&1; do
    echo -n "."
    sleep 2
  done
  echo " ✓"
fi

# 3. Criar banco de dados
echo "3/3 → Banco de dados '${POSTGRES_DB}'..."
if docker exec postgres-shared psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "${POSTGRES_DB}"; then
  echo "     ✓ já existe"
else
  docker exec postgres-shared psql -U postgres -c "CREATE DATABASE ${POSTGRES_DB};"
  echo "     ✓ criado"
fi

echo ""
echo "✅ Setup concluído! Para fazer deploy agora (e toda vez):"
echo ""
echo "   ./infra/update.sh"
echo ""
echo "Para agendar backup diário, rode: crontab -e"
echo "E adicione a linha (backup às 03:00):"
echo "   0 3 * * * ${PROJECT_DIR}/infra/backup.sh"
echo ""
