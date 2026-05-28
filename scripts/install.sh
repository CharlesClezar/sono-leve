#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

# ─── Cores ────────────────────────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; R='\033[0;31m'; N='\033[0m'
ok()  { echo -e "${G}  ✓ $1${N}"; }
ask() { echo -e "${C}$1${N}"; }
err() { echo -e "${R}  ❌ $1${N}"; }

clear
echo "╔══════════════════════════════════════════════╗"
echo "║       Sono Leve — Instalação do Servidor     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Pré-requisitos ───────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  err "Docker não encontrado. Instale o Docker antes de continuar."
  exit 1
fi
ok "Docker encontrado ($(docker --version | cut -d' ' -f3 | tr -d ','))"

if [ -f .env ]; then
  echo ""
  echo -e "${Y}  ⚠ Arquivo .env já existe.${N}"
  read -rp "  Sobrescrever e reconfigurar tudo? (s/N): " RESET
  if [[ ! "${RESET}" =~ ^[Ss]$ ]]; then
    echo "  Abortado. Para atualizar o deploy, use: scripts/update.sh"
    exit 0
  fi
fi

# ─── Banco de dados ───────────────────────────────────────────────────────────
echo ""
ask "═══ Banco de Dados ════════════════════════════"
echo ""

while true; do
  read -rsp "  Senha do PostgreSQL: " POSTGRES_PASSWORD; echo ""
  [ -n "${POSTGRES_PASSWORD}" ] && break
  err "A senha não pode ser vazia."
done

# ─── JWT ──────────────────────────────────────────────────────────────────────
echo ""
ask "═══ Segurança ══════════════════════════════════"
echo ""

read -rp "  Segredo JWT [Enter para gerar automaticamente]: " JWT_SEGREDO
if [ -z "${JWT_SEGREDO}" ]; then
  JWT_SEGREDO=$(openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-48)
  ok "JWT_SEGREDO gerado automaticamente"
fi

# ─── Rede e portas ────────────────────────────────────────────────────────────
echo ""
ask "═══ Acesso ══════════════════════════════════════"
echo ""

echo "  Qual é a URL que os usuários vão acessar?"
echo "  (ex: http://100.90.205.102:3010 ou https://meudominio.com)"
while true; do
  read -rp "  URL do frontend: " CORS_ORIGENS
  [ -n "${CORS_ORIGENS}" ] && break
  err "A URL não pode ser vazia."
done

echo ""
read -rp "  Porta da API      [padrão: 5010]: " API_PORTA
API_PORTA="${API_PORTA:-5010}"

read -rp "  Porta do Frontend [padrão: 3010]: " FRONTEND_PORTA
FRONTEND_PORTA="${FRONTEND_PORTA:-3010}"

# ─── Backup ───────────────────────────────────────────────────────────────────
echo ""
ask "═══ Backup Automático ════════════════════════════"
echo ""

read -rp "  Horário do backup diário, 0-23h [padrão: 3]: " BACKUP_HORA
BACKUP_HORA="${BACKUP_HORA:-3}"
if ! [[ "${BACKUP_HORA}" =~ ^[0-9]+$ ]] || [ "${BACKUP_HORA}" -gt 23 ]; then
  err "Horário inválido, usando 3h."
  BACKUP_HORA=3
fi

# ─── Criar .env ───────────────────────────────────────────────────────────────
echo ""
echo "  Criando .env..."

cat > .env <<EOF
# ─── Banco de Dados ────────────────────────────────────────────────────────────
POSTGRES_DB=sono_leve
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# ─── API ───────────────────────────────────────────────────────────────────────
API_PORTA=${API_PORTA}

# ─── JWT ───────────────────────────────────────────────────────────────────────
JWT_SEGREDO=${JWT_SEGREDO}
JWT_EXPIRACAO_MINUTOS=15
JWT_EXPIRACAO_REFRESH_DIAS=7

# ─── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGENS=${CORS_ORIGENS}

# ─── Frontend ──────────────────────────────────────────────────────────────────
FRONTEND_PORTA=${FRONTEND_PORTA}
EOF

ok ".env criado"

# ─── Primeiro deploy ──────────────────────────────────────────────────────────
echo ""
echo "  Fazendo primeiro deploy (isso leva alguns minutos)..."
echo ""
"${SCRIPT_DIR}/update.sh"

# ─── Dados iniciais ───────────────────────────────────────────────────────────
echo ""
echo "  Aguardando banco de dados ficar pronto..."
echo -n "  "
until docker exec sono-leve-postgres psql -U postgres -d sono_leve -c "SELECT 1 FROM \"Clientes\" LIMIT 1" >/dev/null 2>&1; do
  echo -n "."; sleep 2
done
echo " pronto"

echo "  Inserindo catálogo e dados iniciais..."
docker exec -i sono-leve-postgres psql -U postgres -d sono_leve < "${SCRIPT_DIR}/sql/seed.sql" >/dev/null
ok "Catálogo e dados iniciais inseridos"

# ─── Agendar backup ───────────────────────────────────────────────────────────
echo ""
echo "  Agendando backup diário às ${BACKUP_HORA}h..."
CRON_JOB="0 ${BACKUP_HORA} * * * ${SCRIPT_DIR}/backup.sh"
( crontab -l 2>/dev/null | grep -v "sono-leve.*backup.sh" || true; echo "${CRON_JOB}" ) | crontab -
ok "Backup agendado (logs em ~/backups/sono-leve/backup.log)"

# ─── Resumo final ─────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          ✅  Instalação concluída!           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo -e "  Acesse: ${G}${CORS_ORIGENS}${N}"
echo ""
echo "  Backup:   diário às ${BACKUP_HORA}h  →  ~/backups/sono-leve/"
echo "  Deploy:   scripts/update.sh"
echo ""
