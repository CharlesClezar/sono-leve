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
    public DbSet<CatalogoMarca> CatalogoMarcas => Set<CatalogoMarca>();
    public DbSet<CatalogoCategoria> CategoriasBase => Set<CatalogoCategoria>();
    public DbSet<CatalogoTipo> CatalogoTipos => Set<CatalogoTipo>();
    public DbSet<CatalogoSubtipo> CatalogoSubtipos => Set<CatalogoSubtipo>();
    public DbSet<CatalogoColecao> CatalogoColecoes => Set<CatalogoColecao>();
    public DbSet<CatalogoModelo> CatalogoModelos => Set<CatalogoModelo>();
    public DbSet<FormaPagamento> FormasPagamento => Set<FormaPagamento>();

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

        modelBuilder.Entity<CatalogoCategoria>()
            .Property(e => e.Grade)
            .HasConversion(gradeConverter, gradeComparer);
    }
}
