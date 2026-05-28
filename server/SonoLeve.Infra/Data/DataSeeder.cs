using SonoLeve.Domain.Entities;

namespace SonoLeve.Infra.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(SonoLeveDbContext db)
    {
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
                new FormaPagamento { Nome = "Pix",            Tipo = "Pix",     PermiteParcelamento = false, ExigeBandeira = false, Ativo = true  },
                new FormaPagamento { Nome = "Dinheiro",       Tipo = "Dinheiro", PermiteParcelamento = false, ExigeBandeira = false, Ativo = true  },
                new FormaPagamento { Nome = "Cartão Débito",  Tipo = "Debito",  PermiteParcelamento = false, ExigeBandeira = true,  Ativo = true  },
                new FormaPagamento { Nome = "Cartão Crédito", Tipo = "Credito", PermiteParcelamento = true,  ExigeBandeira = true,  Ativo = true  },
                new FormaPagamento { Nome = "Boleto",         Tipo = "Boleto",  PermiteParcelamento = false, ExigeBandeira = false, Ativo = false }
            );
            await db.SaveChangesAsync();
        }

        // 3. Bandeiras de Cartão
        if (!db.BandeirasCartao.Any())
        {
            db.BandeirasCartao.AddRange(
                new BandeiraCartao { Nome = "Visa",             Ativo = true },
                new BandeiraCartao { Nome = "Mastercard",       Ativo = true },
                new BandeiraCartao { Nome = "Elo",              Ativo = true },
                new BandeiraCartao { Nome = "Hipercard",        Ativo = true },
                new BandeiraCartao { Nome = "American Express", Ativo = true }
            );
            await db.SaveChangesAsync();
        }

        // Dados transacionais (clientes, produtos, vendas, etc.) não são mais
        // semeados automaticamente — cadastre os dados reais pelo sistema.
    }
}
