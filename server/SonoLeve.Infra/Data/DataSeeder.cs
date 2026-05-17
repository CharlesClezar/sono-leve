using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Infra.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(SonoLeveDbContext db)
    {
        var agora = DateTime.UtcNow;

        if (!db.Clientes.Any())
        {
            db.Clientes.AddRange(
                C("Ana Paula Ferreira",       "(11) 98234-5678", "123.456.789-00", TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Carlos Eduardo Matos",     "(11) 97654-3210", "234.567.890-11", TipoCliente.Varejo,  "Ativo",   150,  agora),
                C("Fernanda Souza",           "(21) 99123-4567", "345.678.901-22", TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Roberto Lima",             "(21) 98765-4321", "456.789.012-33", TipoCliente.Varejo,  "Inativo", 0,    agora),
                C("Márcia Oliveira",          "(31) 99876-5432", "567.890.123-44", TipoCliente.Varejo,  "Ativo",   300,  agora),
                C("Paulo Henrique Costa",     "(31) 98901-2345", "678.901.234-55", TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Juliana Ramos",            "(41) 99012-3456", "789.012.345-66", TipoCliente.Varejo,  "Ativo",   80,   agora),
                C("Boutique Dona Rosa",       "(11) 3345-6789",  "11.222.333/0001-44", TipoCliente.Atacado, "Ativo", 2000, agora),
                C("Distribuidora Pijamas Sul","(51) 3456-7890",  "22.333.444/0001-55", TipoCliente.Atacado, "Ativo", 5000, agora),
                C("Loja do Bebê Conforto",    "(41) 3567-8901",  "33.444.555/0001-66", TipoCliente.Atacado, "Ativo", 1500, agora),
                C("Tatiane Braga",            "(11) 97890-1234", "890.123.456-77", TipoCliente.Varejo,  "Ativo",   0,    agora),
                C("Marcos Vinicius Santos",   "(85) 98234-5670", "901.234.567-88", TipoCliente.Varejo,  "Ativo",   200,  agora),
                C("Simone Aparecida Nunes",   "(62) 99345-6781", "012.345.678-99", TipoCliente.Varejo,  "Inativo", 0,    agora),
                C("Confecções Norte Ltda",    "(92) 3456-7892",  "44.555.666/0001-77", TipoCliente.Atacado, "Ativo", 8000, agora),
                C("Patricia Gonçalves",       "(71) 99567-8903", "111.222.333-00", TipoCliente.Varejo,  "Ativo",   0,    agora)
            );
            await db.SaveChangesAsync();
        }

        if (!db.Produtos.Any())
        {
            db.Produtos.AddRange(
                P("Pijama Adulto Liso Azul",      "PJ-001", "Sono Leve", "Pijama", "Manga Longa", "Adulto Feminino",  "Inverno 2025", "Aurora",  89.90m, 65.00m, true, 42, agora),
                P("Pijama Adulto Liso Rosa",      "PJ-002", "Sono Leve", "Pijama", "Manga Longa", "Adulto Feminino",  "Inverno 2025", "Aurora",  89.90m, 65.00m, true, 38, agora),
                P("Pijama Adulto Estampado Lua",  "PJ-003", "Sono Leve", "Pijama", "Manga Curta", "Adulto Feminino",  "Inverno 2025", "Luna",    79.90m, 58.00m, true, 25, agora),
                P("Pijama Infantil Ursinhos",     "PJ-004", "Sono Leve", "Pijama", "Manga Longa", "Infantil",         "Outono 2025",  "Soft",    59.90m, 42.00m, true, 60, agora),
                P("Pijama Infantil Estrelas",     "PJ-005", "Sono Leve", "Pijama", "Manga Longa", "Infantil",         "Outono 2025",  "Soft",    59.90m, 42.00m, true, 55, agora),
                P("Pijama Adulto Masculino Azul", "PJ-006", "Sono Leve", "Pijama", "Manga Longa", "Adulto Masculino", "Inverno 2025", "Aurora",  85.00m, 62.00m, true, 30, agora),
                P("Camisola Adulto Renda",        "CM-001", "Sono Leve", "Camisola","Regata",      "Adulto Feminino",  "Verão 2025",   "Luna",    95.00m, 70.00m, true, 20, agora),
                P("Conjunto Short Doll Floral",   "SD-001", "Sono Leve", "Short Doll","Regata",    "Adulto Feminino",  "Verão 2025",   "Luna",    75.00m, 55.00m, true, 18, agora),
                P("Pantufa Adulto Soft",          "PT-001", "Sono Leve", "Pantufa", "Fechado",     "Pantufas",         "Básico",       "Soft",    45.00m, 32.00m, true, 80, agora),
                P("Pantufa Infantil Bichinhos",   "PT-002", "Sono Leve", "Pantufa", "Fechado",     "Pantufas",         "Outono 2025",  "Soft",    49.90m, 35.00m, true, 65, agora)
            );
            await db.SaveChangesAsync();
        }

        if (!db.CatalogoMarcas.Any())
        {
            db.CatalogoMarcas.AddRange(
                new CatalogoMarca { Name = "Sono Leve",         Active = true },
                new CatalogoMarca { Name = "Clelia Anastácio",  Active = true },
                new CatalogoMarca { Name = "Thainá Reichen",    Active = true },
                new CatalogoMarca { Name = "Ronca&Fuça",        Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.CategoriasBase.Any())
        {
            db.CategoriasBase.AddRange(
                new CatalogoCategoria { Name = "Adulto Masculino", Grade = ["P", "M", "G", "GG"],                    Active = true },
                new CatalogoCategoria { Name = "Adulto Feminino",  Grade = ["P", "M", "G", "GG"],                    Active = true },
                new CatalogoCategoria { Name = "Infantil",         Grade = ["2", "4", "6", "8", "10", "12"],         Active = true },
                new CatalogoCategoria { Name = "Pantufas",         Grade = ["34/35", "36/37", "38/39", "40/41"],     Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.CatalogoTipos.Any())
        {
            db.CatalogoTipos.AddRange(
                new CatalogoTipo { Name = "Pijama",     Active = true },
                new CatalogoTipo { Name = "Camisola",   Active = true },
                new CatalogoTipo { Name = "Short Doll", Active = true },
                new CatalogoTipo { Name = "Pantufa",    Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.CatalogoSubtipos.Any())
        {
            db.CatalogoSubtipos.AddRange(
                new CatalogoSubtipo { Name = "Manga Longa", Type = "Pijama",     Active = true },
                new CatalogoSubtipo { Name = "Manga Curta", Type = "Pijama",     Active = true },
                new CatalogoSubtipo { Name = "Regata",      Type = "Camisola",   Active = true },
                new CatalogoSubtipo { Name = "Regata",      Type = "Short Doll", Active = true },
                new CatalogoSubtipo { Name = "Fechado",     Type = "Pantufa",    Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.CatalogoColecoes.Any())
        {
            db.CatalogoColecoes.AddRange(
                new CatalogoColecao { Name = "Inverno 2025", Period = "Sazonal",   Active = true },
                new CatalogoColecao { Name = "Outono 2025",  Period = "Sazonal",   Active = true },
                new CatalogoColecao { Name = "Verão 2025",   Period = "Sazonal",   Active = true },
                new CatalogoColecao { Name = "Básico",       Period = "Contínua",  Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.CatalogoModelos.Any())
        {
            db.CatalogoModelos.AddRange(
                new CatalogoModelo { Name = "Aurora", Active = true },
                new CatalogoModelo { Name = "Luna",   Active = true },
                new CatalogoModelo { Name = "Soft",   Active = true }
            );
            await db.SaveChangesAsync();
        }

        if (!db.Vendas.Any())
        {
            var clientes = new[]
            {
                "Ana Paula Ferreira", "Carlos Eduardo Matos", "Fernanda Souza",
                "Márcia Oliveira", "Paulo Henrique Costa", "Juliana Ramos",
                "Boutique Dona Rosa", "Tatiane Braga", "Patricia Gonçalves",
                "Marcos Vinicius Santos", "Confecções Norte Ltda", "Loja do Bebê Conforto"
            };
            var pagamentos = new[] { "Dinheiro", "Pix", "Cartão Débito", "Cartão Crédito" };
            var origens = new[] { OrigemVenda.Balcao, OrigemVenda.Balcao, OrigemVenda.Encomenda, OrigemVenda.Ficha };

            var rng = new Random(42);

            // Abril 2026 — cobre o filtro "últimos 30 dias" a partir de maio
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
                    var total = Math.Round(pecas * (decimal)(rng.NextDouble() * 70 + 40), 2);
                    db.Vendas.Add(new Venda
                    {
                        Id = Guid.NewGuid(),
                        Cliente = clientes[rng.Next(clientes.Length)],
                        Data = data,
                        Pecas = pecas,
                        Pagamento = pagamentos[rng.Next(pagamentos.Length)],
                        Total = total,
                        Status = rng.Next(10) < 9 ? StatusVenda.Gerada : StatusVenda.Cancelada,
                        Origem = origens[rng.Next(origens.Length)],
                        CriadoEm = data,
                        AtualizadoEm = data,
                    });
                }
            }

            // Maio 2026 — cobertura completa do mês
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
                    var total = Math.Round(pecas * (decimal)(rng.NextDouble() * 60 + 45), 2);
                    db.Vendas.Add(new Venda
                    {
                        Id = Guid.NewGuid(),
                        Cliente = clientes[rng.Next(clientes.Length)],
                        Data = data,
                        Pecas = pecas,
                        Pagamento = pagamentos[rng.Next(pagamentos.Length)],
                        Total = total,
                        Status = rng.Next(10) < 9 ? StatusVenda.Gerada : StatusVenda.Cancelada,
                        Origem = origens[rng.Next(origens.Length)],
                        CriadoEm = data,
                        AtualizadoEm = data,
                    });
                }
            }

            await db.SaveChangesAsync();
        }

        if (!db.Encomendas.Any())
        {
            var clientes = new[]
            {
                "Boutique Dona Rosa", "Distribuidora Pijamas Sul", "Loja do Bebê Conforto",
                "Confecções Norte Ltda", "Ana Paula Ferreira", "Fernanda Souza",
                "Juliana Ramos", "Márcia Oliveira"
            };
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
                    var hora = rng.Next(8, 17);
                    var criado = new DateTime(2026, 5, dia, hora, rng.Next(0, 60), 0, DateTimeKind.Utc);
                    var previsaoDias = rng.Next(7, 30);
                    var previsao = criado.AddDays(previsaoDias);
                    var total = Math.Round((decimal)(rng.NextDouble() * 800 + 200), 2);
                    var entrada = Math.Round(total * (decimal)(rng.NextDouble() * 0.4 + 0.2), 2);
                    db.Encomendas.Add(new Encomenda
                    {
                        Id = Guid.NewGuid(),
                        Cliente = clientes[rng.Next(clientes.Length)],
                        Previsao = previsao,
                        Total = total,
                        Entrada = entrada,
                        Status = statusList[rng.Next(statusList.Length)],
                        CriadoEm = criado,
                        AtualizadoEm = criado,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        if (!db.ItensEncomenda.Any() && db.Encomendas.Any())
        {
            var produtosSeed = new[] {
                (nome: "Pijama Adulto Liso Azul",    refP: "PJ-001", tam: new[] { "P", "M", "G", "GG" }, preco: 89.90m),
                (nome: "Pijama Adulto Liso Rosa",    refP: "PJ-002", tam: new[] { "P", "M", "G", "GG" }, preco: 89.90m),
                (nome: "Pijama Adulto Estampado Lua",refP: "PJ-003", tam: new[] { "P", "M", "G"        }, preco: 79.90m),
                (nome: "Pijama Infantil Ursinhos",   refP: "PJ-004", tam: new[] { "4", "6", "8", "10"  }, preco: 59.90m),
                (nome: "Pijama Infantil Estrelas",   refP: "PJ-005", tam: new[] { "4", "6", "8", "10"  }, preco: 59.90m),
                (nome: "Pijama Adulto Masculino Azul",refP:"PJ-006", tam: new[] { "M", "G", "GG"       }, preco: 85.00m),
                (nome: "Camisola Adulto Renda",      refP: "CM-001", tam: new[] { "P", "M", "G"        }, preco: 95.00m),
                (nome: "Conjunto Short Doll Floral", refP: "SD-001", tam: new[] { "P", "M", "G"        }, preco: 75.00m),
            };
            var rngItens = new Random(17);
            var encomendas = db.Encomendas.ToList();
            foreach (var encomenda in encomendas)
            {
                var qtdItens = rngItens.Next(1, 4);
                for (int i = 0; i < qtdItens; i++)
                {
                    var prod = produtosSeed[rngItens.Next(produtosSeed.Length)];
                    var tam = prod.tam[rngItens.Next(prod.tam.Length)];
                    db.ItensEncomenda.Add(new ItemEncomenda
                    {
                        Id = Guid.NewGuid(),
                        EncomendaId = encomenda.Id,
                        Produto = prod.nome,
                        Ref = prod.refP,
                        Tamanho = tam,
                        Quantidade = rngItens.Next(1, 6),
                        PrecoUnitario = prod.preco,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // Backfill Pecas para encomendas que tenham itens mas Pecas ainda zerado
        if (db.Encomendas.Any(e => e.Pecas == 0) && db.ItensEncomenda.Any())
        {
            var itensPorEncomenda = db.ItensEncomenda
                .GroupBy(i => i.EncomendaId)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantidade));
            foreach (var enc in db.Encomendas.Where(e => e.Pecas == 0))
            {
                if (itensPorEncomenda.TryGetValue(enc.Id, out var p) && p > 0)
                    enc.Pecas = p;
            }
            await db.SaveChangesAsync();
        }

        if (!db.ItensVenda.Any() && db.Vendas.Any())
        {
            var produtosSeed = new[] {
                (nome: "Pijama Adulto Liso Azul",    refP: "PJ-001", tam: new[] { "P", "M", "G", "GG" }, preco: 89.90m),
                (nome: "Pijama Adulto Liso Rosa",    refP: "PJ-002", tam: new[] { "P", "M", "G", "GG" }, preco: 89.90m),
                (nome: "Pijama Adulto Estampado Lua",refP: "PJ-003", tam: new[] { "P", "M", "G"        }, preco: 79.90m),
                (nome: "Pijama Infantil Ursinhos",   refP: "PJ-004", tam: new[] { "4", "6", "8", "10"  }, preco: 59.90m),
                (nome: "Pijama Infantil Estrelas",   refP: "PJ-005", tam: new[] { "4", "6", "8", "10"  }, preco: 59.90m),
                (nome: "Pijama Adulto Masculino Azul",refP:"PJ-006", tam: new[] { "M", "G", "GG"       }, preco: 85.00m),
                (nome: "Camisola Adulto Renda",      refP: "CM-001", tam: new[] { "P", "M", "G"        }, preco: 95.00m),
                (nome: "Conjunto Short Doll Floral", refP: "SD-001", tam: new[] { "P", "M", "G"        }, preco: 75.00m),
                (nome: "Pantufa Adulto Soft",        refP: "PT-001", tam: new[] { "38/39", "40/41"     }, preco: 45.00m),
                (nome: "Pantufa Infantil Bichinhos", refP: "PT-002", tam: new[] { "34/35", "36/37"     }, preco: 49.90m),
            };
            var rngItens = new Random(23);
            var vendas = db.Vendas.ToList();
            foreach (var venda in vendas)
            {
                var qtdItens = rngItens.Next(1, Math.Max(2, venda.Pecas));
                for (int i = 0; i < qtdItens; i++)
                {
                    var prod = produtosSeed[rngItens.Next(produtosSeed.Length)];
                    var tam = prod.tam[rngItens.Next(prod.tam.Length)];
                    db.ItensVenda.Add(new ItemVenda
                    {
                        Id = Guid.NewGuid(),
                        VendaId = venda.Id,
                        Produto = prod.nome,
                        Ref = prod.refP,
                        Tamanho = tam,
                        Quantidade = rngItens.Next(1, 4),
                        PrecoUnitario = prod.preco,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        if (!db.Fichas.Any())
        {
            var revendedoras = new[]
            {
                "Maria das Graças", "Sandra Melo", "Luciana Farias",
                "Cláudia Torres", "Beatriz Andrade", "Vanessa Lima",
                "Rosana Campos", "Eliane Carvalho"
            };
            var statusList = new[]
            {
                StatusFicha.Aberta, StatusFicha.Parcial, StatusFicha.Finalizada,
            };

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
                    var vendidas = enviadas - devolvidas - rng.Next(0, 3);
                    if (vendidas < 0) vendidas = 0;
                    var totalVendido = Math.Round(vendidas * (decimal)(rng.NextDouble() * 40 + 55), 2);
                    db.Fichas.Add(new Ficha
                    {
                        Id = Guid.NewGuid(),
                        Revendedora = revendedoras[rng.Next(revendedoras.Length)],
                        DataAbertura = criado,
                        Enviadas = enviadas,
                        Devolvidas = devolvidas,
                        Vendidas = vendidas,
                        TotalVendido = totalVendido,
                        Status = statusList[rng.Next(statusList.Length)],
                        CriadoEm = criado,
                        AtualizadoEm = criado,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        if (!db.Contas.Any())
        {
            var clientes = new[]
            {
                "Ana Paula Ferreira", "Carlos Eduardo Matos", "Boutique Dona Rosa",
                "Distribuidora Pijamas Sul", "Loja do Bebê Conforto", "Confecções Norte Ltda",
                "Márcia Oliveira", "Fernanda Souza", "Juliana Ramos", "Patricia Gonçalves"
            };
            var origens = new[] { "Venda Balcão", "Encomenda", "Ficha Revendedora", "Acerto Parcial" };
            var statusList = new[]
            {
                StatusConta.Aberto, StatusConta.Parcial, StatusConta.Pago,
                StatusConta.Atrasado,
            };

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
                        StatusConta.Pago => total,
                        StatusConta.Parcial => Math.Round(total * (decimal)(rng.NextDouble() * 0.6 + 0.1), 2),
                        _ => 0m,
                    };
                    var vencimentoDias = rng.Next(5, 30);
                    db.Contas.Add(new Conta
                    {
                        Id = Guid.NewGuid(),
                        Cliente = clientes[rng.Next(clientes.Length)],
                        Origem = origens[rng.Next(origens.Length)],
                        Total = total,
                        Recebido = recebido,
                        Vencimento = criado.AddDays(vencimentoDias),
                        Status = status,
                        CriadoEm = criado,
                        AtualizadoEm = criado,
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        if (!db.FormasPagamento.Any())
        {
            db.FormasPagamento.AddRange(
                new FormaPagamento { Nome = "Pix",           Condicao = "À vista",  Taxa = "0%",                    Ativo = true },
                new FormaPagamento { Nome = "Dinheiro",      Condicao = "À vista",  Taxa = "0%",                    Ativo = true },
                new FormaPagamento { Nome = "Cartão Débito", Condicao = "À vista",  Taxa = "Conforme maquininha",   Ativo = true },
                new FormaPagamento { Nome = "Cartão Crédito",Condicao = "Até 3x",   Taxa = "Conforme maquininha",   Ativo = true },
                new FormaPagamento { Nome = "Boleto",        Condicao = "7 dias",   Taxa = "0%",                    Ativo = false }
            );
            await db.SaveChangesAsync();
        }
    }

    private static Cliente C(string nome, string tel, string cpf, TipoCliente tipo, string status, decimal credito, DateTime agora) =>
        new() { Id = Guid.NewGuid(), Nome = nome, Telefone = tel, Cpf = cpf, Tipo = tipo, Status = status, Credito = credito, CriadoEm = agora, AtualizadoEm = agora };

    private static Produto P(string nome, string refP, string marca, string tipo, string subtipo, string categoria, string colecao, string modelo, decimal varejo, decimal atacado, bool ativo, int estoque, DateTime agora) =>
        new() { Id = Guid.NewGuid(), Nome = nome, Ref = refP, Marca = marca, Tipo = tipo, Subtipo = subtipo, Categoria = categoria, Colecao = colecao, Modelo = modelo, PrecoVarejo = varejo, PrecoAtacado = atacado, Ativo = ativo, Estoque = estoque, CriadoEm = agora, AtualizadoEm = agora };

}
