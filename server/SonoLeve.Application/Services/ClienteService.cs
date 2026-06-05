using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _clienteRepository;

    public ClienteService(IClienteRepository clienteRepository)
    {
        _clienteRepository = clienteRepository;
    }

    public Task<(IEnumerable<Cliente> items, int total)> ListarAsync(
        string? busca, string? tipo, string? status, int page, int pageSize)
        => _clienteRepository.ListarAsync(busca, tipo, status, page, pageSize);

    public async Task<Cliente> ObterPorIdAsync(Guid id)
        => await _clienteRepository.ObterPorIdAsync(id)
            ?? throw new KeyNotFoundException("Cliente não encontrado.");

    public Task<Cliente> CriarAsync(Cliente cliente)
        => _clienteRepository.CriarAsync(cliente);

    public Task<Cliente> AtualizarAsync(Cliente cliente)
        => _clienteRepository.AtualizarAsync(cliente);
}
