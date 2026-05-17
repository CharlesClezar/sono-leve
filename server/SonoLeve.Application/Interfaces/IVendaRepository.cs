using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IVendaRepository
{
    Task<(IEnumerable<Venda> items, int total)> ListarAsync(int pagina, int tamanhoPagina);
    Task<Venda> ObterPorIdAsync(Guid id);
    Task<Venda> CriarAsync(Venda venda);
    Task<Venda> AtualizarAsync(Venda venda);
    Task<IEnumerable<ItemVenda>> ObterItensAsync(Guid vendaId);
    Task SalvarItensAsync(Guid vendaId, IEnumerable<ItemVenda> itens);
}
