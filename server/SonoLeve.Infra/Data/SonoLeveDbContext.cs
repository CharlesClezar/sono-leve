using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SonoLeve.Domain.Entities;
using System.Diagnostics;
using System.Text.Json;

namespace SonoLeve.Infra.Data;

public class SonoLeveDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public SonoLeveDbContext(
        DbContextOptions<SonoLeveDbContext> opcoes,
        IHttpContextAccessor? httpContextAccessor = null) : base(opcoes)
    {
        _httpContextAccessor = httpContextAccessor;
    }

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
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var pendentes = ColetarPendentes();
        var resultado = await base.SaveChangesAsync(cancellationToken);
        if (pendentes.Count > 0)
            await GravarAuditLogsAsync(pendentes, cancellationToken);
        return resultado;
    }

    private record EntradaAudit(
        string Entidade,
        string EntidadeId,
        string Acao,
        string? Antes,
        string? Depois);

    private List<EntradaAudit> ColetarPendentes()
    {
        return ChangeTracker.Entries()
            .Where(e => e.Entity is not AuditLog
                     && e.Entity is not IdempotencyRecord
                     && e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Select(e =>
            {
                var acao = e.State switch
                {
                    EntityState.Added => "Criado",
                    EntityState.Modified => "Alterado",
                    EntityState.Deleted => "Excluído",
                    _ => "Desconhecido"
                };

                var id = e.Properties
                    .FirstOrDefault(p => p.Metadata.Name == "Id")
                    ?.CurrentValue?.ToString() ?? "";

                var antes = e.State != EntityState.Added
                    ? SerializarProps(e.Properties, original: true)
                    : null;

                var depois = e.State != EntityState.Deleted
                    ? SerializarProps(e.Properties, original: false)
                    : null;

                return new EntradaAudit(e.Entity.GetType().Name, id, acao, antes, depois);
            })
            .ToList();
    }

    private async Task GravarAuditLogsAsync(List<EntradaAudit> pendentes, CancellationToken ct)
    {
        var endpoint = _httpContextAccessor?.HttpContext?.Request is { } req
            ? $"{req.Method} {req.Path}"
            : null;

        var stackTrace = CapturarStackTrace();

        AuditLogs.AddRange(pendentes.Select(e => new AuditLog
        {
            Entidade = e.Entidade,
            EntidadeId = e.EntidadeId,
            Acao = e.Acao,
            DadosAntes = e.Antes,
            DadosDepois = e.Depois,
            Endpoint = endpoint,
            StackTrace = stackTrace,
            OcorridoEm = DateTime.UtcNow,
        }));

        await base.SaveChangesAsync(ct);
    }

    private static string SerializarProps(IEnumerable<PropertyEntry> props, bool original)
    {
        var dict = props.ToDictionary(
            p => p.Metadata.Name,
            p => original ? p.OriginalValue : p.CurrentValue);
        return JsonSerializer.Serialize(dict);
    }

    private static string? CapturarStackTrace()
    {
        var linhas = new StackTrace()
            .GetFrames()
            ?.Select(f => f.GetMethod())
            .Where(m => m?.DeclaringType?.Namespace?.StartsWith("SonoLeve") == true)
            .Select(m => $"{m!.DeclaringType!.FullName}.{m.Name}")
            .ToArray();

        return linhas?.Length > 0 ? string.Join("\n", linhas) : null;
    }

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

        modelBuilder.Entity<ConfiguracaoTaxaCartao>()
            .HasMany(c => c.Parcelas)
            .WithOne(p => p.ConfiguracaoTaxaCartao)
            .HasForeignKey(p => p.ConfiguracaoTaxaCartaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Conta>()
            .HasOne(c => c.Venda)
            .WithMany()
            .HasForeignKey(c => c.VendaId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AuditLog>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.Id).UseIdentityColumn();
            b.Property(a => a.Entidade).HasMaxLength(100).IsRequired();
            b.Property(a => a.EntidadeId).HasMaxLength(100).IsRequired();
            b.Property(a => a.Acao).HasMaxLength(20).IsRequired();
            b.HasIndex(a => a.Entidade);
            b.HasIndex(a => a.OcorridoEm);
        });
    }
}
