using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class BandeiraCartaoService : IBandeiraCartaoService
{
    private readonly IBandeiraCartaoRepository _repo;
    private readonly IUnitOfWork _uow;

    public BandeiraCartaoService(IBandeiraCartaoRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public Task<IEnumerable<BandeiraCartao>> ListarAsync() => _repo.ListarAsync();

    public async Task<BandeiraCartao> ObterPorIdAsync(Guid id) =>
        await _repo.ObterPorIdAsync(id) ?? throw new KeyNotFoundException("Bandeira não encontrada.");

    public async Task<BandeiraCartao> CriarAsync(BandeiraCartao bandeira)
    {
        var result = await _repo.CriarAsync(bandeira);
        await _uow.CommitAsync();
        return result;
    }

    public async Task<BandeiraCartao> AtualizarAsync(BandeiraCartao bandeira)
    {
        var result = await _repo.AtualizarAsync(bandeira);
        await _uow.CommitAsync();
        return result;
    }

    public async Task ExcluirAsync(Guid id)
    {
        await _repo.ExcluirAsync(id);
        await _uow.CommitAsync();
    }
}
