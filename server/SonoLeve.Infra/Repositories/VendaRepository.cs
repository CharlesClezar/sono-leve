using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class VendaRepository : IVendaRepository
{
    private const string PeriodoHoje = "hoje";
    private const string Periodo7Dias = "7d";
    private const string Periodo30Dias = "30d";
    private const string PeriodoTodos = "todos";

    private readonly SonoLeveDbContext _db;
    public VendaRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Venda> items, int total)> ListarAsync(
        string? search, string? status, string? tipoCliente,
        string? formaPagamento, string? periodo, int pagina, int tamanhoPagina)
    {
        search = search?.Length > 100 ? search[..100] : search;
        IQueryable<Venda> query = _db.Venda.AsNoTracking()
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

        if (!string.IsNullOrWhiteSpace(periodo) && periodo != PeriodoTodos)
        {
            var inicio = periodo switch
            {
                PeriodoHoje   => (DateTime?)DateTime.UtcNow.Date,
                Periodo7Dias  => DateTime.UtcNow.AddDays(-7),
                Periodo30Dias => DateTime.UtcNow.AddDays(-30),
                _             => null
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
        await _db.Venda.Include(v => v.Cliente).Include(v => v.FormaPagamento)
            .FirstOrDefaultAsync(v => v.Id == id) ?? throw new KeyNotFoundException("Venda não encontrada.");

    public Task<Venda> CriarAsync(Venda venda)
    {
        _db.Venda.Add(venda);
        return Task.FromResult(venda);
    }

    public Task<Venda> AtualizarAsync(Venda venda)
    {
        venda.AtualizadoEm = DateTime.UtcNow;
        _db.Venda.Update(venda);
        return Task.FromResult(venda);
    }

    public async Task<IEnumerable<ItemVenda>> ObterItensAsync(Guid vendaId) =>
        await _db.ItemVenda.Include(i => i.Produto).Where(i => i.VendaId == vendaId).ToListAsync();

    public async Task SalvarItensAsync(Guid vendaId, IEnumerable<ItemVenda> itens)
    {
        var existentes = await _db.ItemVenda.Where(i => i.VendaId == vendaId).ToListAsync();
        _db.ItemVenda.RemoveRange(existentes);
        foreach (var item in itens)
        {
            item.VendaId = vendaId;
            _db.ItemVenda.Add(item);
        }
    }
}
