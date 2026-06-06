using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using System.Text.Json;

namespace SonoLeve.Infra.Data;

public class SonoLeveDbContext : DbContext, IUnitOfWork
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public SonoLeveDbContext(
        DbContextOptions<SonoLeveDbContext> opcoes,
        IHttpContextAccessor? httpContextAccessor = null) : base(opcoes)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Usuario> Usuario => Set<Usuario>();
    public DbSet<Cliente> Cliente => Set<Cliente>();
    public DbSet<Produto> Produto => Set<Produto>();
    public DbSet<Venda> Venda => Set<Venda>();
    public DbSet<Encomenda> Encomenda => Set<Encomenda>();
    public DbSet<ItemEncomenda> ItemEncomenda => Set<ItemEncomenda>();
    public DbSet<ItemVenda> ItemVenda => Set<ItemVenda>();
    public DbSet<Ficha> Ficha => Set<Ficha>();
    public DbSet<Conta> Conta => Set<Conta>();
    public DbSet<IdempotencyRecord> IdempotencyRecord => Set<IdempotencyRecord>();
    public DbSet<Marca> Marca => Set<Marca>();
    public DbSet<Categoria> Categoria => Set<Categoria>();
    public DbSet<Tipo> Tipo => Set<Tipo>();
    public DbSet<Subtipo> Subtipo => Set<Subtipo>();
    public DbSet<Colecao> Colecao => Set<Colecao>();
    public DbSet<FormaPagamento> FormaPagamento => Set<FormaPagamento>();
    public DbSet<BandeiraCartao> BandeiraCartao => Set<BandeiraCartao>();
    public DbSet<ConfiguracaoTaxaCartao> ConfiguracaoTaxaCartao => Set<ConfiguracaoTaxaCartao>();
    public DbSet<ConfiguracaoTaxaCartaoParcela> ConfiguracaoTaxaCartaoParcela => Set<ConfiguracaoTaxaCartaoParcela>();
    public DbSet<AuditLog> AuditLog => Set<AuditLog>();

    public Task CommitAsync(CancellationToken ct = default) => SaveChangesAsync(ct);

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Só audita dentro de uma request HTTP — exclui seed, migrations e jobs
        if (_httpContextAccessor?.HttpContext is null)
            return await base.SaveChangesAsync(cancellationToken);

        // Carrega valores originais do banco para entidades desconectadas (Update desanexado),
        // garantindo que ANTES reflita o estado real antes da alteração
        await CarregarValoresOriginaisAsync(cancellationToken);
        DescartarSemAlteracao();

        var pendentes = ColetarPendentes();
        var resultado = await base.SaveChangesAsync(cancellationToken);
        if (pendentes.Count > 0)
            await GravarAuditLogsAsync(pendentes, cancellationToken);
        return resultado;
    }

    private async Task CarregarValoresOriginaisAsync(CancellationToken ct)
    {
        var modificadas = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified
                     && e.Entity.GetType() != typeof(AuditLog)
                     && e.Entity.GetType() != typeof(IdempotencyRecord))
            .ToList();

        foreach (var entry in modificadas)
        {
            var dbValues = await entry.GetDatabaseValuesAsync(ct);
            if (dbValues is not null)
                entry.OriginalValues.SetValues(dbValues);
        }
    }

    // Entidades marcadas como Modified via Update() mas sem nenhuma propriedade
    // efetivamente alterada (ex.: navigation properties carregadas via AsNoTracking)
    // são revertidas para Unchanged — evita SQL UPDATE e auditoria desnecessários.
    private void DescartarSemAlteracao()
    {
        foreach (var entry in ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified
                     && e.Entity.GetType() != typeof(AuditLog)
                     && e.Entity.GetType() != typeof(IdempotencyRecord))
            .ToList())
        {
            if (!entry.Properties.Any(PropriedadeMudou))
                entry.State = EntityState.Unchanged;
        }
    }

    private static bool PropriedadeMudou(PropertyEntry p)
    {
        var comparer = p.Metadata.GetValueComparer();
        return comparer != null
            ? !comparer.Equals(p.OriginalValue, p.CurrentValue)
            : !object.Equals(p.OriginalValue, p.CurrentValue);
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
            .Where(e => e.Entity.GetType() != typeof(AuditLog)
                     && e.Entity.GetType() != typeof(IdempotencyRecord)
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

        AuditLog.AddRange(pendentes.Select(e => new AuditLog
        {
            Entidade = e.Entidade,
            EntidadeId = e.EntidadeId,
            Acao = e.Acao,
            DadosAntes = e.Antes,
            DadosDepois = e.Depois,
            Endpoint = endpoint,
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SonoLeveDbContext).Assembly);

        // Preserva nomes de tabela plurais existentes no banco
        modelBuilder.Entity<Usuario>().ToTable("Usuarios");
        modelBuilder.Entity<Cliente>().ToTable("Clientes");
        modelBuilder.Entity<Produto>().ToTable("Produtos");
        modelBuilder.Entity<Venda>().ToTable("Vendas");
        modelBuilder.Entity<Encomenda>().ToTable("Encomendas");
        modelBuilder.Entity<ItemEncomenda>().ToTable("ItensEncomenda");
        modelBuilder.Entity<ItemVenda>().ToTable("ItensVenda");
        modelBuilder.Entity<Ficha>().ToTable("Fichas");
        modelBuilder.Entity<Conta>().ToTable("Contas");
        modelBuilder.Entity<IdempotencyRecord>().ToTable("IdempotencyRecords");
        modelBuilder.Entity<Marca>().ToTable("Marcas");
        modelBuilder.Entity<Categoria>().ToTable("Categorias");
        modelBuilder.Entity<Tipo>().ToTable("Tipos");
        modelBuilder.Entity<Subtipo>().ToTable("Subtipos");
        modelBuilder.Entity<Colecao>().ToTable("Colecoes");
        modelBuilder.Entity<FormaPagamento>().ToTable("FormasPagamento");
        modelBuilder.Entity<BandeiraCartao>().ToTable("BandeirasCartao");
        modelBuilder.Entity<ConfiguracaoTaxaCartao>().ToTable("ConfiguracoesTaxaCartao");
        modelBuilder.Entity<ConfiguracaoTaxaCartaoParcela>().ToTable("ConfiguracoesTaxaCartaoParcelas");
        modelBuilder.Entity<AuditLog>().ToTable("AuditLogs");

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
