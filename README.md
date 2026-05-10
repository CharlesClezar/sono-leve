# Sono Leve

Sistema de gestão operacional para confecção de pijamas. Controla vendas, encomendas, fichas de revendedoras, estoque, clientes e financeiro.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | ASP.NET Core 10 — Controllers + Services + DTOs |
| ORM | Entity Framework Core 10 |
| Banco | PostgreSQL 16 |
| Auth | JWT + cookie HttpOnly |

## Estrutura do Projeto

```
sono-leve/
├── client/                  ← Frontend Next.js
│   ├── app/                 ← Rotas (App Router)
│   ├── src/
│   │   ├── components/      ← Componentes reutilizáveis
│   │   ├── screens/         ← Telas da aplicação
│   │   └── lib/             ← api.ts, http.ts, auth.ts, types.ts
│   └── .env.local           ← NEXT_PUBLIC_API_URL
├── server/                  ← Backend ASP.NET Core
│   ├── SonoLeve.Api/        ← Controllers, DTOs, Program.cs
│   ├── SonoLeve.Application/← Services, Interfaces
│   ├── SonoLeve.Domain/     ← Entities, Enums
│   └── SonoLeve.Infra/      ← DbContext, Repositories, Migrations
├── docker-compose.dev.yml   ← Só o banco (dev local)
├── docker-compose.prod.yml  ← Banco + API (produção)
├── .env.example             ← Template de variáveis de ambiente
└── sono-leve.sln
```

## Desenvolvimento Local

### Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Docker](https://www.docker.com)
- Extensão **C# Dev Kit** no VSCode

### Configuração inicial

```bash
# 1. Variáveis de ambiente
cp .env.example .env
cp client/.env.local.example client/.env.local

# 2. Instalar dependências do frontend
cd client && npm install
```

### Subir com F5 (VSCode)

1. Suba o banco de dados:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
2. No VSCode, abra o painel **Run & Debug** (`Ctrl+Shift+D`)
3. Selecione **Sono Leve: Full Stack** e pressione **F5**

O F5 compila o backend, inicia a API com debugger e sobe o frontend automaticamente.

### Subir manualmente

```bash
# Banco
docker compose -f docker-compose.dev.yml up -d

# Backend (porta 5010)
cd server/SonoLeve.Api && dotnet run

# Frontend (porta 3010)
cd client && npm run dev
```

### URLs

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3010 |
| Backend | http://localhost:5010 |

## Produção

```bash
# Copiar e preencher o .env
cp .env.example .env

# Subir tudo (banco + API)
docker compose -f docker-compose.prod.yml up -d --build
```

O frontend de produção é servido separadamente (build standalone Next.js).

## Documentação

- [`SONOLEVE.md`](SONOLEVE.md) — documento funcional e de referência do sistema
- [`BACKEND_ARQUITETURA.md`](BACKEND_ARQUITETURA.md) — arquitetura, modelo de dados, endpoints e regras de negócio
