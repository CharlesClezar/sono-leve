# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório. Leia isto primeiro. **O
README está parcialmente desatualizado/aspiracional** — veja "Cuidado: README vs
código" no fim.

## O que é

**Sono Leve** é um sistema de gestão operacional para um fabricante de pijamas:
vendas, encomendas, fichas de consignação (revendedoras), estoque, clientes e
contas a receber. Monorepo: frontend Next.js + backend ASP.NET Core (clean
architecture) + Postgres. Todo o domínio em **português**; scaffolding de infra
(pastas, sufixos de classe) em inglês.

O banco de dev é o Postgres compartilhado do orquestrador **Central** (externo a
este repo): `python3 central.py provision-dev sono-leve` escreve a conexão em
`server/SonoLeve.Api/appsettings.Development.json`.

## Stack

- **Frontend** (`client/`): **Next.js 16** (App Router, `output: standalone`),
  **React 19.2**, TypeScript 5.8. Tailwind **3.4** + shadcn/ui (~49 componentes em
  `src/components/ui`). TanStack React Query 5, react-hook-form + zod, lucide-react,
  sonner, recharts, date-fns 3. ESLint 9 (flat config).
- **Backend** (`server/`): ASP.NET Core / **.NET 10** (`net10.0`), C# (Nullable +
  ImplicitUsings). EF Core 10 (Npgsql), FluentValidation 11. Solução de 4
  projetos: **Api → Application → Domain, Infra**. Postgres 16.

> Nota: o README diz "Next.js 15", mas o código é Next 16 / React 19.2.

## Comandos

```bash
# Frontend (em client/)
npm run dev      # porta 3010, host 0.0.0.0
npm run build    # next build --webpack
npm run start    # porta 3010
npm run lint     # eslint .

# Backend (em server/SonoLeve.Api/)
dotnet run       # porta 5010 em dev; migrations aplicadas no startup (db.Database.Migrate())
dotnet build server/SonoLeve.Api/SonoLeve.Api.csproj

# Produção standalone
docker compose -f docker-compose.prod.yml up -d --build   # postgres, api (8080→API_PORTA), frontend (3000→FRONTEND_PORTA)
```

- VSCode: launch compound **"Sono Leve: Full Stack"** (F5) sobe backend + `npm run dev`.
- **Não há testes** — nenhum runner, nenhum `*.test.*`/`*.spec.*`/xunit. Um comando
  de teste teria que ser criado.
- Portas de dev: frontend **3010**, backend **5010**. (Atenção: o
  `appsettings.json` traz CORS default `localhost:3000` — o dev real usa 3010,
  corrigido por override/env var.)

## Estrutura

```
client/
  app/                  Rotas App Router — page.tsx finos por módulo
                        (clientes, produtos, vendas, encomendas, fichas, estoque, financeiro, historico, configuracoes).
  app/layout.tsx, app/providers.tsx   Shell + providers (React Query, tema).
  src/screens/          Implementação real das telas (Dashboard.tsx, Vendas.tsx, NovaVenda.tsx...).
  src/components/        Compartilhados (AppShell, DataGrid, PageHeader, StatusBadge) + ui/ (shadcn).
  src/hooks/            usePagination, useDataGrid, useGlobalShortcuts, useShortcutSettings, useIndexedTabs.
  src/lib/              api.ts (hooks React Query), http.ts (wrapper fetch → prefixo /api), types.ts,
                        shortcuts.ts, navigation.ts, utils.ts, uuid.ts.  (NÃO há auth.ts — ver abaixo.)
  src/data/shortcuts.json    Atalhos de teclado default.
  next.config.mjs       Reescreve /api/* e /imagens/* para o backend (API_INTERNAL_URL ou localhost:5010).
server/
  SonoLeve.Api/         Controllers, DTOs, Filters (IdempotencyFilter), Program.cs, appsettings.
  SonoLeve.Application/ Services + Interfaces (contratos de repo e service, IUnitOfWork).
  SonoLeve.Domain/      Entities + Enums (domínio puro, sem dependências).
  SonoLeve.Infra/       Data (SonoLeveDbContext), Repositories, Migrations.
```

