# Sono Leve

Sistema de gestão operacional para confecção de pijamas. Controla vendas, encomendas, fichas de revendedoras, estoque, clientes e financeiro.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | ASP.NET Core 10 — Controllers + Services + DTOs |
| ORM | Entity Framework Core 10 |
| Banco | PostgreSQL 16 |
| Auth | JWT + cookie HttpOnly |

---

## Estrutura do Projeto

```
sono-leve/
├── client/                  ← Frontend Next.js
│   ├── app/                 ← Rotas (App Router)
│   └── src/
│       ├── components/      ← Componentes reutilizáveis
│       ├── screens/         ← Telas da aplicação
│       ├── hooks/           ← Hooks reutilizáveis (usePagination, useDataGrid, etc.)
│       └── lib/             ← api.ts, http.ts, auth.ts, types.ts
├── server/                  ← Backend ASP.NET Core
│   ├── SonoLeve.Api/        ← Controllers, DTOs, Program.cs
│   ├── SonoLeve.Application/← Services, Interfaces
│   ├── SonoLeve.Domain/     ← Entities, Enums
│   └── SonoLeve.Infra/      ← DbContext, Repositories, Migrations, DataSeeder
├── docker-compose.dev.yml   ← Só o banco (dev local)
├── docker-compose.prod.yml  ← Banco + API (produção)
├── .env.example             ← Template de variáveis de ambiente
└── sono-leve.sln
```

---

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

### Reset do banco de dados

O `DataSeeder` executa automaticamente ao iniciar a API e popula o banco se estiver vazio. Para re-semear:

```sql
-- Truncar as tabelas e reiniciar (ajuste a ordem conforme FK)
TRUNCATE TABLE "Vendas", "Encomendas", "Fichas", "Contas" RESTART IDENTITY CASCADE;
```

---

## Produção

Em produção o Sono Leve é gerenciado pelo **Central** — o orquestrador dos
sistemas auto-hospedados. É ele quem sobe e administra o **Postgres
compartilhado**, cria o banco, configura o `.env` (as variáveis `POSTGRES_*` são
preenchidas automaticamente), sobe os containers de aplicação e agenda os
backups. Basta adicionar a URL deste repositório no painel do Central e clicar
em *Instalar*.

> O `compose` de produção obtém o host do banco do `.env`
> (`Host=${POSTGRES_HOST:-postgres}`): fica `postgres` (container próprio) no uso
> standalone e `host.docker.internal` quando gerenciado pelo Central. O serviço
> `postgres` do compose é ignorado pelo Central, que sobe só `api` e `frontend`.
> O `DataSeeder` popula o catálogo automaticamente na primeira subida com o banco
> vazio.

