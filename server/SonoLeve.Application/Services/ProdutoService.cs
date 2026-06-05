using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ProdutoService : IProdutoService
{
    private readonly IProdutoRepository _repo;
    private readonly IUnitOfWork _uow;

    public ProdutoService(IProdutoRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public Task<(IEnumerable<Produto> items, int total)> ListarAsync(string? busca, string? marca, bool? ativo, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(busca, marca, ativo, pagina, tamanhoPagina);

    public Task<Produto> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);

    public async Task<Produto> CriarAsync(Produto produto)
    {
        var result = await _repo.CriarAsync(produto);
        await _uow.CommitAsync();
        return result;
    }

    public async Task<Produto> AtualizarAsync(Produto produto)
    {
        var result = await _repo.AtualizarAsync(produto);
        await _uow.CommitAsync();
        return result;
    }
}
