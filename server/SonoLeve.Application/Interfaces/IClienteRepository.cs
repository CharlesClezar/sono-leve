using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IClienteRepository
{
    Task<(IEnumerable<Cliente> items, int total)> ListarAsync(
        string? busca, string? tipo, string? status, int page, int pageSize);
    Task<Cliente?> ObterPorIdAsync(Guid id);
    Task<Cliente> AdicionarAsync(Cliente cliente);
    Task<Cliente> AtualizarAsync(Cliente cliente);
}
