# Backend — Sono Leve

Proposta de arquitetura para substituir o mock em `localStorage` por uma API real.

---

## Stack

| Camada | Tecnologia |
|---|---|
| API | ASP.NET Core 10 — Controllers + Services + DTOs |
| ORM | Entity Framework Core 10 |
| Banco | PostgreSQL 16 |
| Auth | JWT + cookie HttpOnly |
| Validação | FluentValidation |
| Migrations | EF Core Migrations |

---

## Estrutura de Projetos

```
SonoLeve.sln
├── SonoLeve.Api/
│   ├── Controllers/           ← ex: ProdutoController, ClienteController
│   ├── DTOs/                  ← ex: ProdutoRequestDto, ProdutoResponseDto
│   └── Program.cs             ← entry point, DI, middlewares
├── SonoLeve.Application/
│   ├── Services/              ← ex: ProdutoService, VendaService
│   └── Interfaces/            ← ex: IProdutoService, IVendaService
├── SonoLeve.Domain/
│   ├── Entities/              ← ex: Produto, Cliente, Venda, Ficha
│   └── Enums/                 ← ex: StatusVenda, StatusEncomenda, TipoCliente
└── SonoLeve.Infra/
    ├── Data/                  ← DbContext, configurações do EF Core
    ├── Repositories/          ← ex: ProdutoRepository, ClienteRepository
    └── Migrations/
```

> **Convenção de nomenclatura:**
> - Diretórios e sufixos seguem o padrão de mercado em inglês: `Controllers/`, `Services/`, `DTOs/`, `Repositories/`, `Service`, `Controller`, `Dto`
> - O código em si (nomes de classe, variáveis, campos, propriedades) em português:
>   `ProdutoController`, `ClienteService`, `VendaRequestDto`, `fichaId`, `valorTotal`, `Nome`, `CriadoEm`

---

## Modelo de Dados

### Enums

```sql
-- Status de venda
CREATE TYPE sale_status AS ENUM ('Gerada', 'Cancelada');

-- Status de encomenda (exibir "Aberta" como "Novo" no front)
CREATE TYPE order_status AS ENUM (
  'Aberta', 'Em produção', 'Fabricado parcialmente',
  'Pronta', 'Entregue', 'Cancelada'
);

-- Status de ficha
CREATE TYPE ficha_status AS ENUM ('Aberta', 'Parcial', 'Finalizada', 'Cancelada');

-- Status de conta a receber
CREATE TYPE account_status AS ENUM ('Aberto', 'Parcial', 'Pago', 'Atrasado', 'Cancelado');

-- Tipo de cliente
CREATE TYPE customer_type AS ENUM ('varejo', 'atacado');

-- Origem da venda
CREATE TYPE sale_origin AS ENUM ('Balcão', 'Encomenda', 'Ficha');

-- Tipo de movimentação de estoque
CREATE TYPE stock_movement_type AS ENUM (
  'Entrada', 'Saida por venda', 'Envio para ficha',
  'Devolucao de ficha', 'Baixa por finalizacao de ficha',
  'Ajuste manual', 'Estorno por cancelamento'
);
```

---

### Tabelas

