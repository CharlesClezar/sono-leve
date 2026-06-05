using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IConfiguracaoTaxaCartaoRepository
{
    Task<IEnumerable<ConfiguracaoTaxaCartao>> ListarAsync();
    Task<ConfiguracaoTaxaCartao?> ObterPorIdAsync(Guid id);
    Task<ConfiguracaoTaxaCartao> CriarAsync(ConfiguracaoTaxaCartao config);
    Task<ConfiguracaoTaxaCartao> AtualizarAsync(ConfiguracaoTaxaCartao config);
    Task ExcluirAsync(Guid id);
}
