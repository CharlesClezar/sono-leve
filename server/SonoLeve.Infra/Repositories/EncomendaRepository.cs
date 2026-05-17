using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class EncomendaRepository : IEncomendaRepository
{
    private readonly SonoLeveDbContext _db;
    public EncomendaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Encomenda> items, int total)> ListarAsync(int pagina, int tamanhoPagina)
    {
        var query = _db.Encomendas.AsQueryable();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(e => e.Previsao)
            .Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina).ToListAsync();
        return (items, total);
    }

    public async Task<Encomenda> ObterPorIdAsync(Guid id) =>
        await _db.Encomendas.FindAsync(id) ?? throw new KeyNotFoundException("Encomenda não encontrada.");

    public async Task<Encomenda> CriarAsync(Encomenda encomenda)
    {
        _db.Encomendas.Add(encomenda);
        await _db.SaveChangesAsync();
        return encomenda;
    }

    public async Task<Encomenda> AtualizarAsync(Encomenda encomenda)
    {
        encomenda.AtualizadoEm = DateTime.UtcNow;
        _db.Encomendas.Update(encomenda);
        await _db.SaveChangesAsync();
        return encomenda;
    }

    public async Task<IEnumerable<ItemEncomenda>> ObterItensAsync(Guid encomendaId) =>
        await _db.ItensEncomenda.Where(i => i.EncomendaId == encomendaId).ToListAsync();

    public async Task SalvarItensAsync(Guid encomendaId, IEnumerable<ItemEncomenda> itens)
    {
        var existentes = await _db.ItensEncomenda.Where(i => i.EncomendaId == encomendaId).ToListAsync();
        _db.ItensEncomenda.RemoveRange(existentes);
        foreach (var item in itens)
        {
            item.EncomendaId = encomendaId;
            _db.ItensEncomenda.Add(item);
        }
        await _db.SaveChangesAsync();
    }
}
