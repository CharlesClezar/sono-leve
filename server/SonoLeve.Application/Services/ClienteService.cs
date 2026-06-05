using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IUnitOfWork _uow;

    public ClienteService(IClienteRepository clienteRepository, IUnitOfWork uow)
    {
        _clienteRepository = clienteRepository;
        _uow = uow;
    }

    public Task<(IEnumerable<Cliente> items, int total)> ListarAsync(
        string? busca, string? tipo, string? status, int page, int pageSize)
        => _clienteRepository.ListarAsync(busca, tipo, status, page, pageSize);

    public async Task<Cliente> ObterPorIdAsync(Guid id)
        => await _clienteRepository.ObterPorIdAsync(id)
            ?? throw new KeyNotFoundException("Cliente não encontrado.");

    public async Task<Cliente> CriarAsync(Cliente cliente)
    {
        var result = await _clienteRepository.CriarAsync(cliente);
        await _uow.CommitAsync();
        return result;
    }

    public async Task<Cliente> AtualizarAsync(Cliente cliente)
    {
        var result = await _clienteRepository.AtualizarAsync(cliente);
        await _uow.CommitAsync();
        return result;
    }
}
