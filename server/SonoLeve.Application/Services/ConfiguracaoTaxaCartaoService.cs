using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ConfiguracaoTaxaCartaoService : IConfiguracaoTaxaCartaoService
{
    private readonly IConfiguracaoTaxaCartaoRepository _repo;
    private readonly IUnitOfWork _uow;

    public ConfiguracaoTaxaCartaoService(IConfiguracaoTaxaCartaoRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public Task<IEnumerable<ConfiguracaoTaxaCartao>> ListarAsync() => _repo.ListarAsync();

    public async Task<ConfiguracaoTaxaCartao> ObterPorIdAsync(Guid id) =>
        await _repo.ObterPorIdAsync(id) ?? throw new KeyNotFoundException("Configuração de taxa não encontrada.");

    public async Task<ConfiguracaoTaxaCartao> CriarAsync(ConfiguracaoTaxaCartao config)
    {
        await _repo.CriarAsync(config);
        await _uow.CommitAsync();
        return await _repo.ObterPorIdAsync(config.Id) ?? config;
    }

    public async Task<ConfiguracaoTaxaCartao> AtualizarAsync(ConfiguracaoTaxaCartao config)
    {
        await _repo.AtualizarAsync(config);
        await _uow.CommitAsync();
        return await _repo.ObterPorIdAsync(config.Id) ?? config;
    }

    public async Task ExcluirAsync(Guid id)
    {
        await _repo.ExcluirAsync(id);
        await _uow.CommitAsync();
    }
}
