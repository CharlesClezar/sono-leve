using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ConfiguracaoTaxaCartaoService : IConfiguracaoTaxaCartaoService
{
    private readonly IConfiguracaoTaxaCartaoRepository _repo;
    public ConfiguracaoTaxaCartaoService(IConfiguracaoTaxaCartaoRepository repo) => _repo = repo;

    public Task<IEnumerable<ConfiguracaoTaxaCartao>> ListarAsync() => _repo.ListarAsync();

    public async Task<ConfiguracaoTaxaCartao> ObterPorIdAsync(Guid id) =>
        await _repo.ObterPorIdAsync(id) ?? throw new KeyNotFoundException("Configuração de taxa não encontrada.");

    public Task<ConfiguracaoTaxaCartao> CriarAsync(ConfiguracaoTaxaCartao config) => _repo.AdicionarAsync(config);

    public Task<ConfiguracaoTaxaCartao> AtualizarAsync(ConfiguracaoTaxaCartao config) => _repo.AtualizarAsync(config);

    public Task ExcluirAsync(Guid id) => _repo.ExcluirAsync(id);
}
