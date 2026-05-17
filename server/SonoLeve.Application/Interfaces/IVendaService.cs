using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IVendaService
{
    Task<(IEnumerable<Venda> items, int total)> ListarAsync(int pagina, int tamanhoPagina);
    Task<Venda> ObterPorIdAsync(Guid id);
    Task<Venda> CriarAsync(Venda venda, IEnumerable<ItemVenda>? itens = null);
    Task<Venda> AtualizarAsync(Venda venda, IEnumerable<ItemVenda>? itens = null);
    Task<IEnumerable<ItemVenda>> ObterItensAsync(Guid id);
}
