using Microsoft.EntityFrameworkCore;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Infra.Data;

public class SonoLeveDbContext : DbContext
{
    public SonoLeveDbContext(DbContextOptions<SonoLeveDbContext> opcoes) : base(opcoes) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SonoLeveDbContext).Assembly);
    }
}
