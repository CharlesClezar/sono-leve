using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IBandeiraCartaoRepository
{
    Task<IEnumerable<BandeiraCartao>> ListarAsync();
    Task<BandeiraCartao?> ObterPorIdAsync(Guid id);
    Task<BandeiraCartao> AdicionarAsync(BandeiraCartao bandeira);
    Task<BandeiraCartao> AtualizarAsync(BandeiraCartao bandeira);
    Task ExcluirAsync(Guid id);
}
