using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class IdempotencyService : IIdempotencyService
{
    private readonly SonoLeveDbContext _db;

    public IdempotencyService(SonoLeveDbContext db) => _db = db;

    public async Task<IdempotencyRecord?> ObterAsync(string key)
    {
        var registro = await _db.IdempotencyRecords.FindAsync(key);
        if (registro == null || registro.ExpiraEm < DateTime.UtcNow) return null;
        return registro;
    }

    public async Task SalvarAsync(IdempotencyRecord registro)
    {
        _db.IdempotencyRecords.Add(registro);
        await _db.SaveChangesAsync();
    }
}
