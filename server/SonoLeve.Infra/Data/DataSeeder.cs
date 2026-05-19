using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Infra.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(SonoLeveDbContext db)
    {
        var agora = DateTime.UtcNow;

        // 1. Catálogo (deve vir antes de Produtos)
        if (!db.Marcas.Any())
        {
            db.Marcas.AddRange(
                new Marca { Name = "Sono Leve",        Active = true },
                new Marca { Name = "Clelia Anastácio", Active = true },
                new Marca { Name = "Thainá Reichen",   Active = true },
                new Marca { Name = "Ronca&Fuça",       Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.Categorias.Any())
        {
            db.Categorias.AddRange(
                new Categoria { Name = "Adulto Feminino",  Grade = ["PP", "P", "M", "G", "GG", "50", "52", "54", "56"],                    Active = true },
                new Categoria { Name = "Adulto Masculino", Grade = ["40", "42", "44", "46", "48", "50", "52", "54", "56"],                  Active = true },
                new Categoria { Name = "Infantil",         Grade = ["RN", "1", "2", "3", "4", "6", "8", "10", "12", "14", "16"],            Active = true },
                new Categoria { Name = "Pantufa",          Grade = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],            Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.Tipos.Any())
        {
            db.Tipos.AddRange(
                new Tipo { Name = "Camisola",  Active = true },
                new Tipo { Name = "Conjunto",  Active = true },
                new Tipo { Name = "Macacão",   Active = true },
                new Tipo { Name = "Pantufa",   Active = true },
                new Tipo { Name = "Pescador",  Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.Subtipos.Any())
        {
            db.Subtipos.AddRange(
                new Subtipo { Name = "Alça",        Active = true },
                new Subtipo { Name = "Regata",      Active = true },
                new Subtipo { Name = "Manga Curta", Active = true },
                new Subtipo { Name = "Manga Longa", Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.Colecoes.Any())
        {
            db.Colecoes.AddRange(
                new Colecao { Name = "Inverno 2025", DataInicio = new DateOnly(2025, 6, 1),  DataFim = new DateOnly(2025, 8, 31),  Active = true },
                new Colecao { Name = "Outono 2025",  DataInicio = new DateOnly(2025, 3, 1),  DataFim = new DateOnly(2025, 5, 31),  Active = true },
                new Colecao { Name = "Verão 2025",   DataInicio = new DateOnly(2024, 12, 1), DataFim = new DateOnly(2025, 2, 28),  Active = true },
                new Colecao { Name = "Básico",       DataInicio = null,                      DataFim = null,                       Active = true }
            );
            await db.SaveChangesAsync();
        }

        // 2. Formas de Pagamento
        if (!db.FormasPagamento.Any())
        {
            db.FormasPagamento.AddRange(
                new FormaPagamento { Nome = "Pix",           Condicao = "À vista", Taxa = "0%",                  Ativo = true  },
                new FormaPagamento { Nome = "Dinheiro",      Condicao = "À vista", Taxa = "0%",                  Ativo = true  },
                new FormaPagamento { Nome = "Cartão Débito", Condicao = "À vista", Taxa = "Conforme maquininha", Ativo = true  },
                new FormaPagamento { Nome = "Cartão Crédito",Condicao = "Até 3x",  Taxa = "Conforme maquininha", Ativo = true  },
                new FormaPagamento { Nome = "Boleto",        Condicao = "7 dias",  Taxa = "0%",                  Ativo = false }
            );
            await db.SaveChangesAsync();
        }

        // 3. Clientes
        if (!db.Clientes.Any())
        {
            db.Clientes.AddRange(
                C("Ana Paula Ferreira",        "(11) 98234-5678", "123.456.789-00",     TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Carlos Eduardo Matos",      "(11) 97654-3210", "234.567.890-11",     TipoCliente.Varejo,  "Ativo",   150,  agora),
                C("Fernanda Souza",            "(21) 99123-4567", "345.678.901-22",     TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Roberto Lima",              "(21) 98765-4321", "456.789.012-33",     TipoCliente.Varejo,  "Inativo", 0,    agora),
                C("Márcia Oliveira",           "(31) 99876-5432", "567.890.123-44",     TipoCliente.Varejo,  "Ativo",   300,  agora),
                C("Paulo Henrique Costa",      "(31) 98901-2345", "678.901.234-55",     TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Juliana Ramos",             "(41) 99012-3456", "789.012.345-66",     TipoCliente.Varejo,  "Ativo",   80,   agora),
                C("Boutique Dona Rosa",        "(11) 3345-6789",  "11.222.333/0001-44", TipoCliente.Atacado, "Ativo",   2000, agora),
                C("Distribuidora Pijamas Sul", "(51) 3456-7890",  "22.333.444/0001-55", TipoCliente.Atacado, "Ativo",   5000, agora),
                C("Loja do Bebê Conforto",     "(41) 3567-8901",  "33.444.555/0001-66", TipoCliente.Atacado, "Ativo",   1500, agora),
                C("Tatiane Braga",             "(11) 97890-1234", "890.123.456-77",     TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Marcos Vinicius Santos",    "(85) 98234-5670", "901.234.567-88",     TipoCliente.Varejo,  "Ativo",   200,  agora),
                C("Simone Aparecida Nunes",    "(62) 99345-6781", "012.345.678-99",     TipoCliente.Varejo,  "Inativo", 0,    agora),
                C("Confecções Norte Ltda",     "(92) 3456-7892",  "44.555.666/0001-77", TipoCliente.Atacado, "Ativo",   8000, agora),
                C("Patricia Gonçalves",        "(71) 99567-8903", "111.222.333-00",     TipoCliente.Varejo,  "Ativo",   0,    agora)
            );
            await db.SaveChangesAsync();
        }

        // 4. Produtos (com FKs para catálogo)
        if (!db.Produtos.Any())
        {
            var marcas   = db.Marcas.ToDictionary(m => m.Name, m => m.Id);
            var tipos    = db.Tipos.ToDictionary(t => t.Name, t => t.Id);
            var subtipos = db.Subtipos.ToDictionary(s => s.Name, s => s.Id);
            var cats     = db.Categorias.ToDictionary(c => c.Name, c => c.Id);
            var colecoes = db.Colecoes.ToDictionary(c => c.Name, c => c.Id);

            Guid? Sub(string nome) =>
                subtipos.TryGetValue(nome, out var id) ? id : (Guid?)null;

            db.Produtos.AddRange(
                P("Camisola Adulto Liso Azul",    "CM-001", marcas["Sono Leve"], tipos["Camisola"], Sub("Alça"),        cats["Adulto Feminino"],  colecoes["Inverno 2025"], 89.90m, 65.00m, true, 42, agora),
                P("Camisola Adulto Liso Rosa",    "CM-002", marcas["Sono Leve"], tipos["Camisola"], Sub("Manga Longa"), cats["Adulto Feminino"],  colecoes["Inverno 2025"], 89.90m, 65.00m, true, 38, agora),
                P("Camisola Adulto Estampada",    "CM-003", marcas["Sono Leve"], tipos["Camisola"], Sub("Manga Curta"), cats["Adulto Feminino"],  colecoes["Inverno 2025"], 79.90m, 58.00m, true, 25, agora),
                P("Conjunto Infantil Ursinhos",   "CJ-001", marcas["Sono Leve"], tipos["Conjunto"], Sub("Manga Longa"), cats["Infantil"],         colecoes["Outono 2025"],  59.90m, 42.00m, true, 60, agora),
                P("Conjunto Infantil Estrelas",   "CJ-002", marcas["Sono Leve"], tipos["Conjunto"], Sub("Manga Longa"), cats["Infantil"],         colecoes["Outono 2025"],  59.90m, 42.00m, true, 55, agora),
                P("Conjunto Adulto Masculino",    "CJ-003", marcas["Sono Leve"], tipos["Conjunto"], Sub("Manga Longa"), cats["Adulto Masculino"], colecoes["Inverno 2025"], 85.00m, 62.00m, true, 30, agora),
                P("Camisola Adulto Regata Renda", "CM-004", marcas["Sono Leve"], tipos["Camisola"], Sub("Regata"),      cats["Adulto Feminino"],  colecoes["Verão 2025"],   95.00m, 70.00m, true, 20, agora),
                P("Conjunto Floral Regata",       "CJ-004", marcas["Sono Leve"], tipos["Conjunto"], Sub("Regata"),      cats["Adulto Feminino"],  colecoes["Verão 2025"],   75.00m, 55.00m, true, 18, agora),
                P("Pantufa Adulto Soft",          "PT-001", marcas["Sono Leve"], tipos["Pantufa"],  Sub("Alça"),        cats["Pantufa"],          colecoes["Básico"],       45.00m, 32.00m, true, 80, agora),
                P("Pantufa Infantil Bichinhos",   "PT-002", marcas["Sono Leve"], tipos["Pantufa"],  Sub("Alça"),        cats["Pantufa"],          colecoes["Outono 2025"],  49.90m, 35.00m, true, 65, agora)
            );
            await db.SaveChangesAsync();
        }

        // 5. Vendas (com ClienteId e FormaPagamentoId)
        if (!db.Vendas.Any())
        {
            var clienteIds = db.Clientes
                .Where(c => c.Status == "Ativo")
                .Select(c => c.Id).ToArray();
            var fpIds = db.FormasPagamento
                .Where(f => f.Ativo)
                .Select(f => f.Id).ToArray();
            var origens = new[] { OrigemVenda.Balcao, OrigemVenda.Balcao, OrigemVenda.Encomenda, OrigemVenda.Ficha };
            var rng = new Random(42);

            var diasAbril = new Dictionary<int, int>
            {
                { 1, 4 }, { 2, 6 }, { 3, 5 }, { 6, 8 }, { 7, 7 },
                { 8, 5 }, { 9, 9 }, { 10, 6 }, { 13, 5 }, { 14, 10 },
                { 15, 7 }, { 16, 8 }, { 17, 6 }, { 20, 10 }, { 21, 7 },
                { 22, 9 }, { 23, 5 }, { 24, 8 }, { 25, 6 }, { 27, 10 },
                { 28, 7 }, { 29, 5 }, { 30, 9 },
            };
            foreach (var (dia, qtd) in diasAbril)
            {
                for (int i = 0; i < qtd; i++)
                {
                    var data = new DateTime(2026, 4, dia, rng.Next(8, 18), rng.Next(0, 60), 0, DateTimeKind.Utc);
                    var pecas = rng.Next(1, 9);
                    db.Vendas.Add(new Venda
                    {
                        Id = Guid.NewGuid(),
                        ClienteId = clienteIds[rng.Next(clienteIds.Length)],
                        FormaPagamentoId = fpIds[rng.Next(fpIds.Length)],
                        Data = data, Pecas = pecas,
                        Total = Math.Round(pecas * (decimal)(rng.NextDouble() * 70 + 40), 2),
                        Status = rng.Next(10) < 9 ? StatusVenda.Gerada : StatusVenda.Cancelada,
                        Origem = origens[rng.Next(origens.Length)],
                        CriadoEm = data, AtualizadoEm = data,
                    });
                }
            }

            var diasMaio = new Dictionary<int, int>
            {
                { 2, 5 }, { 3, 6 }, { 4, 7 }, { 5, 10 }, { 6, 8 },
                { 7, 5 }, { 8, 9 }, { 9, 10 }, { 10, 7 }, { 11, 8 },
                { 12, 6 }, { 13, 10 }, { 14, 5 }, { 15, 7 }, { 16, 10 },
                { 17, 6 }, { 18, 5 }, { 19, 5 }, { 20, 8 }, { 21, 10 },
                { 22, 6 }, { 23, 5 }, { 24, 7 }, { 25, 6 }, { 26, 9 },
                { 27, 10 }, { 28, 6 }, { 29, 5 }, { 30, 8 },
            };
            foreach (var (dia, qtd) in diasMaio)
            {
                for (int i = 0; i < qtd; i++)
                {
                    var data = new DateTime(2026, 5, dia, rng.Next(8, 18), rng.Next(0, 60), 0, DateTimeKind.Utc);
                    var pecas = rng.Next(1, 8);
                    db.Vendas.Add(new Venda
                    {
                        Id = Guid.NewGuid(),
                        ClienteId = clienteIds[rng.Next(clienteIds.Length)],
                        FormaPagamentoId = fpIds[rng.Next(fpIds.Length)],
                        Data = data, Pecas = pecas,
                        Total = Math.Round(pecas * (decimal)(rng.NextDouble() * 60 + 45), 2),
                        Status = rng.Next(10) < 9 ? StatusVenda.Gerada : StatusVenda.Cancelada,
                        Origem = origens[rng.Next(origens.Length)],
                        CriadoEm = data, AtualizadoEm = data,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // 6. Encomendas (com ClienteId)
        if (!db.Encomendas.Any())
        {
            var clienteIds = db.Clientes.Where(c => c.Status == "Ativo").Select(c => c.Id).ToArray();
            var statusList = new[]
            {
                StatusEncomenda.Aberta, StatusEncomenda.EmProducao,
                StatusEncomenda.FabricadoParcialmente, StatusEncomenda.Pronta,
                StatusEncomenda.Entregue,
            };
            var diasEncomendas = new Dictionary<int, int>
            {
                { 2, 3 }, { 5, 6 }, { 6, 5 }, { 9, 10 },
                { 12, 4 }, { 13, 6 }, { 16, 10 }, { 19, 3 },
                { 20, 5 }, { 22, 10 }, { 26, 4 }, { 28, 6 },
            };
            var rng = new Random(7);
            foreach (var (dia, qtd) in diasEncomendas)
            {
                for (int i = 0; i < qtd; i++)
                {
                    var criado = new DateTime(2026, 5, dia, rng.Next(8, 17), rng.Next(0, 60), 0, DateTimeKind.Utc);
                    var total = Math.Round((decimal)(rng.NextDouble() * 800 + 200), 2);
                    db.Encomendas.Add(new Encomenda
                    {
                        Id = Guid.NewGuid(),
                        ClienteId = clienteIds[rng.Next(clienteIds.Length)],
                        Previsao = criado.AddDays(rng.Next(7, 30)),
                        Total = total,
                        Entrada = Math.Round(total * (decimal)(rng.NextDouble() * 0.4 + 0.2), 2),
                        Status = statusList[rng.Next(statusList.Length)],
                        CriadoEm = criado, AtualizadoEm = criado,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // 7. Itens de Encomenda (com ProdutoId)
        if (!db.ItensEncomenda.Any() && db.Encomendas.Any())
        {
            var produtosSeed = db.Produtos
                .Where(p => new[] { "CM-001","CM-002","CM-003","CJ-001","CJ-002","CJ-003","CM-004","CJ-004" }.Contains(p.Ref))
                .Select(p => new { p.Id, p.Ref })
                .ToList();
            var tamanhosPorRef = new Dictionary<string, string[]>
            {
                ["CM-001"] = ["PP","P","M","G","GG"], ["CM-002"] = ["PP","P","M","G","GG"],
                ["CM-003"] = ["P","M","G"],            ["CJ-001"] = ["4","6","8","10"],
                ["CJ-002"] = ["4","6","8","10"],       ["CJ-003"] = ["M","G","GG"],
                ["CM-004"] = ["P","M","G"],            ["CJ-004"] = ["P","M","G"],
            };
            var precoPorRef = new Dictionary<string, decimal>
            {
                ["CM-001"]=89.90m,["CM-002"]=89.90m,["CM-003"]=79.90m,["CJ-001"]=59.90m,
                ["CJ-002"]=59.90m,["CJ-003"]=85.00m,["CM-004"]=95.00m,["CJ-004"]=75.00m,
            };
            var rngItens = new Random(17);
            foreach (var encomenda in db.Encomendas.ToList())
            {
                var qtdItens = rngItens.Next(1, 4);
                for (int i = 0; i < qtdItens; i++)
                {
                    var prod = produtosSeed[rngItens.Next(produtosSeed.Count)];
                    var tams = tamanhosPorRef[prod.Ref];
                    db.ItensEncomenda.Add(new ItemEncomenda
                    {
                        Id = Guid.NewGuid(),
                        EncomendaId = encomenda.Id,
                        ProdutoId = prod.Id,
                        Tamanho = tams[rngItens.Next(tams.Length)],
                        Quantidade = rngItens.Next(1, 6),
                        PrecoUnitario = precoPorRef[prod.Ref],
                    });
                }
            }
            var itensPorEncomenda = db.ItensEncomenda
                .GroupBy(i => i.EncomendaId)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantidade));
            foreach (var enc in db.Encomendas.ToList())
            {
                if (itensPorEncomenda.TryGetValue(enc.Id, out var p))
                    enc.Pecas = p;
            }
            await db.SaveChangesAsync();
        }

        // 8. Itens de Venda (com ProdutoId)
        if (!db.ItensVenda.Any() && db.Vendas.Any())
        {
            var produtosSeed = db.Produtos
                .Select(p => new { p.Id, p.Ref })
                .ToList();
            var tamanhosPorRef = new Dictionary<string, string[]>
            {
                ["CM-001"]=["PP","P","M","G","GG"], ["CM-002"]=["PP","P","M","G","GG"],
                ["CM-003"]=["P","M","G"],            ["CJ-001"]=["4","6","8","10"],
                ["CJ-002"]=["4","6","8","10"],       ["CJ-003"]=["M","G","GG"],
                ["CM-004"]=["P","M","G"],            ["CJ-004"]=["P","M","G"],
                ["PT-001"]=["38","39","40","41"],    ["PT-002"]=["35","36","37"],
            };
            var precoPorRef = new Dictionary<string, decimal>
            {
                ["CM-001"]=89.90m,["CM-002"]=89.90m,["CM-003"]=79.90m,["CJ-001"]=59.90m,
                ["CJ-002"]=59.90m,["CJ-003"]=85.00m,["CM-004"]=95.00m,["CJ-004"]=75.00m,
                ["PT-001"]=45.00m,["PT-002"]=49.90m,
            };
            var rngItens = new Random(23);
            foreach (var venda in db.Vendas.ToList())
            {
                var qtdItens = rngItens.Next(1, Math.Max(2, venda.Pecas));
                for (int i = 0; i < qtdItens; i++)
                {
                    var prod = produtosSeed[rngItens.Next(produtosSeed.Count)];
                    var tams = tamanhosPorRef.TryGetValue(prod.Ref, out var t) ? t : ["M"];
                    db.ItensVenda.Add(new ItemVenda
                    {
                        Id = Guid.NewGuid(),
                        VendaId = venda.Id,
                        ProdutoId = prod.Id,
                        Tamanho = tams[rngItens.Next(tams.Length)],
                        Quantidade = rngItens.Next(1, 4),
                        PrecoUnitario = precoPorRef.TryGetValue(prod.Ref, out var pr) ? pr : 0m,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // 9. Fichas (com ClienteId — revendedoras são clientes Varejo)
        if (!db.Fichas.Any())
        {
            var revendedoraIds = db.Clientes
                .Where(c => c.Tipo == TipoCliente.Varejo && c.Status == "Ativo")
                .Select(c => c.Id).ToArray();
            var statusList = new[] { StatusFicha.Aberta, StatusFicha.Parcial, StatusFicha.Finalizada };
            var diasFichas = new Dictionary<int, int>
            {
                { 2, 2 }, { 5, 5 }, { 7, 3 }, { 9, 6 },
                { 12, 2 }, { 14, 5 }, { 16, 6 }, { 19, 2 },
                { 21, 5 }, { 23, 3 }, { 26, 6 }, { 29, 4 },
            };
            var rng = new Random(13);
            foreach (var (dia, qtd) in diasFichas)
            {
                for (int i = 0; i < qtd; i++)
                {
                    var criado = new DateTime(2026, 5, dia, rng.Next(8, 17), rng.Next(0, 60), 0, DateTimeKind.Utc);
                    var enviadas = rng.Next(5, 25);
                    var devolvidas = rng.Next(0, enviadas / 2);
                    var vendidas = Math.Max(0, enviadas - devolvidas - rng.Next(0, 3));
                    db.Fichas.Add(new Ficha
                    {
                        Id = Guid.NewGuid(),
                        ClienteId = revendedoraIds[rng.Next(revendedoraIds.Length)],
                        DataAbertura = criado,
                        Enviadas = enviadas, Devolvidas = devolvidas, Vendidas = vendidas,
                        TotalVendido = Math.Round(vendidas * (decimal)(rng.NextDouble() * 40 + 55), 2),
                        Status = statusList[rng.Next(statusList.Length)],
                        CriadoEm = criado, AtualizadoEm = criado,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // 10. Contas (com ClienteId)
        if (!db.Contas.Any())
        {
            var clienteIds = db.Clientes.Where(c => c.Status == "Ativo").Select(c => c.Id).ToArray();
            var origens = new[] { "Venda Balcão", "Encomenda", "Ficha Revendedora", "Acerto Parcial" };
            var statusList = new[] { StatusConta.Aberto, StatusConta.Parcial, StatusConta.Pago, StatusConta.Atrasado };
            var diasContas = new Dictionary<int, int>
            {
                { 2, 4 }, { 5, 6 }, { 6, 5 }, { 9, 10 },
                { 12, 4 }, { 13, 5 }, { 16, 10 }, { 19, 3 },
                { 21, 6 }, { 22, 10 }, { 26, 5 }, { 28, 4 },
            };
            var rng = new Random(99);
            foreach (var (dia, qtd) in diasContas)
            {
                for (int i = 0; i < qtd; i++)
                {
                    var criado = new DateTime(2026, 5, dia, rng.Next(8, 17), rng.Next(0, 60), 0, DateTimeKind.Utc);
                    var total = Math.Round((decimal)(rng.NextDouble() * 500 + 80), 2);
                    var status = statusList[rng.Next(statusList.Length)];
                    var recebido = status switch
                    {
                        StatusConta.Pago    => total,
                        StatusConta.Parcial => Math.Round(total * (decimal)(rng.NextDouble() * 0.6 + 0.1), 2),
                        _                   => 0m,
                    };
                    db.Contas.Add(new Conta
                    {
                        Id = Guid.NewGuid(),
                        ClienteId = clienteIds[rng.Next(clienteIds.Length)],
                        Origem = origens[rng.Next(origens.Length)],
                        Total = total, Recebido = recebido,
                        Vencimento = criado.AddDays(rng.Next(5, 30)),
                        Status = status,
                        CriadoEm = criado, AtualizadoEm = criado,
                    });
                }
            }
            await db.SaveChangesAsync();
        }
    }

    private static Cliente C(string nome, string tel, string cpf, TipoCliente tipo, string status, decimal credito, DateTime agora) =>
        new() { Id = Guid.NewGuid(), Nome = nome, Telefone = tel, Cpf = cpf, Tipo = tipo, Status = status, Credito = credito, CriadoEm = agora, AtualizadoEm = agora };

    private static Produto P(string nome, string refP, Guid? marcaId, Guid? tipoId, Guid? subtipoId, Guid? categoriaId, Guid? colecaoId, decimal varejo, decimal atacado, bool ativo, int estoque, DateTime agora) =>
        new() { Id = Guid.NewGuid(), Nome = nome, Ref = refP, MarcaId = marcaId, TipoId = tipoId, SubtipoId = subtipoId, CategoriaId = categoriaId, ColecaoId = colecaoId, PrecoVarejo = varejo, PrecoAtacado = atacado, Ativo = ativo, Estoque = estoque, CriadoEm = agora, AtualizadoEm = agora };
}
