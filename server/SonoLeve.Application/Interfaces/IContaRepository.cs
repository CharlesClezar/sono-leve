using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IContaRepository
{
    Task<(IEnumerable<Conta> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina);
    Task<Conta> ObterPorIdAsync(Guid id);
    Task<Conta> CriarAsync(Conta conta);
    Task<Conta> AtualizarAsync(Conta conta);
}
