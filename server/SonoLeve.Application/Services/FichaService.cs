using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class FichaService : IFichaService
{
    private readonly IFichaRepository _repo;
    public FichaService(IFichaRepository repo) => _repo = repo;

    public Task<(IEnumerable<Ficha> items, int total)> ListarAsync(
        string? search, string? status, int? minVendidas, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(search, status, minVendidas, pagina, tamanhoPagina);

    public Task<Ficha> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);
    public Task<Ficha> CriarAsync(Ficha ficha) => _repo.CriarAsync(ficha);
    public Task<Ficha> AtualizarAsync(Ficha ficha) => _repo.AtualizarAsync(ficha);
}