Entrypoints: backend `server/SonoLeve.Api/Program.cs` (DI, CORS, rate limit,
idempotency filter, EF, auto-migrate). Frontend HTTP: `src/lib/http.ts` (tudo com
prefixo `/api`) + `src/lib/api.ts`. Modelo do banco:
`server/SonoLeve.Infra/Data/SonoLeveDbContext.cs`.

## Convenções

- **Idioma:** nomes/sufixos de infra em inglês (`Controllers/`, `Service`,
  `Controller`, `Dto`, `Repository`); **todo** o resto em português — classes,
  variáveis, propriedades, enums (`ProdutoController`, `VendaService`,
  `valorTotal`, `CriadoEm`). O frontend segue a mesma regra (até nomes de
  função/variável em pt: `requisitar`, `opcoes`, `caminho`).
- Camadas estritas no backend: Controller → Service (injetado por interface) →
  Repository → DbContext (como IUnitOfWork). Tudo registrado scoped no `Program.cs`.
- Toda entidade estende `EntidadeBase`; concorrência otimista via `AtualizadoEm`
  → **409 Conflict** em divergência.
- Paginação server-side em tudo: respostas `{ data, total, page, pageSize,
  totalPages }`; frontend usa `usePagination`/`useServerPagination`. Formulários
  de edição carregam o registro via `GET /:id`.
- Validação com DataAnnotations + FluentValidation; strings de busca truncadas a
  100 chars.
- Rotas sob `/api/...` (ex.: `api/vendas`, `api/produtos/catalogo`,
  `api/contas-receber`, `api/audit-logs`).
- Layout travado: `AppShell` é `h-screen overflow-hidden`; só a área do grid rola.
- Cor de marca `#1FA3FF`. Domínio pt-BR (CPF, varejo/atacado).
- **Commits:** repo tem a skill `commit-message` (pt-BR, prefixo = nome da branch,
  `[tipo]: mensagem` imperativo) e `analise-manutencao` (triagem de work items).

## Recursos não óbvios (existem no código, faltam no README)

- **Idempotência global:** header `Idempotency-Key` + `IdempotencyFilter` +
  entidade `IdempotencyRecord` + `IIdempotencyService`, aplicado a todos os
  controllers.
- **Rate limiting:** 200 req/min por IP (429 ao exceder).
- Handler global de exceção (esconde stack trace em prod).
- **Taxas de cartão:** `BandeiraCartao` (`api/bandeiras-cartao`) e
  `ConfiguracaoTaxaCartao`/`...Parcela` (`api/configuracoes-taxa-cartao`); `Venda`
  tem campos de bandeira/parcelas.
- Histórico = `AuditLog` / `api/audit-logs` (não "Historico").

## ⚠️ Cuidado: README vs código

O README descreve coisas que **não estão implementadas**. Não confie nele para:

- **Autenticação NÃO existe.** O README documenta JWT + cookie HttpOnly,
  `/auth/login|refresh|logout|me`, tokens de 15 min e fluxo de Usuários — mas o
  `Program.cs` **não** tem `AddAuthentication`/`UseAuthentication`/`UseAuthorization`,
  não há `AuthController` nem `UsuarioController`, e o `http.ts` não envia
  headers/credenciais de auth. Existe uma entidade `Usuario`, mas não é usada para
  auth. Trate toda a seção de auth do README como aspiracional.
- **Não há DataSeeder.** O README diz que um `DataSeeder` popula o catálogo no
  startup — esse arquivo não existe. O startup só roda migrations.
- **Nomes de env var diferem do README:** o `.env` real usa chaves em português —
  `JWT_SEGREDO`, `JWT_EXPIRACAO_MINUTOS`, `JWT_EXPIRACAO_REFRESH_DIAS`,
  `CORS_ORIGENS`, `API_PORTA`, `FRONTEND_PORTA`, `POSTGRES_*` (não os nomes em
  inglês do README). Connection string: `ConnectionStrings:Default` /
  `ConnectionStrings__Default`. As chaves `Jwt:Segredo` etc. existem mas hoje **não
  são usadas** pelo código.
- Rotas no README aparecem sem o prefixo (`/vendas`); as reais são todas `/api/...`.
- 4 migrations EF (Inicial → AddBandeiraParcelasToVenda, datadas 2026-06).
