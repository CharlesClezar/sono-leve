#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

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
    echo "  Abortado. Para atualizar o deploy, use: ./infra/update.sh"
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

# ─── Rede Docker ──────────────────────────────────────────────────────────────
echo ""
echo "  Configurando rede Docker..."
if docker network inspect infra >/dev/null 2>&1; then
  ok "Rede 'infra' já existe"
else
  docker network create infra >/dev/null
  ok "Rede 'infra' criada"
fi

# ─── PostgreSQL ───────────────────────────────────────────────────────────────
echo ""
echo "  Iniciando PostgreSQL..."
if docker ps --filter "name=^postgres$" --filter "status=running" --format "{{.Names}}" | grep -q "^postgres$"; then
  ok "PostgreSQL já está rodando"
else
  docker compose -f infra/docker-compose.yml --env-file .env up -d >/dev/null 2>&1
  echo -n "  aguardando ficar saudável"
  until docker exec postgres pg_isready -U postgres >/dev/null 2>&1; do
    echo -n "."; sleep 2
  done
  echo ""
  ok "PostgreSQL iniciado"
fi

# ─── Banco sono_leve ──────────────────────────────────────────────────────────
echo ""
echo "  Criando banco de dados..."
if docker exec postgres psql -U postgres -lqt | cut -d'|' -f1 | grep -qw "sono_leve"; then
  ok "Banco 'sono_leve' já existe"
else
  docker exec postgres psql -U postgres -c "CREATE DATABASE sono_leve;" >/dev/null
  ok "Banco 'sono_leve' criado"
fi

# ─── Primeiro deploy ──────────────────────────────────────────────────────────
echo ""
echo "  Fazendo primeiro deploy (isso leva alguns minutos)..."
echo ""
./infra/update.sh

# ─── Dados iniciais ───────────────────────────────────────────────────────────
echo ""
echo "  Aguardando banco de dados ficar pronto..."
echo -n "  "
until docker exec postgres psql -U postgres -d sono_leve -c "SELECT 1 FROM \"Clientes\" LIMIT 1" >/dev/null 2>&1; do
  echo -n "."; sleep 2
done
echo " pronto"

echo "  Inserindo catálogo e dados iniciais..."
SQL_FILE=$(mktemp)
cat > "${SQL_FILE}" << 'SQLEOF'
-- Marcas
INSERT INTO "Marcas" ("Id", "Name", "Active")
SELECT gen_random_uuid(), v."Name", true
FROM (VALUES ('Sono Leve'), ('Clelia Anastácio'), ('Thainá Reichen'), ('Ronca&Fuça')) AS v("Name")
WHERE NOT EXISTS (SELECT 1 FROM "Marcas" WHERE "Name" = v."Name");

-- Categorias
INSERT INTO "Categorias" ("Id", "Name", "Grade", "Active")
SELECT gen_random_uuid(), v."Name", v."Grade", true
FROM (VALUES
  ('Adulto Feminino',  '["PP","P","M","G","GG","50","52","54","56"]'),
  ('Adulto Masculino', '["40","42","44","46","48","50","52","54","56"]'),
  ('Infantil',         '["RN","1","2","3","4","6","8","10","12","14","16"]'),
  ('Pantufa',          '["35","36","37","38","39","40","41","42","43","44"]')
) AS v("Name", "Grade")
WHERE NOT EXISTS (SELECT 1 FROM "Categorias" WHERE "Name" = v."Name");

-- Tipos
INSERT INTO "Tipos" ("Id", "Name", "Active")
SELECT gen_random_uuid(), v."Name", true
FROM (VALUES ('Camisola'), ('Conjunto'), ('Macacão'), ('Pantufa'), ('Pescador')) AS v("Name")
WHERE NOT EXISTS (SELECT 1 FROM "Tipos" WHERE "Name" = v."Name");

-- Subtipos
INSERT INTO "Subtipos" ("Id", "Name", "Active")
SELECT gen_random_uuid(), v."Name", true
FROM (VALUES ('Alça'), ('Regata'), ('Manga Curta'), ('Manga Longa')) AS v("Name")
WHERE NOT EXISTS (SELECT 1 FROM "Subtipos" WHERE "Name" = v."Name");

-- Coleções
INSERT INTO "Colecoes" ("Id", "Name", "DataInicio", "DataFim", "Active")
SELECT gen_random_uuid(), v."Name", v."DataInicio"::date, v."DataFim"::date, true
FROM (VALUES
  ('Inverno 2025', '2025-06-01', '2025-08-31'),
  ('Outono 2025',  '2025-03-01', '2025-05-31'),
  ('Verão 2025',   '2024-12-01', '2025-02-28'),
  ('Básico',       NULL::text,   NULL::text)
) AS v("Name", "DataInicio", "DataFim")
WHERE NOT EXISTS (SELECT 1 FROM "Colecoes" WHERE "Name" = v."Name");

-- Formas de pagamento
INSERT INTO "FormasPagamento" ("Id", "Nome", "Tipo", "PermiteParcelamento", "ExigeBandeira", "Ativo", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(), v."Nome", v."Tipo", v."Parcel"::bool, v."Exige"::bool, v."Ativo"::bool, NOW(), NOW()
FROM (VALUES
  ('Pix',            'Pix',      'false', 'false', 'true'),
  ('Dinheiro',       'Dinheiro', 'false', 'false', 'true'),
  ('Cartão Débito',  'Debito',   'false', 'true',  'true'),
  ('Cartão Crédito', 'Credito',  'true',  'true',  'true'),
  ('Boleto',         'Boleto',   'false', 'false', 'false')
) AS v("Nome", "Tipo", "Parcel", "Exige", "Ativo")
WHERE NOT EXISTS (SELECT 1 FROM "FormasPagamento" WHERE "Nome" = v."Nome");

-- Bandeiras de cartão
INSERT INTO "BandeirasCartao" ("Id", "Nome", "Ativo", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(), v."Nome", true, NOW(), NOW()
FROM (VALUES ('Visa'), ('Mastercard'), ('Elo'), ('Hipercard'), ('American Express')) AS v("Nome")
WHERE NOT EXISTS (SELECT 1 FROM "BandeirasCartao" WHERE "Nome" = v."Nome");

-- Cliente padrão para varejo sem identificação
INSERT INTO "Clientes" ("Id", "Nome", "Telefone", "Cpf", "Tipo", "Status", "Credito", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(), 'CONSUMIDOR FINAL', '', '', 0, 'Ativo', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Clientes" WHERE "Nome" = 'CONSUMIDOR FINAL');
SQLEOF

docker exec -i postgres psql -U postgres -d sono_leve < "${SQL_FILE}" >/dev/null
rm -f "${SQL_FILE}"
ok "Catálogo e dados iniciais inseridos"

# ─── Agendar backup ───────────────────────────────────────────────────────────
echo ""
echo "  Agendando backup diário às ${BACKUP_HORA}h..."
CRON_JOB="0 ${BACKUP_HORA} * * * ${SCRIPT_DIR}/infra/backup.sh"
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
echo "  Deploy:   ./infra/update.sh"
echo ""
