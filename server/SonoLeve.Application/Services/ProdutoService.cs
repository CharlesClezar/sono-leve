using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ProdutoService : IProdutoService
{
    private readonly IProdutoRepository _repo;
    public ProdutoService(IProdutoRepository repo) => _repo = repo;

    public Task<(IEnumerable<Produto> items, int total)> ListarAsync(string? busca, string? marca, bool? ativo, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(busca, marca, ativo, pagina, tamanhoPagina);

    public Task<Produto> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);
    public Task<Produto> CriarAsync(Produto produto) => _repo.CriarAsync(produto);
    public Task<Produto> AtualizarAsync(Produto produto) => _repo.AtualizarAsync(produto);
}
