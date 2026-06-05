using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class FichaService : IFichaService
{
    private readonly IFichaRepository _repo;
    private readonly IUnitOfWork _uow;

    public FichaService(IFichaRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public Task<(IEnumerable<Ficha> items, int total)> ListarAsync(
        string? search, string? status, int? minVendidas, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(search, status, minVendidas, pagina, tamanhoPagina);

    public Task<Ficha> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);

    public async Task<Ficha> CriarAsync(Ficha ficha)
    {
        var result = await _repo.CriarAsync(ficha);
        await _uow.CommitAsync();
        return result;
    }

    public async Task<Ficha> AtualizarAsync(Ficha ficha)
    {
        var result = await _repo.AtualizarAsync(ficha);
        await _uow.CommitAsync();
        return result;
    }
}
