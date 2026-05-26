using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SonoLeve.Domain.Entities;
using System.Text.Json;

namespace SonoLeve.Infra.Data;

public class SonoLeveDbContext : DbContext
{
    public SonoLeveDbContext(DbContextOptions<SonoLeveDbContext> opcoes) : base(opcoes) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Venda> Vendas => Set<Venda>();
    public DbSet<Encomenda> Encomendas => Set<Encomenda>();
    public DbSet<ItemEncomenda> ItensEncomenda => Set<ItemEncomenda>();
    public DbSet<ItemVenda> ItensVenda => Set<ItemVenda>();
    public DbSet<Ficha> Fichas => Set<Ficha>();
    public DbSet<Conta> Contas => Set<Conta>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<Marca> Marcas => Set<Marca>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Tipo> Tipos => Set<Tipo>();
    public DbSet<Subtipo> Subtipos => Set<Subtipo>();
    public DbSet<Colecao> Colecoes => Set<Colecao>();
    public DbSet<FormaPagamento> FormasPagamento => Set<FormaPagamento>();
    public DbSet<BandeiraCartao> BandeirasCartao => Set<BandeiraCartao>();
    public DbSet<ConfiguracaoTaxaCartao> ConfiguracoesTaxaCartao => Set<ConfiguracaoTaxaCartao>();
    public DbSet<ConfiguracaoTaxaCartaoParcela> ConfiguracoesTaxaCartaoParcelas => Set<ConfiguracaoTaxaCartaoParcela>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SonoLeveDbContext).Assembly);

        var gradeConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
        );
        var gradeComparer = new ValueComparer<List<string>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            v => new List<string>(v)
        );

        modelBuilder.Entity<Categoria>()
            .Property(e => e.Grade)
            .HasConversion(gradeConverter, gradeComparer);

        // ConfiguracaoTaxaCartao: cascade delete para parcelas
        modelBuilder.Entity<ConfiguracaoTaxaCartao>()
            .HasMany(c => c.Parcelas)
            .WithOne(p => p.ConfiguracaoTaxaCartao)
            .HasForeignKey(p => p.ConfiguracaoTaxaCartaoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Conta → Venda: sem cascade (venda tem vida própria)
        modelBuilder.Entity<Conta>()
            .HasOne(c => c.Venda)
            .WithMany()
            .HasForeignKey(c => c.VendaId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
