using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class EncomendaRepository : IEncomendaRepository
{
    private readonly SonoLeveDbContext _db;
    public EncomendaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Encomenda> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina)
    {
        search = search?.Length > 100 ? search[..100] : search;
        IQueryable<Encomenda> query = _db.Encomenda.AsNoTracking().Include(e => e.Cliente);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e => e.Cliente != null && e.Cliente.Nome.Contains(search));

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            var statuses = status
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => ParseStatus(s.Trim()))
                .OfType<StatusEncomenda>()
                .ToList();
            if (statuses.Count > 0)
                query = query.Where(e => statuses.Contains(e.Status));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.Previsao)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .ToListAsync();
        return (items, total);
    }

    public async Task<Encomenda> ObterPorIdAsync(Guid id) =>
        await _db.Encomenda.Include(e => e.Cliente)
            .FirstOrDefaultAsync(e => e.Id == id) ?? throw new KeyNotFoundException("Encomenda não encontrada.");

    public Task<Encomenda> CriarAsync(Encomenda encomenda)
    {
        _db.Encomenda.Add(encomenda);
        return Task.FromResult(encomenda);
    }

    public Task<Encomenda> AtualizarAsync(Encomenda encomenda)
    {
        encomenda.AtualizadoEm = DateTime.UtcNow;
        _db.Encomenda.Update(encomenda);
        return Task.FromResult(encomenda);
    }

    public async Task<IEnumerable<ItemEncomenda>> ObterItensAsync(Guid encomendaId) =>
        await _db.ItemEncomenda.Include(i => i.Produto).Where(i => i.EncomendaId == encomendaId).ToListAsync();

    public async Task SalvarItensAsync(Guid encomendaId, IEnumerable<ItemEncomenda> itens)
    {
        var existentes = await _db.ItemEncomenda.Where(i => i.EncomendaId == encomendaId).ToListAsync();
        _db.ItemEncomenda.RemoveRange(existentes);
        foreach (var item in itens)
        {
            item.EncomendaId = encomendaId;
            _db.ItemEncomenda.Add(item);
        }
    }

    private static StatusEncomenda? ParseStatus(string s) => s switch
    {
        "Em produção"            => StatusEncomenda.EmProducao,
        "Fabricado parcialmente" => StatusEncomenda.FabricadoParcialmente,
        "Novo"                   => StatusEncomenda.Aberta,
        _                        => Enum.TryParse<StatusEncomenda>(s, true, out var r) ? r : null
    };
}
