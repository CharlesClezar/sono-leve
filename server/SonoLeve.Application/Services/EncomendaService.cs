using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class EncomendaService : IEncomendaService
{
    private readonly IEncomendaRepository _repo;
    public EncomendaService(IEncomendaRepository repo) => _repo = repo;

    public Task<(IEnumerable<Encomenda> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(search, status, pagina, tamanhoPagina);

    public Task<Encomenda> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);

    public async Task<Encomenda> CriarAsync(Encomenda encomenda, IEnumerable<ItemEncomenda>? itens = null)
    {
        var listaItens = PrepararItens(itens, encomenda);
        var criado = await _repo.CriarAsync(encomenda);
        if (listaItens != null)
            await _repo.SalvarItensAsync(criado.Id, listaItens);
        return criado;
    }

    public async Task<Encomenda> AtualizarAsync(Encomenda encomenda, IEnumerable<ItemEncomenda>? itens = null)
    {
        var listaItens = PrepararItens(itens, encomenda);
        var atualizado = await _repo.AtualizarAsync(encomenda);
        if (listaItens != null)
            await _repo.SalvarItensAsync(atualizado.Id, listaItens);
        return atualizado;
    }

    private static List<ItemEncomenda>? PrepararItens(IEnumerable<ItemEncomenda>? itens, Encomenda encomenda)
    {
        var lista = itens?.ToList();
        if (lista != null)
            encomenda.Pecas = lista.Sum(i => i.Quantidade);
        return lista;
    }

    public Task<IEnumerable<ItemEncomenda>> ObterItensAsync(Guid id) => _repo.ObterItensAsync(id);
}