Uso **standalone** (sem o Central), subindo o próprio Postgres em container:

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
```

O frontend de produção é servido separadamente (build standalone Next.js).

---

## Convenções de Nomenclatura

- Diretórios e sufixos de infraestrutura em inglês: `Controllers/`, `Services/`, `DTOs/`, `Repositories/`, sufixos `Service`, `Controller`, `Dto`
- O código em si (nomes de classe, variáveis, campos, propriedades) em **português**: `ProdutoController`, `ClienteService`, `VendaRequestDto`, `fichaId`, `valorTotal`, `Nome`, `CriadoEm`
- O frontend segue o mesmo padrão: variáveis, funções e estados em português; tipos e interfaces da API preservam os campos do contrato

---

## Decisões Técnicas

### Paginação

**Decisão: paginação server-side em todas as telas de listagem; lazy loading por ID nos formulários de edição.**

Todas as telas de listagem (Clientes, Produtos, Vendas, Encomendas, Fichas, Estoque, Financeiro) usam paginação real via `useServerPagination`. O backend retorna `{ data, total, page, pageSize, totalPages }` e aplica filtros, busca e ordenação diretamente no banco. Cada aba de listagem mantém seu próprio `page` independente.

Os formulários de edição (`NovoCliente`, `NovoProduto`, `NovaFicha`, `NovaEncomenda`) usam hooks `*PorId` com `enabled: !!id` — buscam apenas o registro necessário em vez de carregar toda a lista. Busca de produto em formulários usa `useBuscarProdutos` (lazy, ativado a partir de 2 caracteres, `staleTime: 30s`).

O Dashboard carrega os dados de encomendas, vendas, fichas e contas a receber em bulk (sem paginação), pois precisa de todos os registros para KPIs e calendário. Esses hooks têm `staleTime: 2min` para reduzir refetches.

### Validação e segurança de entrada

Os DTOs do backend usam `DataAnnotations` (`[Required]`, `[StringLength]`, `[Range]`) para validação automática pelo ASP.NET Core — requisições com campos inválidos retornam `400 Bad Request` antes de chegar ao service. Strings de busca nos repositories são truncadas a 100 caracteres para prevenir abuso de queries longas.

### Layout de listagens

Todas as telas com tabela usam layout travado: `AppShell` define `h-screen overflow-hidden`; `main` é `flex flex-col overflow-hidden`. O cabeçalho (`PageHeader`) e a barra de filtros/abas são `shrink-0`. Apenas a área da tabela é `flex-1 overflow-y-auto`. O resultado é que a página nunca rola como um todo — somente o grid interno rola.

---

## Especificação Funcional

### Gerais

#### Atalhos globais

- Salvar: `Ctrl+S` (Windows/Linux) ou `Command+S` (macOS)
- `Enter`: confirmar campo ou ação
- `Tab`: próximo campo
- `Esc`: voltar ou cancelar

#### Atalhos por contexto

- `F2`: nova operação conforme a tela atual
- `F3`: na tela de Vendas, aciona "De Encomenda"
- `F4`: na tela de Vendas, aciona "De Ficha"
- `Shift + número`: navega entre abas pela ordem visual da tela ou modal

#### Configuração de atalhos

- Atalhos são configuráveis e persistidos localmente por máquina (sem banco de dados)
- Base padrão em arquivo JSON; alterações em Configurações sobrescrevem localmente
- O sistema exibe o atalho correto conforme a plataforma do usuário
- No macOS, atalhos com `Ctrl` priorizam `Command`
- A tela de atalhos exibe campos separados para Windows/Linux e macOS
- Deve existir ação para restaurar os atalhos padrão

Regras de contexto do `F2`:
- Em Vendas: nova venda
- Em Produtos: novo produto
- Em Clientes: novo cliente
- Em Encomendas: nova encomenda
- Em Ficha: nova ficha
- No Dashboard: `F2` nova venda, `F3` nova encomenda, `F4` nova ficha

#### Princípios gerais

- Todos os registros possuem status claro e regras de transição definidas
- Nenhum cancelamento remove o registro fisicamente do sistema
- Ações críticas preservam histórico
- Ao cadastrar ou salvar, indicar estado de salvamento e bloquear nova submissão até a conclusão
- Atalhos e dicas visuais aparecem na própria interface sempre que possível

#### Padrões visuais e de interação

- Modais com grande volume de dados mantêm tamanho fixo ou previsível
- Scroll acontece dentro da área de dados do modal, não expande a janela
- Explicações auxiliares preferem ícone de informação com tooltip em vez de texto fixo
- Títulos dos módulos podem exibir ícone de informação ao lado
- Abas exibem o atalho correspondente de forma discreta

#### Identidade visual

- Cor primária: `#1FA3FF`
- As demais cores derivam dessa primária
- O logo oficial é usado na sidebar e nos ícones do aplicativo

#### Salvamento e prevenção de duplicidade

- Ao clicar em salvar/confirmar, o botão entra em loading com texto "Salvando..." ou equivalente
- Enquanto em andamento, novos cliques são bloqueados
- Ao concluir com sucesso: toast de confirmação e atualização de status
- Ao ocorrer erro: liberar a ação, manter dados preenchidos, exibir mensagem clara

---

### Sidebar

- Logo + texto "Sono Leve"
- Lista de módulos
- Configurações no rodapé
- Pode ser recolhida para exibir apenas ícones
- Estado de hover claramente perceptível; estado ativo mais forte que hover

---

### Header — Navegação e Contexto

#### Breadcrumb

Formato: `Módulo / Submódulo / Tela / Registro`

- Cada nível é clicável, exceto o último
- Reflete sempre o estado atual da navegação
- Quando aberta a partir do Dashboard: `Dashboard / Venda / Nova venda`

#### Estado do registro

Exibido ao lado do título: Em edição, Finalizada, Paga, Cancelada, Não salvo.

- Atualizado em tempo real
- "Não salvo" aparece quando houver alterações pendentes
- Status controla ações disponíveis

---

### Filtro de Período

Opções: Hoje, 7 dias, 30 dias, Personalizado, Todo o período (quando o contexto não exigir data).

