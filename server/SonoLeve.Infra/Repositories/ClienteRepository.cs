using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly SonoLeveDbContext _db;

    public ClienteRepository(SonoLeveDbContext db)
    {
        _db = db;
    }

    public async Task<(IEnumerable<Cliente> items, int total)> ListarAsync(
        string? busca, string? tipo, string? status, int page, int pageSize)
    {
        busca = busca?.Length > 100 ? busca[..100] : busca;
        var query = _db.Clientes.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(c =>
                c.Nome.Contains(busca) ||
                c.Telefone.Contains(busca) ||
                c.Cpf.Contains(busca));

        if (!string.IsNullOrWhiteSpace(tipo) && tipo != "all" &&
            Enum.TryParse<TipoCliente>(tipo, true, out var tc))
            query = query.Where(c => c.Tipo == tc);

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
            query = query.Where(c => c.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.Nome)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<Cliente?> ObterPorIdAsync(Guid id)
        => _db.Clientes.FindAsync(id).AsTask();

    public async Task<Cliente> AdicionarAsync(Cliente cliente)
    {
        cliente.CriadoEm = DateTime.UtcNow;
        cliente.AtualizadoEm = DateTime.UtcNow;
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();
        return cliente;
    }

    public async Task<Cliente> AtualizarAsync(Cliente cliente)
    {
        cliente.AtualizadoEm = DateTime.UtcNow;
        _db.Clientes.Update(cliente);
        await _db.SaveChangesAsync();
        return cliente;
    }
}
