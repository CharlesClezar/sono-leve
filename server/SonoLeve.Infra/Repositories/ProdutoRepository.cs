using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class ProdutoRepository : IProdutoRepository
{
    private readonly SonoLeveDbContext _db;
    public ProdutoRepository(SonoLeveDbContext db) => _db = db;

    public async Task<(IEnumerable<Produto> items, int total)> ListarAsync(string? busca, int pagina, int tamanhoPagina)
    {
        var query = _db.Produtos.AsQueryable();
        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(p => p.Nome.Contains(busca) || p.Ref.Contains(busca));
        var total = await query.CountAsync();
        var items = await query.OrderBy(p => p.Nome)
            .Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina).ToListAsync();
        return (items, total);
    }

    public async Task<Produto> ObterPorIdAsync(Guid id) =>
        await _db.Produtos.FindAsync(id) ?? throw new KeyNotFoundException("Produto não encontrado.");

    public async Task<Produto> CriarAsync(Produto produto)
    {
        _db.Produtos.Add(produto);
        await _db.SaveChangesAsync();
        return produto;
    }

    public async Task<Produto> AtualizarAsync(Produto produto)
    {
        produto.AtualizadoEm = DateTime.UtcNow;
        _db.Produtos.Update(produto);
        await _db.SaveChangesAsync();
        return produto;
    }
}
