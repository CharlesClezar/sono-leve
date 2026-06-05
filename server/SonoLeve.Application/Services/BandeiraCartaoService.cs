using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class BandeiraCartaoService : IBandeiraCartaoService
{
    private readonly IBandeiraCartaoRepository _repo;
    public BandeiraCartaoService(IBandeiraCartaoRepository repo) => _repo = repo;

    public Task<IEnumerable<BandeiraCartao>> ListarAsync() => _repo.ListarAsync();

    public async Task<BandeiraCartao> ObterPorIdAsync(Guid id) =>
        await _repo.ObterPorIdAsync(id) ?? throw new KeyNotFoundException("Bandeira não encontrada.");

    public Task<BandeiraCartao> CriarAsync(BandeiraCartao bandeira) => _repo.CriarAsync(bandeira);

    public Task<BandeiraCartao> AtualizarAsync(BandeiraCartao bandeira) => _repo.AtualizarAsync(bandeira);

    public Task ExcluirAsync(Guid id) => _repo.ExcluirAsync(id);
}
