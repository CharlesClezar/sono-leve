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
        var query = _db.Cliente.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            foreach (var termo in busca.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            {
                var padrao = $"%{termo}%";
                query = query.Where(c =>
                    EF.Functions.ILike(c.Nome, padrao) ||
                    EF.Functions.ILike(c.Telefone, padrao) ||
                    EF.Functions.ILike(c.Cpf, padrao));
            }
        }

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
        => _db.Cliente.FindAsync(id).AsTask();

    public Task<Cliente> CriarAsync(Cliente cliente)
    {
        cliente.CriadoEm = DateTime.UtcNow;
        cliente.AtualizadoEm = DateTime.UtcNow;
        _db.Cliente.Add(cliente);
        return Task.FromResult(cliente);
    }

    public Task<Cliente> AtualizarAsync(Cliente cliente)
    {
        cliente.AtualizadoEm = DateTime.UtcNow;
        _db.Cliente.Update(cliente);
        return Task.FromResult(cliente);
    }
}
