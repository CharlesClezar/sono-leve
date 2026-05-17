using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class FichaRepository : IFichaRepository
{
    private readonly SonoLeveDbContext _db;
    public FichaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Ficha> items, int total)> ListarAsync(int pagina, int tamanhoPagina)
    {
        var query = _db.Fichas.AsQueryable();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(f => f.DataAbertura)
            .Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina).ToListAsync();
        return (items, total);
    }

    public async Task<Ficha> ObterPorIdAsync(Guid id) =>
        await _db.Fichas.FindAsync(id) ?? throw new KeyNotFoundException("Ficha não encontrada.");

    public async Task<Ficha> CriarAsync(Ficha ficha)
    {
        _db.Fichas.Add(ficha);
        await _db.SaveChangesAsync();
        return ficha;
    }

    public async Task<Ficha> AtualizarAsync(Ficha ficha)
    {
        ficha.AtualizadoEm = DateTime.UtcNow;
        _db.Fichas.Update(ficha);
        await _db.SaveChangesAsync();
        return ficha;
    }
}