- Clique em opção atualiza datas
- Alteração manual define como personalizado
- No Dashboard: o seletor de período afeta apenas os cards superiores, não o calendário

---

### Dashboard

#### Calendário

- Baseado na data de entrega das encomendas
- Abre no mês atual com o dia atual selecionado
- Grade completa de 6 semanas
- Clique no dia mostra encomendas daquele dia (exceto Canceladas)
- Dias fora do mês corrente aparecem mais apagados, mas com comportamento idêntico

#### Cards

Faturado, Recebido, Em aberto, Quantidade de vendas, Ticket médio, Fichas em aberto, Encomendas prontas.

#### Indicadores por data

Ordem: Novo → Em produção → Fabricado parcialmente → Pronta. Cada bolinha exibe a contagem. Encomendas Canceladas, Entregues ou Faturadas não entram.

Cores: Novo = azul, Em produção = amarelo, Fabricado parcialmente = caramelo/âmbar, Pronta = verde.

---

### Vendas

#### Abas

- **Histórico**: vendas já geradas
- **Faturar encomendas**: encomendas prontas ou fabricadas parcialmente aguardando geração de venda
- **Faturar fichas**: fichas com itens vendidos aguardando faturamento

#### Listagem

Cliente, Data, Peças, Pagamento, Total, Status, Ações.

- Ordenação padrão: decrescente por data (mais recentes primeiro)
- Coluna Peças: clicável, abre modal com detalhamento dos itens
- Filtro de período padrão: Últimos 7 dias

#### Status

- `Gerada`: verde
- `Cancelada`: vermelho

#### Regras

- Pagamento total, parcial ou em aberto é controlado pelo financeiro
- Venda cancelada não pode ser editada
- Cancelamento exige justificativa, remove pagamentos, remove contas a receber, estorna crédito

---

### Nova Venda

#### Estrutura

Cliente, Itens, Resumo financeiro, Pagamento, Conta a receber (se houver saldo), Observações.

#### Cliente

- Busca/autocomplete com opção "Cadastrar novo cliente" no final da lista
- Cadastro rápido por modal sem perder os dados da venda
- Tipo da venda derivado do cadastro do cliente (varejo/atacado)
- Ao trocar o cliente, revisionar preços dos itens

#### Itens e preços

- Produto inativo não aparece para nova venda
- Grade de tamanhos herdada da categoria — usuário informa apenas quantidade por tamanho
- Cliente varejo usa preço varejo; cliente atacado usa preço atacado
- Desconto por item ou desconto total; não gera total negativo

#### Pagamento

- Um ou mais pagamentos
- Se saldo em aberto, gera conta a receber automaticamente
- Troco exige confirmação
- Taxa da forma de pagamento não altera o total da venda — afeta apenas o recebido líquido

#### Ação principal: Gerar venda

Botão entra em loading, texto muda para "Gerando venda...", bloqueia novo clique. Ao concluir: toast + status `Gerada`.

---

### Encomendas

#### Conceito

Pedidos feitos sob encomenda. Não gera ordem de produção nesta primeira versão. Não reserva estoque.

#### Campos

Obrigatórios: Cliente, Data, Itens, Valor total. Opcionais: Observações, Personalizações, Data prevista de entrega, Valor de entrada.

#### Status

Aberta → Em produção → Fabricado parcialmente → Pronta → Entregue → Cancelada.

Exibição: `Aberta` é tratada visualmente como `Novo`.

#### Transições permitidas

```
Aberta → Em produção | Fabricado parcialmente | Cancelada
Em produção → Fabricado parcialmente | Pronta | Cancelada
Fabricado parcialmente → Pronta | Cancelada
Pronta → Entregue | Cancelada
Entregue → (bloqueado)
Cancelada → (bloqueado)
```

#### Cores de status

Novo = azul, Em produção = amarelo, Fabricado parcialmente = caramelo, Pronta = verde, Entregue = neutro, Cancelada = vermelho.

#### Finalização parcial

Ao mover para Fabricado parcialmente, abrir seleção de quais itens foram fabricados. Por padrão todos vêm marcados. Se todos marcados → Pronta; se parcial → Fabricado parcialmente.

#### Listagem

- Ordenação padrão: decrescente por data de cadastro
- Filtro de período padrão: Últimos 7 dias
- Filtros: cliente, código, status, período

---

### Ficha

#### Conceito

Consignado para revendedora. Produtos enviados, revendedora devolve parte e paga apenas o que foi vendido.