#### `customers`
```sql
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  cpf         TEXT,
  type        customer_type NOT NULL DEFAULT 'varejo',
  status      TEXT NOT NULL DEFAULT 'Ativo', -- Ativo | Inativo
  credit      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `product_brands` / `product_types` / `product_subtypes` / `product_categories` / `product_collections` / `product_models`
```sql
-- Todos os catálogos seguem a mesma estrutura base
CREATE TABLE product_brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  grade      TEXT[] NOT NULL DEFAULT '{}', -- ex: ["P","M","G","GG"]
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_subtypes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type_id    UUID NOT NULL REFERENCES product_types(id),
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_collections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  period     TEXT NOT NULL DEFAULT 'Contínua',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_models (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `products`
```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  ref             TEXT NOT NULL UNIQUE,
  brand_id        UUID NOT NULL REFERENCES product_brands(id),
  type_id         UUID NOT NULL REFERENCES product_types(id),
  subtype_id      UUID NOT NULL REFERENCES product_subtypes(id),
  category_id     UUID NOT NULL REFERENCES product_categories(id),
  collection_id   UUID REFERENCES product_collections(id),
  model_id        UUID REFERENCES product_models(id),
  price_retail    NUMERIC(12,2) NOT NULL,
  price_wholesale NUMERIC(12,2) NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `stock` (saldo por produto + tamanho)
```sql
CREATE TABLE stock (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id),
  size        TEXT NOT NULL,
  available   INT NOT NULL DEFAULT 0,
  in_ficha    INT NOT NULL DEFAULT 0,
  sold        INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, size)
);
```

#### `stock_movements`
```sql
CREATE TABLE stock_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id),
  size        TEXT NOT NULL,
  type        stock_movement_type NOT NULL,
  quantity    INT NOT NULL,           -- positivo = entrada, negativo = saída
  origin_type TEXT,                  -- 'venda' | 'encomenda' | 'ficha' | 'ajuste'
  origin_id   UUID,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `payment_methods`
```sql
CREATE TABLE payment_methods (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL,   -- Dinheiro | Pix | Cartão de débito | etc.
  allows_change       BOOLEAN NOT NULL DEFAULT FALSE,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_method_fees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  installments      INT NOT NULL DEFAULT 1,
  fee_percent       NUMERIC(6,4) NOT NULL DEFAULT 0,
  fee_fixed         NUMERIC(12,2) NOT NULL DEFAULT 0,
  days_to_receive   INT NOT NULL DEFAULT 0,
  active            BOOLEAN NOT NULL DEFAULT TRUE
);
```

#### `sales`
```sql
CREATE TABLE sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID REFERENCES customers(id),
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method_id UUID REFERENCES payment_methods(id),
  subtotal          NUMERIC(12,2) NOT NULL,
  discount_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL,
  status            sale_status NOT NULL DEFAULT 'Gerada',
  origin            sale_origin NOT NULL DEFAULT 'Balcão',
  order_id          UUID REFERENCES orders(id),       -- vínculo com encomenda
  ficha_id          UUID REFERENCES fichas(id),       -- vínculo com ficha
  cancel_reason     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  size          TEXT NOT NULL,
  quantity      INT NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL,
  discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL
);

CREATE TABLE sale_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id           UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount            NUMERIC(12,2) NOT NULL,
  change_given      NUMERIC(12,2) NOT NULL DEFAULT 0
);
```

#### `orders` (Encomendas)
```sql
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date     DATE NOT NULL,
  subtotal     NUMERIC(12,2) NOT NULL,
  total        NUMERIC(12,2) NOT NULL,
  entry        NUMERIC(12,2) NOT NULL DEFAULT 0,
  status       order_status NOT NULL DEFAULT 'Aberta',
  cancel_reason TEXT,
  notes        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id),  -- NULL se item personalizado
  description   TEXT NOT NULL,                 -- nome livre para personalizados
  size          TEXT,
  quantity      INT NOT NULL,
  quantity_made INT NOT NULL DEFAULT 0,        -- para controle de fabricado parcialmente
  unit_price    NUMERIC(12,2) NOT NULL,
  total         NUMERIC(12,2) NOT NULL
);

CREATE TABLE order_customizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `fichas`
```sql
CREATE TABLE fichas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id  UUID NOT NULL REFERENCES customers(id),
  opened_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  status       ficha_status NOT NULL DEFAULT 'Aberta',
  cancel_reason TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ficha_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id      UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  size          TEXT NOT NULL,
  quantity_sent INT NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL  -- preço atacado no momento do envio
);

