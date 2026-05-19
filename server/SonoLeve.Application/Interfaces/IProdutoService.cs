using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IProdutoService
{
    Task<(IEnumerable<Produto> items, int total)> ListarAsync(string? busca, string? marca, bool? ativo, int pagina, int tamanhoPagina);
    Task<Produto> ObterPorIdAsync(Guid id);
    Task<Produto> CriarAsync(Produto produto);
    Task<Produto> AtualizarAsync(Produto produto);
}
