#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1m'; N='\033[0m'
ok()   { echo -e "  ${G}✓${N}  $1"; }
warn() { echo -e "  ${Y}⚠${N}  $1"; }
sep()  { echo -e "\n${B}  ── $1${N}"; }

echo ""
echo -e "${R}  ╔══════════════════════════════════════════════╗${N}"
echo -e "${R}  ║       Sono Leve — Desinstalação              ║${N}"
echo -e "${R}  ╚══════════════════════════════════════════════╝${N}"
echo ""
warn "Isso vai remover containers, volumes, imagens Docker, dados e configurações."
warn "Os backups em ~/backups/sono-leve/ NÃO serão apagados."
echo ""
read -rp "  Tem certeza? Digite 'sim' para confirmar: " CONFIRMA
if [[ "${CONFIRMA}" != "sim" ]]; then
  echo ""
  echo "  Abortado."
  exit 0
fi

# ─── Containers e volumes ─────────────────────────────────────────────────────
sep "Containers e volumes"
if [ -f .env ]; then
  docker compose -f docker-compose.prod.yml --env-file .env down -v --remove-orphans 2>/dev/null || true
else
  docker compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
fi
ok "Containers e volumes removidos"

# ─── Imagens Docker ───────────────────────────────────────────────────────────
sep "Imagens Docker"
docker rmi sono-leve-api sono-leve-frontend 2>/dev/null && ok "Imagens removidas" || warn "Imagens não encontradas"
docker image prune -f >/dev/null 2>&1 || true

# ─── Dados locais ─────────────────────────────────────────────────────────────
sep "Dados e configurações"
if [ -d "${PROJECT_DIR}/data" ]; then
  # O Docker cria data/ e subpastas como root; tenta rm normal e cai para sudo se necessário
  if rm -rf "${PROJECT_DIR}/data" 2>/dev/null; then
    ok "Diretório data/ removido"
  elif command -v sudo &>/dev/null && sudo rm -rf "${PROJECT_DIR}/data"; then
    ok "Diretório data/ removido (sudo)"
  else
    warn "Não foi possível remover data/ automaticamente. Execute: sudo rm -rf ${PROJECT_DIR}/data"
  fi
fi
if [ -f "${PROJECT_DIR}/.env" ]; then
  rm -f "${PROJECT_DIR}/.env"
  ok ".env removido"
fi

# ─── Cron ─────────────────────────────────────────────────────────────────────
sep "Cron de backup"
( crontab -l 2>/dev/null | grep -v "sono-leve.*backup.sh" || true ) | crontab -
ok "Cron de backup removido"

# ─── Resumo ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}  ╔══════════════════════════════════════════════╗${N}"
echo -e "${G}  ║          ✅  Desinstalação concluída!        ║${N}"
echo -e "${G}  ╚══════════════════════════════════════════════╝${N}"
echo ""
warn "Backups preservados em: ~/backups/sono-leve/"
echo -e "  Para reinstalar: ${B}scripts/install.sh${N}"
echo ""
