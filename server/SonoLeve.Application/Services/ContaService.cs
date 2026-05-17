using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ContaService : IContaService
{
    private readonly IContaRepository _repo;
    public ContaService(IContaRepository repo) => _repo = repo;

    public Task<(IEnumerable<Conta> items, int total)> ListarAsync(int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(pagina, tamanhoPagina);

    public Task<Conta> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);
    public Task<Conta> CriarAsync(Conta conta) => _repo.CriarAsync(conta);
    public Task<Conta> AtualizarAsync(Conta conta) => _repo.AtualizarAsync(conta);
}
