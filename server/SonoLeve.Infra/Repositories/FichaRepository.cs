using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class FichaRepository : IFichaRepository
{
    private readonly SonoLeveDbContext _db;
    public FichaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Ficha> items, int total)> ListarAsync(
        string? search, string? status, int? minVendidas, int pagina, int tamanhoPagina)
    {
        search = search?.Length > 100 ? search[..100] : search;
        IQueryable<Ficha> query = _db.Fichas.AsNoTracking().Include(f => f.Cliente);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => f.Cliente != null && f.Cliente.Nome.Contains(search));

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            var statuses = status
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => Enum.TryParse<StatusFicha>(s.Trim(), true, out var sf) ? (StatusFicha?)sf : null)
                .OfType<StatusFicha>()
                .ToList();
            if (statuses.Count > 0)
                query = query.Where(f => statuses.Contains(f.Status));
        }

        if (minVendidas.HasValue)
            query = query.Where(f => f.Vendidas >= minVendidas.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(f => f.DataAbertura)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .ToListAsync();
        return (items, total);
    }

    public async Task<Ficha> ObterPorIdAsync(Guid id) =>
        await _db.Fichas.Include(f => f.Cliente)
            .FirstOrDefaultAsync(f => f.Id == id) ?? throw new KeyNotFoundException("Ficha não encontrada.");

    public Task<Ficha> CriarAsync(Ficha ficha)
    {
        _db.Fichas.Add(ficha);
        return Task.FromResult(ficha);
    }

    public Task<Ficha> AtualizarAsync(Ficha ficha)
    {
        ficha.AtualizadoEm = DateTime.UtcNow;
        _db.Fichas.Update(ficha);
        return Task.FromResult(ficha);
    }
}