#### Fluxo

Criar → Devolver → Ajustar → Finalizar → Gerar venda (ou via "De Ficha" na tela de Vendas).

#### Itens

- Enviado: produto, tamanho, quantidade, preço atacado. Move estoque: disponível → em ficha.
- Devolvido: registrado por devolução. Move estoque: em ficha → disponível.
- Vendido: calculado automaticamente (Enviado − Devolvido). Usuário não informa manualmente.

#### Status

Aberta → Parcial → Finalizada / Cancelada.

#### Regras

- Ficha finalizada não aceita novas devoluções
- Cancelamento com venda vinculada é bloqueado
- Cancelamento sem venda retorna itens em ficha para disponível
- Utiliza preço de atacado

---

### Produtos

#### Estrutura do catálogo

| Campo | Responsabilidade |
|---|---|
| Marca | Identidade comercial (quem assina) |
| Tipo | Classificação macro (ex: Curto, Longo) |
| Subtipo | Detalhamento do tipo (ex: Camisola de alça) |
| Categoria | Define a grade de tamanhos — impacta operações |
| Coleção | Agrupamento comercial ou sazonal (não impacta regras) |
| Modelo | Identificação base da peça (ex: Aurora, Luna) |

#### Grade de tamanhos

Pertence à categoria, não ao produto. Todo produto vinculado herda a grade automaticamente. Usuário informa apenas quantidade por tamanho, nunca digita tamanhos manualmente.

#### Cadastro

Nome único, referência única, preço varejo, preço atacado, marca, tipo, subtipo, categoria, coleção (opcional), modelo (opcional), grade e saldo inicial.

#### Listagem

- Agrupado por marca
- Busca por nome, referência, marca, tipo, subtipo, categoria, coleção e modelo
- Filtros por status, marca
- Produto inativo não aparece em novos lançamentos

---

### Estoque

#### Saldos

- Disponível: pronto para venda
- Em ficha: enviado para revendedora
- Vendido: baixado por venda ou finalização de ficha

#### Movimentações

Entrada, Saída por venda, Envio para ficha, Devolução de ficha, Baixa por finalização de ficha, Ajuste manual (exige justificativa), Estorno por cancelamento.

Toda movimentação registra data, origem, produto, tamanho, quantidade, usuário e observação. Movimentações nunca são apagadas.

---

### Clientes

Campos: Nome, Telefone, CPF, Endereço, Crédito, Tipo (varejo/atacado), Status (ativo/inativo).

- Crédito pode ser negativo; toda alteração gera histórico
- Cadastro rápido disponível em venda, encomenda e ficha
- Cliente com movimentação não deve ser excluído fisicamente

---

### Formas de Pagamento

Campos: Nome, Tipo, Taxa percentual, Valor fixo, Parcelas, Prazo de recebimento, Status.

- Taxa não altera o total da venda — afeta apenas o recebido líquido
- Forma inativa não aparece em novos pagamentos

---

### Contas a Receber

Origem: Venda, Ficha, Encomenda, Ajuste manual.

Status calculado automaticamente após cada pagamento:
- Saldo = 0 → Pago
- Saldo < total → Parcial
- Vencimento < hoje e saldo > 0 → Atrasado

Ações: Registrar recebimento, Usar crédito, Estornar recebimento, Ver origem, Ajustar vencimento, Cancelar (se ajuste manual).

---

### Histórico

Disponível em todos os módulos principais. Conteúdo: data/hora, usuário, origem (Sistema/Manual), ação, antes/depois, observação.

Eventos que geram histórico: criação, alteração de campos importantes, mudança de status, cancelamento, estorno, ajuste manual, entrada/saída de estoque, registro de pagamento, uso de crédito, alteração de preço, geração de venda a partir de encomenda ou ficha.

O histórico é somente leitura e nunca é apagado pelo usuário.

---

### UX

- Toast no canto inferior
- Scroll até o primeiro erro em formulários
- Loading e bloqueio durante ações
- Botões de ação indicam "Salvando..." enquanto em andamento
- Formulários mantêm dados preenchidos quando ocorre erro
- Listagens mantêm filtros ao voltar para a tela
- Modais fecham com `Esc`, salvo quando há alterações pendentes

---

## Arquitetura do Backend

### Estrutura de Projetos

