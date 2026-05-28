#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
ok()  { echo -e "${G}  ✓ $1${N}"; }
warn(){ echo -e "${Y}  ⚠ $1${N}"; }
err() { echo -e "${R}  ❌ $1${N}"; }

echo "╔══════════════════════════════════════════════╗"
echo "║       Sono Leve — Desinstalação              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
warn "Isso vai remover containers, volumes, imagens Docker, dados e configurações."
warn "Os backups em ~/backups/sono-leve/ NÃO serão apagados."
echo ""
read -rp "  Tem certeza? Digite 'sim' para confirmar: " CONFIRMA
if [[ "${CONFIRMA}" != "sim" ]]; then
  echo "  Abortado."
  exit 0
fi

echo ""

# ─── Parar e remover containers da aplicação ──────────────────────────────────
echo "  Parando containers da aplicação..."
if [ -f .env ]; then
  docker compose -f docker-compose.prod.yml --env-file .env down --remove-orphans 2>/dev/null || true
  ok "Containers da aplicação removidos"
else
  warn ".env não encontrado, pulando containers da aplicação"
fi

# ─── Parar e remover PostgreSQL + volume ──────────────────────────────────────
echo "  Parando PostgreSQL e removendo volume..."
docker compose -f docker-compose.yml down -v --remove-orphans 2>/dev/null || true
ok "PostgreSQL e volume removidos"

# ─── Remover rede Docker ──────────────────────────────────────────────────────
echo "  Removendo rede Docker 'infra'..."
docker network rm infra 2>/dev/null && ok "Rede 'infra' removida" || warn "Rede 'infra' não encontrada ou em uso por outro serviço"

# ─── Remover imagens Docker ───────────────────────────────────────────────────
echo "  Removendo imagens Docker da aplicação..."
docker rmi sono-leve-api sono-leve-frontend 2>/dev/null && ok "Imagens removidas" || warn "Imagens não encontradas (já removidas)"
docker image prune -f >/dev/null 2>&1 || true

# ─── Remover dados de imagens de produtos ─────────────────────────────────────
echo "  Removendo dados de imagens de produtos..."
if [ -d "${PROJECT_DIR}/data" ]; then
  rm -rf "${PROJECT_DIR}/data"
  ok "Diretório data/ removido"
else
  warn "Diretório data/ não encontrado"
fi

# ─── Remover .env ─────────────────────────────────────────────────────────────
echo "  Removendo .env..."
if [ -f "${PROJECT_DIR}/.env" ]; then
  rm -f "${PROJECT_DIR}/.env"
  ok ".env removido"
else
  warn ".env não encontrado"
fi

# ─── Remover cron de backup ───────────────────────────────────────────────────
echo "  Removendo cron de backup..."
( crontab -l 2>/dev/null | grep -v "sono-leve.*backup.sh" || true ) | crontab -
ok "Cron de backup removido"

# ─── Resumo ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          ✅  Desinstalação concluída!        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
warn "Backups preservados em: ~/backups/sono-leve/"
echo "  Para reinstalar: ./install.sh"
echo ""
