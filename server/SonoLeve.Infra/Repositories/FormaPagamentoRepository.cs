using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class FormaPagamentoRepository : IFormaPagamentoRepository
{
    private readonly SonoLeveDbContext _db;
    public FormaPagamentoRepository(SonoLeveDbContext db) => _db = db;

    public async Task<IEnumerable<FormaPagamento>> ListarAsync() =>
        await _db.FormasPagamento.OrderBy(f => f.CriadoEm).ToListAsync();

    public async Task<FormaPagamento?> ObterPorIdAsync(Guid id) =>
        await _db.FormasPagamento.FindAsync(id);

    public async Task<FormaPagamento> AdicionarAsync(FormaPagamento forma)
    {
        _db.FormasPagamento.Add(forma);
        await _db.SaveChangesAsync();
        return forma;
    }

    public async Task<FormaPagamento> AtualizarAsync(FormaPagamento forma)
    {
        forma.AtualizadoEm = DateTime.UtcNow;
        _db.FormasPagamento.Update(forma);
        await _db.SaveChangesAsync();
        return forma;
    }

    public async Task ExcluirAsync(Guid id)
    {
        var forma = await _db.FormasPagamento.FindAsync(id);
        if (forma != null)
        {
            _db.FormasPagamento.Remove(forma);
            await _db.SaveChangesAsync();
        }
    }
}
