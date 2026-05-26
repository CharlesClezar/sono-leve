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
        await _db.BandeirasCartao.OrderBy(b => b.Nome).ToListAsync();

    public async Task<BandeiraCartao?> ObterPorIdAsync(Guid id) =>
        await _db.BandeirasCartao.FindAsync(id);

    public async Task<BandeiraCartao> AdicionarAsync(BandeiraCartao bandeira)
    {
        _db.BandeirasCartao.Add(bandeira);
        await _db.SaveChangesAsync();
        return bandeira;
    }

    public async Task<BandeiraCartao> AtualizarAsync(BandeiraCartao bandeira)
    {
        bandeira.AtualizadoEm = DateTime.UtcNow;
        _db.BandeirasCartao.Update(bandeira);
        await _db.SaveChangesAsync();
        return bandeira;
    }

    public async Task ExcluirAsync(Guid id)
    {
        var bandeira = await _db.BandeirasCartao.FindAsync(id);
        if (bandeira != null)
        {
            _db.BandeirasCartao.Remove(bandeira);
            await _db.SaveChangesAsync();
        }
    }
}
