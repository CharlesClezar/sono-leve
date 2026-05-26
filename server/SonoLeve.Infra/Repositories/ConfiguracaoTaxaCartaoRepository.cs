using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class ConfiguracaoTaxaCartaoRepository : IConfiguracaoTaxaCartaoRepository
{
    private readonly SonoLeveDbContext _db;
    public ConfiguracaoTaxaCartaoRepository(SonoLeveDbContext db) => _db = db;

    public async Task<IEnumerable<ConfiguracaoTaxaCartao>> ListarAsync() =>
        await _db.ConfiguracoesTaxaCartao
            .Include(c => c.FormaPagamento)
            .Include(c => c.Bandeira)
            .Include(c => c.Parcelas.OrderBy(p => p.NumeroParcelas))
            .OrderBy(c => c.FormaPagamento.Nome)
            .ThenBy(c => c.Bandeira.Nome)
            .ToListAsync();

    public async Task<ConfiguracaoTaxaCartao?> ObterPorIdAsync(Guid id) =>
        await _db.ConfiguracoesTaxaCartao
            .Include(c => c.FormaPagamento)
            .Include(c => c.Bandeira)
            .Include(c => c.Parcelas.OrderBy(p => p.NumeroParcelas))
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<ConfiguracaoTaxaCartao> AdicionarAsync(ConfiguracaoTaxaCartao config)
    {
        _db.ConfiguracoesTaxaCartao.Add(config);
        await _db.SaveChangesAsync();
        return await ObterPorIdAsync(config.Id) ?? config;
    }

    public async Task<ConfiguracaoTaxaCartao> AtualizarAsync(ConfiguracaoTaxaCartao config)
    {
        config.AtualizadoEm = DateTime.UtcNow;

        // Substituir parcelas: remover antigas e adicionar novas
        var parcelasExistentes = await _db.ConfiguracoesTaxaCartaoParcelas
            .Where(p => p.ConfiguracaoTaxaCartaoId == config.Id)
            .ToListAsync();
        _db.ConfiguracoesTaxaCartaoParcelas.RemoveRange(parcelasExistentes);

        _db.ConfiguracoesTaxaCartao.Update(config);
        await _db.SaveChangesAsync();
        return await ObterPorIdAsync(config.Id) ?? config;
    }

    public async Task ExcluirAsync(Guid id)
    {
        var config = await _db.ConfiguracoesTaxaCartao.FindAsync(id);
        if (config != null)
        {
            _db.ConfiguracoesTaxaCartao.Remove(config);
            await _db.SaveChangesAsync();
        }
    }
}
