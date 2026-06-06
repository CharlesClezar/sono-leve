using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class ProdutoRepository : IProdutoRepository
{
    private readonly SonoLeveDbContext _db;
    public ProdutoRepository(SonoLeveDbContext db) => _db = db;

    private IQueryable<Produto> ComIncludes() =>
        _db.Produto.AsNoTracking()
            .Include(p => p.Marca).Include(p => p.Tipo).Include(p => p.Subtipo)
            .Include(p => p.Categoria).Include(p => p.Colecao);

    public async Task<(IEnumerable<Produto> items, int total)> ListarAsync(string? busca, string? marca, bool? ativo, int pagina, int tamanhoPagina)
    {
        busca = busca?.Length > 100 ? busca[..100] : busca;
        var query = ComIncludes().AsQueryable();
        if (!string.IsNullOrWhiteSpace(busca))
        {
            foreach (var termo in busca.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            {
                var padrao = $"%{termo}%";
                query = query.Where(p =>
                    EF.Functions.ILike(p.Nome, padrao) ||
                    EF.Functions.ILike(p.Ref, padrao) ||
                    (p.Marca != null && EF.Functions.ILike(p.Marca.Name, padrao)) ||
                    (p.Tipo != null && EF.Functions.ILike(p.Tipo.Name, padrao)) ||
                    (p.Subtipo != null && EF.Functions.ILike(p.Subtipo.Name, padrao)) ||
                    (p.Categoria != null && EF.Functions.ILike(p.Categoria.Name, padrao)) ||
                    (p.Colecao != null && EF.Functions.ILike(p.Colecao.Name, padrao)));
            }
        }
        if (!string.IsNullOrWhiteSpace(marca))
            query = query.Where(p => p.Marca != null && p.Marca.Name == marca);
        if (ativo.HasValue)
            query = query.Where(p => p.Ativo == ativo.Value);
        var total = await query.CountAsync();
        var items = await query.OrderBy(p => p.Nome)
            .Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina).ToListAsync();
        return (items, total);
    }

    public async Task<Produto> ObterPorIdAsync(Guid id) =>
        await ComIncludes().FirstOrDefaultAsync(p => p.Id == id) ?? throw new KeyNotFoundException("Produto não encontrado.");

    public Task<Produto> CriarAsync(Produto produto)
    {
        _db.Produto.Add(produto);
        return Task.FromResult(produto);
    }

    public Task<Produto> AtualizarAsync(Produto produto)
    {
        produto.AtualizadoEm = DateTime.UtcNow;
        _db.Entry(produto).State = EntityState.Modified;
        return Task.FromResult(produto);
    }
}
