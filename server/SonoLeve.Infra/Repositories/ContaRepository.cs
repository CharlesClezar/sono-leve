using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class ContaRepository : IContaRepository
{
    private readonly SonoLeveDbContext _db;
    public ContaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Conta> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina)
    {
        search = search?.Length > 100 ? search[..100] : search;
        IQueryable<Conta> query = _db.Contas.AsNoTracking().Include(c => c.Cliente);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Cliente != null && c.Cliente.Nome.Contains(search));

        if (!string.IsNullOrWhiteSpace(status) && status != "all" &&
            Enum.TryParse<StatusConta>(status, true, out var sc))
            query = query.Where(c => c.Status == sc);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.Vencimento)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .ToListAsync();
        return (items, total);
    }

    public async Task<Conta> ObterPorIdAsync(Guid id) =>
        await _db.Contas.Include(c => c.Cliente)
            .FirstOrDefaultAsync(c => c.Id == id) ?? throw new KeyNotFoundException("Conta não encontrada.");

    public async Task<Conta?> ObterPorVendaIdAsync(Guid vendaId) =>
        await _db.Contas.Include(c => c.Cliente)
            .FirstOrDefaultAsync(c => c.VendaId == vendaId);

    public async Task<Conta> CriarAsync(Conta conta)
    {
        _db.Contas.Add(conta);
        await _db.SaveChangesAsync();
        return conta;
    }

    public async Task<Conta> AtualizarAsync(Conta conta)
    {
        conta.AtualizadoEm = DateTime.UtcNow;
        _db.Contas.Update(conta);
        await _db.SaveChangesAsync();
        return conta;
    }
}
