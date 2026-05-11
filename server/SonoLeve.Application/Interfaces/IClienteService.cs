using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IClienteService
{
    Task<(IEnumerable<Cliente> items, int total)> ListarAsync(string? busca, int page, int pageSize);
    Task<Cliente> ObterPorIdAsync(Guid id);
    Task<Cliente> CriarAsync(Cliente cliente);
    Task<Cliente> AtualizarAsync(Cliente cliente);
}
