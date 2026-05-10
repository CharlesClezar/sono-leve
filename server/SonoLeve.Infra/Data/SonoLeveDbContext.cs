using Microsoft.EntityFrameworkCore;

namespace SonoLeve.Infra.Data;

public class SonoLeveDbContext : DbContext
{
    public SonoLeveDbContext(DbContextOptions<SonoLeveDbContext> opcoes) : base(opcoes) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SonoLeveDbContext).Assembly);
    }
}