CREATE TABLE ficha_returns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id    UUID NOT NULL REFERENCES fichas(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  size        TEXT NOT NULL,
  quantity    INT NOT NULL,
  returned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `accounts_receivable`
```sql
CREATE TABLE accounts_receivable (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id),
  origin_type  TEXT NOT NULL,   -- 'Venda' | 'Ficha' | 'Encomenda' | 'Ajuste manual'
  origin_id    UUID,
  total        NUMERIC(12,2) NOT NULL,
  received     NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date     DATE NOT NULL,
  status       account_status NOT NULL DEFAULT 'Aberto',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_receivable_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES accounts_receivable(id),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount            NUMERIC(12,2) NOT NULL,
  paid_at           DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_receivable_installments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts_receivable(id),
  installment  INT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  due_date     DATE NOT NULL,
  received     NUMERIC(12,2) NOT NULL DEFAULT 0,
  status       account_status NOT NULL DEFAULT 'Aberto'
);
```

#### `history_events` (auditoria global)
```sql
CREATE TABLE history_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL,   -- 'venda' | 'encomenda' | 'ficha' | 'produto' | etc.
  entity_id    UUID NOT NULL,
  action       TEXT NOT NULL,   -- 'criacao' | 'alteracao_status' | 'cancelamento' | etc.
  field        TEXT,            -- campo alterado (quando for alteração pontual)
  value_before JSONB,
  value_after  JSONB,
  notes        TEXT,
  origin       TEXT NOT NULL DEFAULT 'Sistema', -- 'Sistema' | 'Manual'
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_entity ON history_events (entity_type, entity_id);
```

#### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Endpoints

### Auth
```
POST /auth/login                → { token, user }
POST /auth/logout
GET  /auth/me
```

### Clientes
```
GET    /clientes                → lista paginada + filtros
GET    /clientes/:id
POST   /clientes                → criar
PUT    /clientes/:id            → atualizar
PATCH  /clientes/:id/status     → ativar/inativar
PATCH  /clientes/:id/credito    → ajuste manual de crédito
GET    /clientes/:id/historico
```

### Produtos — Catálogo
```
GET  /produtos/catalogo         → { categorias, marcas, tipos, subtipos, colecoes, modelos }

POST /produtos/catalogo/marcas
POST /produtos/catalogo/tipos
POST /produtos/catalogo/subtipos
POST /produtos/catalogo/categorias
POST /produtos/catalogo/colecoes
POST /produtos/catalogo/modelos

PATCH /produtos/catalogo/categorias/:id   → atualizar grade de tamanhos
PATCH /produtos/catalogo/:entidade/:id/status
```

### Produtos
```
GET    /produtos                → lista paginada com filtros (marca, tipo, categoria, status)
GET    /produtos/:id
GET    /produtos/:id/estoque    → saldo por tamanho
POST   /produtos                → criar com saldo inicial
PUT    /produtos/:id
PATCH  /produtos/:id/status     → ativar/inativar
GET    /produtos/:id/historico
```

### Estoque
```
GET  /estoque                   → saldo geral com filtros
GET  /estoque/movimentacoes     → histórico de movimentações
GET  /estoque/em-ficha          → produtos em ficha por revendedora
POST /estoque/ajuste            → ajuste manual (exige justificativa)
```

### Formas de Pagamento
```
GET    /formas-pagamento
GET    /formas-pagamento/:id
POST   /formas-pagamento
PUT    /formas-pagamento/:id
PATCH  /formas-pagamento/:id/status
```

### Vendas
```
GET    /vendas                  → lista paginada + filtros (status, origem, período, cliente)
GET    /vendas/:id
GET    /vendas/:id/itens
GET    /vendas/:id/historico
POST   /vendas                  → gerar venda (transação: itens + pagamentos + baixa estoque + contas)
POST   /vendas/de-encomenda     → gerar venda a partir de encomenda (recebe order_id)
POST   /vendas/de-ficha         → gerar venda a partir de ficha (recebe ficha_id)
PATCH  /vendas/:id/cancelar     → cancelar com justificativa
```

### Encomendas
```
GET    /encomendas              → lista paginada + filtros (status, período, cliente)
GET    /encomendas/:id
GET    /encomendas/:id/itens
GET    /encomendas/:id/historico
POST   /encomendas              → criar
PUT    /encomendas/:id          → atualizar (apenas enquanto não cancelada)
PATCH  /encomendas/:id/status   → transição de status (body: { status, itens_fabricados? })
PATCH  /encomendas/:id/cancelar → cancelar com justificativa

-- Disponíveis para faturar (status Pronta ou Fabricado parcialmente, sem venda vinculada)
GET    /encomendas/para-faturar
```

### Fichas
```
GET    /fichas                  → lista paginada + filtros (status, período, revendedora)
GET    /fichas/:id
GET    /fichas/:id/historico
POST   /fichas                  → criar com itens (move estoque: disponível → em ficha)
PUT    /fichas/:id              → atualizar enquanto aberta
POST   /fichas/:id/devolucoes   → registrar devolução (move estoque: em ficha → disponível)
PATCH  /fichas/:id/finalizar    → finalizar ficha
PATCH  /fichas/:id/cancelar     → cancelar com justificativa

-- Disponíveis para gerar venda
GET    /fichas/para-faturar
```

### Contas a Receber
```
GET    /contas-receber          → lista paginada + filtros (status, período, cliente)
GET    /contas-receber/:id
GET    /contas-receber/:id/historico
POST   /contas-receber/:id/pagamentos    → registrar recebimento
POST   /contas-receber/:id/credito       → usar crédito do cliente
DELETE /contas-receber/:id/pagamentos/:pagamento_id  → estornar
PATCH  /contas-receber/:id/vencimento    → ajustar vencimento (com histórico)
```

### Dashboard
```
GET /dashboard/cards?de=&ate=   → { faturado, recebido, em_aberto, qtd_vendas, ticket_medio, fichas_abertas, encomendas_prontas }
GET /dashboard/calendario?ano=&mes=   → encomendas por data de entrega com contagem por status
GET /dashboard/encomendas-do-dia?data=
```

---

## Regras de Negócio no Backend

### Venda

**`POST /vendas`** é a operação mais complexa e deve ser executada em transação única:

```
1. Validar cliente e itens
2. Calcular subtotal, desconto, total
3. Persistir sale + sale_items + sale_payments
4. Baixar estoque: stock.available -= quantity por (product_id, size)
5. Inserir stock_movements (tipo: 'Saida por venda')
6. Se houver saldo em aberto → criar accounts_receivable
7. Inserir history_event (criação)
8. Commit
```

**`PATCH /vendas/:id/cancelar`**:
```
1. Validar que status != 'Cancelada'
2. Estornar estoque: stock.available += quantity por item
3. Inserir stock_movements (tipo: 'Estorno por cancelamento')
4. Cancelar/remover contas_receber vinculadas
5. Estornar crédito de cliente se foi usado
6. Atualizar status para 'Cancelada'
7. Inserir history_event (cancelamento com justificativa)
```

### Encomenda — `PATCH /encomendas/:id/status`

Validar transições permitidas:
```
Aberta → Em produção | Fabricado parcialmente | Cancelada
Em produção → Fabricado parcialmente | Pronta | Cancelada
Fabricado parcialmente → Pronta | Cancelada
Pronta → Entregue | Cancelada
Entregue → (bloqueado)
Cancelada → (bloqueado)
```

Para status `Fabricado parcialmente`, o body deve incluir `itens_fabricados[]` com `{ item_id, quantity_made }`. O backend persiste `order_items.quantity_made` para saber o saldo restante.

Ao faturar encomenda com status `Fabricado parcialmente` via `POST /vendas/de-encomenda`:
```
1. Gerar venda com os itens já fabricados
2. Calcular itens remanescentes (quantity - quantity_made)
3. Se houver remanescentes → criar nova encomenda com esses itens e status 'Aberta'
4. Marcar encomenda original como 'Entregue'
```

### Ficha — `POST /fichas`

```
1. Validar revendedora (deve ser atacado)
2. Verificar saldo disponível de cada item
3. Criar ficha + ficha_items
4. stock.available -= quantity_sent
5. stock.in_ficha  += quantity_sent
6. stock_movements (tipo: 'Envio para ficha')
7. history_event
```

**`POST /fichas/:id/devolucoes`**:
```
1. Validar que quantity devolvida <= enviada - já devolvida
2. Inserir ficha_returns
3. stock.in_ficha  -= quantity
4. stock.available += quantity
5. stock_movements (tipo: 'Devolucao de ficha')
6. Atualizar status da ficha para 'Parcial' se estava 'Aberta'
```

**`PATCH /fichas/:id/finalizar`**:
```
1. Calcular sold = sent - returned por item
2. stock.in_ficha -= sold
3. stock.sold     += sold
4. stock_movements (tipo: 'Baixa por finalizacao de ficha')
5. Atualizar status para 'Finalizada'
```

### Estoque — regra de saldo calculado

O campo `stock.available` é mantido via operações transacionais, mas o saldo real pode sempre ser verificado pela soma das `stock_movements`. Nunca deletar movimentações.

### Conta a Receber — status automático

Após cada pagamento registrado, o backend recalcula:
```
saldo = total - received
se saldo == 0         → status = 'Pago'
se saldo < total      → status = 'Parcial'
se due_date < hoje e saldo > 0 → status = 'Atrasado'
```

### Crédito do cliente

Toda alteração em `customers.credit` deve:
1. Atualizar o valor
2. Inserir `history_event` com `{ field: 'credit', value_before, value_after, notes }`

---

## Paginação e Filtros

Todos os endpoints de listagem aceitam:
```
?page=1&pageSize=20
?search=termo
?de=2026-04-01&ate=2026-04-30
?status=Gerada,Cancelada
```

Resposta padrão:
```json
{
  "data": [...],
  "total": 120,
  "page": 1,
  "pageSize": 20,
  "totalPages": 6
}
```

---

## Concorrência

Usar `updated_at` como campo de controle otimista. O frontend envia `updatedAt` no body de atualizações. O backend rejeita com `409 Conflict` se o valor diferir do banco.

```json
{ "error": "Este registro foi atualizado por outro usuário." }
```

---

## Autenticação

JWT com expiração curta (15 min) + refresh token em cookie HttpOnly (7 dias). Na primeira versão, sem perfis de permissão — qualquer usuário autenticado acessa tudo.

```
POST /auth/login   → { accessToken }  + Set-Cookie: refresh_token=...
POST /auth/refresh → novo accessToken usando cookie
POST /auth/logout  → limpa cookie
```

---

## Integração com o Frontend

O frontend precisa substituir o objeto `api` em `client/src/lib/api.ts`:
- Trocar chamadas de `localStorage` por `fetch` ou `axios` para `https://api.sono-leve.local`
- Manter os mesmos tipos de `types.ts` (apenas adicionar campos como `id` em UUID onde hoje é string numérica)
- O TanStack Query já está configurado — apenas trocar as `queryFn`

### Mapeamento de IDs

O mock usa IDs como `"10001"`, `"ENC-201"`. No banco serão UUIDs. Migrar os dados iniciais de teste gerando UUIDs fixos para preservar os vínculos (itensVenda, etc.).

---

## Ordem de Implementação Sugerida

1. Auth + Users
2. Catálogo de produtos (marcas, tipos, subtipos, categorias, coleções, modelos)
3. Produtos + Estoque (entrada manual)
4. Clientes
5. Formas de pagamento
6. Vendas (balcão)
7. Contas a receber
8. Encomendas
9. Fichas
10. Vendas de encomenda e de ficha
11. Dashboard
12. Histórico completo

---

## Configuração de Ambiente

```env
DATABASE_URL=Host=localhost;Database=sono_leve;Username=postgres;Password=...
JWT_SECRET=...
JWT_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7
CORS_ORIGINS=http://localhost:3000
```
