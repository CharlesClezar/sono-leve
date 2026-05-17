using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class VendaRepository : IVendaRepository
{
    private readonly SonoLeveDbContext _db;
    public VendaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Venda> items, int total)> ListarAsync(int pagina, int tamanhoPagina)
    {
        var query = _db.Vendas.AsQueryable();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(v => v.Data)
            .Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina).ToListAsync();
        return (items, total);
    }

    public async Task<Venda> ObterPorIdAsync(Guid id) =>
        await _db.Vendas.FindAsync(id) ?? throw new KeyNotFoundException("Venda não encontrada.");

    public async Task<Venda> CriarAsync(Venda venda)
    {
        _db.Vendas.Add(venda);
        await _db.SaveChangesAsync();
        return venda;
    }

    public async Task<Venda> AtualizarAsync(Venda venda)
    {
        venda.AtualizadoEm = DateTime.UtcNow;
        _db.Vendas.Update(venda);
        await _db.SaveChangesAsync();
        return venda;
    }

    public async Task<IEnumerable<ItemVenda>> ObterItensAsync(Guid vendaId) =>
        await _db.ItensVenda.Where(i => i.VendaId == vendaId).ToListAsync();

    public async Task SalvarItensAsync(Guid vendaId, IEnumerable<ItemVenda> itens)
    {
        var existentes = await _db.ItensVenda.Where(i => i.VendaId == vendaId).ToListAsync();
        _db.ItensVenda.RemoveRange(existentes);
        foreach (var item in itens)
        {
            item.VendaId = vendaId;
            _db.ItensVenda.Add(item);
        }
        await _db.SaveChangesAsync();
    }
}
