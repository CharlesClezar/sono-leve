using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IEncomendaService
{
    Task<(IEnumerable<Encomenda> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina);
    Task<Encomenda> ObterPorIdAsync(Guid id);
    Task<Encomenda> CriarAsync(Encomenda encomenda, IEnumerable<ItemEncomenda>? itens = null);
    Task<Encomenda> AtualizarAsync(Encomenda encomenda, IEnumerable<ItemEncomenda>? itens = null);
    Task<IEnumerable<ItemEncomenda>> ObterItensAsync(Guid id);
}
