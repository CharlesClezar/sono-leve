using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class VendaService : IVendaService
{
    private readonly IVendaRepository _repo;
    public VendaService(IVendaRepository repo) => _repo = repo;

    public Task<(IEnumerable<Venda> items, int total)> ListarAsync(
        string? search, string? status, string? tipoCliente,
        string? formaPagamento, string? periodo, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(search, status, tipoCliente, formaPagamento, periodo, pagina, tamanhoPagina);

    public Task<Venda> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);

    public async Task<Venda> CriarAsync(Venda venda, IEnumerable<ItemVenda>? itens = null)
    {
        var criado = await _repo.CriarAsync(venda);
        if (itens != null)
            await _repo.SalvarItensAsync(criado.Id, itens);
        return criado;
    }

    public async Task<Venda> AtualizarAsync(Venda venda, IEnumerable<ItemVenda>? itens = null)
    {
        var atualizado = await _repo.AtualizarAsync(venda);
        if (itens != null)
            await _repo.SalvarItensAsync(atualizado.Id, itens);
        return atualizado;
    }

    public Task<IEnumerable<ItemVenda>> ObterItensAsync(Guid id) => _repo.ObterItensAsync(id);
}
