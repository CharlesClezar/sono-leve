using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SonoLeve.Api.DTOs;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/produtos/catalogo")]
public class CatalogoController : ControllerBase
{
    private readonly SonoLeveDbContext _db;
    public CatalogoController(SonoLeveDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<CatalogoProdutosResponse>> Listar()
    {
        var categorias = await _db.Categorias.AsNoTracking().OrderBy(x => x.Name).ToListAsync();
        var marcas    = await _db.Marcas.AsNoTracking().OrderBy(x => x.Name).ToListAsync();
        var tipos     = await _db.Tipos.AsNoTracking().OrderBy(x => x.Name).ToListAsync();
        var subtipos  = await _db.Subtipos.AsNoTracking().OrderBy(x => x.Name).ToListAsync();
        var colecoes  = await _db.Colecoes.AsNoTracking().OrderBy(x => x.Name).ToListAsync();

        // Uma única query; dicionários em memória para lookup O(1) em vez de Count() O(n) por item
        var produtos = await _db.Produtos.AsNoTracking()
            .Select(p => new { p.MarcaId, p.TipoId, p.SubtipoId, p.CategoriaId, p.ColecaoId })
            .ToListAsync();

        var cntCategoria = produtos.Where(p => p.CategoriaId.HasValue).GroupBy(p => p.CategoriaId!.Value).ToDictionary(g => g.Key, g => g.Count());
        var cntMarca     = produtos.Where(p => p.MarcaId.HasValue).GroupBy(p => p.MarcaId!.Value).ToDictionary(g => g.Key, g => g.Count());
        var cntTipo      = produtos.Where(p => p.TipoId.HasValue).GroupBy(p => p.TipoId!.Value).ToDictionary(g => g.Key, g => g.Count());
        var cntSubtipo   = produtos.Where(p => p.SubtipoId.HasValue).GroupBy(p => p.SubtipoId!.Value).ToDictionary(g => g.Key, g => g.Count());
        var cntColecao   = produtos.Where(p => p.ColecaoId.HasValue).GroupBy(p => p.ColecaoId!.Value).ToDictionary(g => g.Key, g => g.Count());

        return Ok(new CatalogoProdutosResponse(
            categorias.Select(c => new CategoriaCatalogoResponse(c.Id, c.Name, c.Grade, cntCategoria.GetValueOrDefault(c.Id), c.Active)),
            marcas.Select(m    => new CatalogoSimplesResponse(m.Id, m.Name, cntMarca.GetValueOrDefault(m.Id), m.Active)),
            tipos.Select(t     => new TipoCatalogoResponse(t.Id, t.Name, cntTipo.GetValueOrDefault(t.Id), t.Active)),
            subtipos.Select(s  => new SubtipoCatalogoResponse(s.Id, s.Name, cntSubtipo.GetValueOrDefault(s.Id), s.Active)),
            colecoes.Select(c  => new ColecaoCatalogoResponse(c.Id, c.Name, cntColecao.GetValueOrDefault(c.Id), c.Active, c.DataInicio, c.DataFim))
        ));
    }

    // ── Categorias ────────────────────────────────────────────────────────────

    [HttpPost("categorias")]
    public async Task<ActionResult<CategoriaCatalogoResponse>> CriarCategoria([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new Categoria { Name = request.Name, Grade = request.Grade ?? [], Active = request.Active };
        _db.Categorias.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new CategoriaCatalogoResponse(entidade.Id, entidade.Name, entidade.Grade, 0, entidade.Active));
    }

    [HttpGet("categorias/{id:guid}")]
    public async Task<ActionResult<CategoriaCatalogoResponse>> ObterCategoria(Guid id)
    {
        var item = await _db.Categorias.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.CategoriaId == item.Id);
        return Ok(new CategoriaCatalogoResponse(item.Id, item.Name, item.Grade, count, item.Active));
    }

