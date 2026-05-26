using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IBandeiraCartaoService
{
    Task<IEnumerable<BandeiraCartao>> ListarAsync();
    Task<BandeiraCartao> ObterPorIdAsync(Guid id);
    Task<BandeiraCartao> CriarAsync(BandeiraCartao bandeira);
    Task<BandeiraCartao> AtualizarAsync(BandeiraCartao bandeira);
    Task ExcluirAsync(Guid id);
}