```
SonoLeve.sln
├── SonoLeve.Api/
│   ├── Controllers/     ← ex: ProdutoController, ClienteController
│   ├── DTOs/            ← ex: VendaRequestDto, VendaResponseDto
│   └── Program.cs       ← entry point, DI, middlewares
├── SonoLeve.Application/
│   ├── Services/        ← ex: ProdutoService, VendaService
│   └── Interfaces/      ← ex: IProdutoService, IVendaService
├── SonoLeve.Domain/
│   ├── Entities/        ← ex: Produto, Cliente, Venda, Ficha
│   └── Enums/           ← ex: StatusVenda, StatusEncomenda, TipoCliente
└── SonoLeve.Infra/
    ├── Data/            ← DbContext, DataSeeder
    ├── Repositories/    ← ex: ProdutoRepository
    └── Migrations/
```

---

### Modelo de Dados

#### Enums

```
StatusVenda:       Gerada | Cancelada
StatusEncomenda:   Aberta | Em produção | Fabricado parcialmente | Pronta | Entregue | Cancelada
StatusFicha:       Aberta | Parcial | Finalizada | Cancelada
StatusConta:       Aberto | Parcial | Pago | Atrasado | Cancelado
TipoCliente:       varejo | atacado
OrigemVenda:       Balcão | Encomenda | Ficha
```

#### Tabelas principais

**Clientes** — id, Nome, Telefone, Cpf, Tipo, Status, Credito, CriadoEm, AtualizadoEm

**Catálogo de produtos** — product_brands, product_types, product_subtypes, product_categories (com grade TEXT[]), product_collections, product_models

**Produtos** — id, Nome, Ref (único), Marca, Tipo, Subtipo, Categoria, Colecao, Modelo, PrecoVarejo, PrecoAtacado, Ativo, Estoque, CriadoEm, AtualizadoEm

**Estoque** — por produto + tamanho: available, in_ficha, sold. Saldo calculável pela soma das movimentações.

**Formas de pagamento** — com taxas por parcela (percentual + fixo + prazo de recebimento)

**Vendas** — id, Cliente, Data, Pagamento, Pecas, Total, Status, Origem, CriadoEm, AtualizadoEm + sale_items + sale_payments

**Encomendas** — id, Cliente, Previsao, Total, Entrada, Status, CriadoEm, AtualizadoEm + order_items (com quantity_made para fabricado parcialmente) + order_customizations

**Fichas** — id, Revendedora, DataAbertura, Enviadas, Devolvidas, Vendidas, TotalVendido, Status + ficha_items + ficha_returns

**Contas a receber** — id, Cliente, Origem, Total, Recebido, Vencimento, Status + pagamentos + parcelas

**Histórico** — entity_type, entity_id, action, field, value_before (JSONB), value_after (JSONB), notes, origin, created_by, created_at

**Usuários** — id, name, email, password_hash, active

---

### Endpoints

#### Auth
```
POST /auth/login    → { accessToken } + Set-Cookie: refresh_token
POST /auth/refresh  → novo accessToken via cookie
POST /auth/logout   → limpa cookie
GET  /auth/me
```

#### Clientes
```
GET    /clientes
GET    /clientes/:id
POST   /clientes
PUT    /clientes/:id
PATCH  /clientes/:id/status
PATCH  /clientes/:id/credito
GET    /clientes/:id/historico
```

#### Produtos — Catálogo
```
GET  /produtos/catalogo   → { categorias, marcas, tipos, subtipos, colecoes, modelos }
POST /produtos/catalogo/marcas
POST /produtos/catalogo/tipos
POST /produtos/catalogo/subtipos
POST /produtos/catalogo/categorias
POST /produtos/catalogo/colecoes
POST /produtos/catalogo/modelos
PATCH /produtos/catalogo/categorias/:id
PATCH /produtos/catalogo/:entidade/:id/status
```

#### Produtos
```
GET    /produtos
GET    /produtos/:id
GET    /produtos/:id/estoque
POST   /produtos
PUT    /produtos/:id
PATCH  /produtos/:id/status
GET    /produtos/:id/historico
```

#### Estoque
```
GET  /estoque
GET  /estoque/movimentacoes
GET  /estoque/em-ficha
POST /estoque/ajuste
```

#### Vendas
```
GET    /vendas
GET    /vendas/:id
GET    /vendas/:id/itens
GET    /vendas/:id/historico
POST   /vendas
POST   /vendas/de-encomenda
POST   /vendas/de-ficha
PATCH  /vendas/:id/cancelar
```

