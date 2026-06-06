using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class BandeiraCartaoRepository : IBandeiraCartaoRepository
{
    private readonly SonoLeveDbContext _db;
    public BandeiraCartaoRepository(SonoLeveDbContext db) => _db = db;

    public async Task<IEnumerable<BandeiraCartao>> ListarAsync() =>
        await _db.BandeiraCartao.OrderBy(b => b.Nome).ToListAsync();

    public async Task<BandeiraCartao?> ObterPorIdAsync(Guid id) =>
        await _db.BandeiraCartao.FindAsync(id);

    public Task<BandeiraCartao> CriarAsync(BandeiraCartao bandeira)
    {
        _db.BandeiraCartao.Add(bandeira);
        return Task.FromResult(bandeira);
    }

    public Task<BandeiraCartao> AtualizarAsync(BandeiraCartao bandeira)
    {
        bandeira.AtualizadoEm = DateTime.UtcNow;
        _db.BandeiraCartao.Update(bandeira);
        return Task.FromResult(bandeira);
    }

    public async Task ExcluirAsync(Guid id)
    {
        var bandeira = await _db.BandeiraCartao.FindAsync(id);
        if (bandeira != null)
            _db.BandeiraCartao.Remove(bandeira);
    }
}
