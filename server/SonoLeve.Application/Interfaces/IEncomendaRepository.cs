using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IEncomendaRepository
{
    Task<(IEnumerable<Encomenda> items, int total)> ListarAsync(int pagina, int tamanhoPagina);
    Task<Encomenda> ObterPorIdAsync(Guid id);
    Task<Encomenda> CriarAsync(Encomenda encomenda);
    Task<Encomenda> AtualizarAsync(Encomenda encomenda);
    Task<IEnumerable<ItemEncomenda>> ObterItensAsync(Guid encomendaId);
    Task SalvarItensAsync(Guid encomendaId, IEnumerable<ItemEncomenda> itens);
}