#### Encomendas
```
GET    /encomendas
GET    /encomendas/:id
GET    /encomendas/:id/itens
GET    /encomendas/:id/historico
POST   /encomendas
PUT    /encomendas/:id
PATCH  /encomendas/:id/status
PATCH  /encomendas/:id/cancelar
GET    /encomendas/para-faturar
```

#### Fichas
```
GET    /fichas
GET    /fichas/:id
GET    /fichas/:id/historico
POST   /fichas
PUT    /fichas/:id
POST   /fichas/:id/devolucoes
PATCH  /fichas/:id/finalizar
PATCH  /fichas/:id/cancelar
GET    /fichas/para-faturar
```

#### Contas a Receber
```
GET    /contas-receber
GET    /contas-receber/:id
GET    /contas-receber/:id/historico
POST   /contas-receber/:id/pagamentos
POST   /contas-receber/:id/credito
DELETE /contas-receber/:id/pagamentos/:pagamento_id
PATCH  /contas-receber/:id/vencimento
```

#### Dashboard
```
GET /dashboard/cards?de=&ate=
GET /dashboard/calendario?ano=&mes=
GET /dashboard/encomendas-do-dia?data=
```

---

### Regras de Negócio no Backend

#### POST /vendas — transação única

1. Validar cliente e itens
2. Calcular subtotal, desconto, total
3. Persistir venda + itens + pagamentos
4. Baixar estoque por (produto, tamanho)
5. Inserir stock_movements (tipo: Saída por venda)
6. Se saldo em aberto → criar conta a receber
7. Inserir history_event
8. Commit

#### PATCH /vendas/:id/cancelar

1. Validar que status ≠ Cancelada
2. Estornar estoque por item
3. Inserir stock_movements (Estorno por cancelamento)
4. Cancelar contas a receber vinculadas
5. Estornar crédito de cliente se foi usado
6. Atualizar status para Cancelada
7. Inserir history_event com justificativa

#### PATCH /encomendas/:id/status

Validar transições (ver seção de status acima). Para `Fabricado parcialmente`, body inclui `itens_fabricados[]` com `{ item_id, quantity_made }`.

Ao faturar encomenda com status `Fabricado parcialmente`:
1. Gerar venda com itens fabricados
2. Calcular itens remanescentes
3. Se houver remanescentes → criar nova encomenda com status Aberta
4. Marcar encomenda original como Entregue

#### POST /fichas

1. Validar revendedora (deve ser atacado)
2. Verificar saldo disponível por item
3. Criar ficha + itens
4. stock.available -= quantity_sent; stock.in_ficha += quantity_sent
5. Inserir stock_movements (Envio para ficha)
6. Inserir history_event

#### POST /fichas/:id/devolucoes

1. Validar quantity devolvida ≤ enviada − já devolvida
2. Inserir ficha_returns
3. stock.in_ficha -= quantity; stock.available += quantity
4. Inserir stock_movements (Devolução de ficha)
5. Atualizar status para Parcial se estava Aberta

#### PATCH /fichas/:id/finalizar

1. Calcular vendido = enviado − devolvido por item
2. stock.in_ficha -= vendido; stock.sold += vendido
3. Inserir stock_movements (Baixa por finalização de ficha)
4. Atualizar status para Finalizada

#### Conta a Receber — status automático

Após cada pagamento, recalcular:
- Saldo = 0 → Pago
- Saldo < total → Parcial
- Vencimento < hoje e saldo > 0 → Atrasado

---

### Paginação e Filtros

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

O frontend passa `page` e `pageSize` reais em todas as chamadas de listagem. Formulários de edição usam o endpoint `GET /:id` diretamente.

---

### Concorrência

Usar `AtualizadoEm` como controle otimista. O frontend envia `atualizadoEm` no body de atualizações. O backend rejeita com `409 Conflict` se o valor diferir do banco.

```json
{ "error": "Este registro foi atualizado por outro usuário." }
```

---

### Autenticação

JWT com expiração curta (15 min) + refresh token em cookie HttpOnly (7 dias). Na primeira versão, sem perfis de permissão — qualquer usuário autenticado acessa tudo.

---

### Ordem de Implementação

1. Auth + Usuários
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

### Configuração de Ambiente

```env
DATABASE_URL=Host=localhost;Database=sono_leve;Username=postgres;Password=...
JWT_SECRET=...
JWT_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7
CORS_ORIGINS=http://localhost:3010
```