    [HttpPut("categorias/{id:guid}")]
    public async Task<ActionResult<CategoriaCatalogoResponse>> AtualizarCategoria(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.Categorias.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Grade = request.Grade ?? item.Grade;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.CategoriaId == item.Id);
        return Ok(new CategoriaCatalogoResponse(item.Id, item.Name, item.Grade, count, item.Active));
    }

    [HttpDelete("categorias/{id:guid}")]
    public async Task<IActionResult> ExcluirCategoria(Guid id)
    {
        var item = await _db.Categorias.FindAsync(id);
        if (item == null) return NotFound();
        _db.Categorias.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Marcas ────────────────────────────────────────────────────────────────

    [HttpPost("marcas")]
    public async Task<ActionResult<CatalogoSimplesResponse>> CriarMarca([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new Marca { Name = request.Name, Active = request.Active };
        _db.Marcas.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new CatalogoSimplesResponse(entidade.Id, entidade.Name, 0, entidade.Active));
    }

    [HttpGet("marcas/{id:guid}")]
    public async Task<ActionResult<CatalogoSimplesResponse>> ObterMarca(Guid id)
    {
        var item = await _db.Marcas.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.MarcaId == item.Id);
        return Ok(new CatalogoSimplesResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpPut("marcas/{id:guid}")]
    public async Task<ActionResult<CatalogoSimplesResponse>> AtualizarMarca(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.Marcas.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.MarcaId == item.Id);
        return Ok(new CatalogoSimplesResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpDelete("marcas/{id:guid}")]
    public async Task<IActionResult> ExcluirMarca(Guid id)
    {
        var item = await _db.Marcas.FindAsync(id);
        if (item == null) return NotFound();
        _db.Marcas.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Tipos ─────────────────────────────────────────────────────────────────

    [HttpPost("tipos")]
    public async Task<ActionResult<TipoCatalogoResponse>> CriarTipo([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new Tipo { Name = request.Name, Active = request.Active };
        _db.Tipos.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new TipoCatalogoResponse(entidade.Id, entidade.Name, 0, entidade.Active));
    }

    [HttpGet("tipos/{id:guid}")]
    public async Task<ActionResult<TipoCatalogoResponse>> ObterTipo(Guid id)
    {
        var item = await _db.Tipos.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.TipoId == item.Id);
        return Ok(new TipoCatalogoResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpPut("tipos/{id:guid}")]
    public async Task<ActionResult<TipoCatalogoResponse>> AtualizarTipo(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.Tipos.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.TipoId == item.Id);
        return Ok(new TipoCatalogoResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpDelete("tipos/{id:guid}")]
    public async Task<IActionResult> ExcluirTipo(Guid id)
    {
        var item = await _db.Tipos.FindAsync(id);
        if (item == null) return NotFound();
        _db.Tipos.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Subtipos ──────────────────────────────────────────────────────────────

    [HttpPost("subtipos")]
    public async Task<ActionResult<SubtipoCatalogoResponse>> CriarSubtipo([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new Subtipo { Name = request.Name, Active = request.Active };
        _db.Subtipos.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new SubtipoCatalogoResponse(entidade.Id, entidade.Name, 0, entidade.Active));
    }

    [HttpGet("subtipos/{id:guid}")]
    public async Task<ActionResult<SubtipoCatalogoResponse>> ObterSubtipo(Guid id)
    {
        var item = await _db.Subtipos.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.SubtipoId == item.Id);
        return Ok(new SubtipoCatalogoResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpPut("subtipos/{id:guid}")]
    public async Task<ActionResult<SubtipoCatalogoResponse>> AtualizarSubtipo(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.Subtipos.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.SubtipoId == item.Id);
        return Ok(new SubtipoCatalogoResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpDelete("subtipos/{id:guid}")]
    public async Task<IActionResult> ExcluirSubtipo(Guid id)
    {
        var item = await _db.Subtipos.FindAsync(id);
        if (item == null) return NotFound();
        _db.Subtipos.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Coleções ──────────────────────────────────────────────────────────────

    [HttpPost("colecoes")]
    public async Task<ActionResult<ColecaoCatalogoResponse>> CriarColecao([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new Colecao { Name = request.Name, DataInicio = request.DataInicio, DataFim = request.DataFim, Active = request.Active };
        _db.Colecoes.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new ColecaoCatalogoResponse(entidade.Id, entidade.Name, 0, entidade.Active, entidade.DataInicio, entidade.DataFim));
    }

    [HttpGet("colecoes/{id:guid}")]
    public async Task<ActionResult<ColecaoCatalogoResponse>> ObterColecao(Guid id)
    {
        var item = await _db.Colecoes.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.ColecaoId == item.Id);
        return Ok(new ColecaoCatalogoResponse(item.Id, item.Name, count, item.Active, item.DataInicio, item.DataFim));
    }

    [HttpPut("colecoes/{id:guid}")]
    public async Task<ActionResult<ColecaoCatalogoResponse>> AtualizarColecao(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.Colecoes.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.DataInicio = request.DataInicio;
        item.DataFim = request.DataFim;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.ColecaoId == item.Id);
        return Ok(new ColecaoCatalogoResponse(item.Id, item.Name, count, item.Active, item.DataInicio, item.DataFim));
    }

    [HttpDelete("colecoes/{id:guid}")]
    public async Task<IActionResult> ExcluirColecao(Guid id)
    {
        var item = await _db.Colecoes.FindAsync(id);
        if (item == null) return NotFound();
        _db.Colecoes.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
