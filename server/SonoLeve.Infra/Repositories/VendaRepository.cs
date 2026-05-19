using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class VendaRepository : IVendaRepository
{
    private readonly SonoLeveDbContext _db;
    public VendaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Venda> items, int total)> ListarAsync(
        string? search, string? status, string? tipoCliente,
        string? formaPagamento, string? periodo, int pagina, int tamanhoPagina)
    {
        search = search?.Length > 100 ? search[..100] : search;
        IQueryable<Venda> query = _db.Vendas
            .Include(v => v.Cliente)
            .Include(v => v.FormaPagamento);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v => v.Cliente != null && v.Cliente.Nome.Contains(search));

        if (!string.IsNullOrWhiteSpace(status) && status != "all" &&
            Enum.TryParse<StatusVenda>(status, true, out var sv))
            query = query.Where(v => v.Status == sv);

        if (!string.IsNullOrWhiteSpace(tipoCliente) && tipoCliente != "all" &&
            Enum.TryParse<TipoCliente>(tipoCliente, true, out var tc))
            query = query.Where(v => v.Cliente != null && v.Cliente.Tipo == tc);

        if (!string.IsNullOrWhiteSpace(formaPagamento) && formaPagamento != "all")
            query = query.Where(v => v.FormaPagamento != null &&
                                     v.FormaPagamento.Nome.Contains(formaPagamento));

        if (!string.IsNullOrWhiteSpace(periodo) && periodo != "todos")
        {
            var inicio = periodo switch
            {
                "hoje" => (DateTime?)DateTime.UtcNow.Date,
                "7d"   => DateTime.UtcNow.AddDays(-7),
                "30d"  => DateTime.UtcNow.AddDays(-30),
                _      => null
            };
            if (inicio.HasValue)
                query = query.Where(v => v.Data >= inicio.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(v => v.Data)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .ToListAsync();
        return (items, total);
    }

    public async Task<Venda> ObterPorIdAsync(Guid id) =>
        await _db.Vendas.Include(v => v.Cliente).Include(v => v.FormaPagamento)
            .FirstOrDefaultAsync(v => v.Id == id) ?? throw new KeyNotFoundException("Venda não encontrada.");

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
        await _db.ItensVenda.Include(i => i.Produto).Where(i => i.VendaId == vendaId).ToListAsync();

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
