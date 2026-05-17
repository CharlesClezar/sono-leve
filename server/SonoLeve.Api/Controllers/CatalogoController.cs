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
        var categorias = await _db.CategoriasBase.OrderBy(x => x.Name).ToListAsync();
        var marcas = await _db.CatalogoMarcas.OrderBy(x => x.Name).ToListAsync();
        var tipos = await _db.CatalogoTipos.OrderBy(x => x.Name).ToListAsync();
        var subtipos = await _db.CatalogoSubtipos.OrderBy(x => x.Name).ToListAsync();
        var colecoes = await _db.CatalogoColecoes.OrderBy(x => x.Name).ToListAsync();
        var modelos = await _db.CatalogoModelos.OrderBy(x => x.Name).ToListAsync();
        var produtos = await _db.Produtos
            .Select(p => new { p.Marca, p.Tipo, p.Subtipo, p.Categoria, p.Colecao, p.Modelo })
            .ToListAsync();

        return Ok(new CatalogoProdutosResponse(
            categorias.Select(c => new CategoriaCatalogoResponse(c.Id, c.Name, c.Grade, produtos.Count(p => p.Categoria == c.Name), c.Active)),
            marcas.Select(m => new CatalogoSimplesResponse(m.Id, m.Name, produtos.Count(p => p.Marca == m.Name), m.Active)),
            tipos.Select(t => new TipoCatalogoResponse(t.Id, t.Name, produtos.Count(p => p.Tipo == t.Name), t.Active, subtipos.Count(s => s.Type == t.Name))),
            subtipos.Select(s => new SubtipoCatalogoResponse(s.Id, s.Name, produtos.Count(p => p.Subtipo == s.Name), s.Active, s.Type)),
            colecoes.Select(c => new ColecaoCatalogoResponse(c.Id, c.Name, produtos.Count(p => p.Colecao == c.Name), c.Active, c.Period)),
            modelos.Select(m => new CatalogoSimplesResponse(m.Id, m.Name, produtos.Count(p => p.Modelo == m.Name), m.Active))
        ));
    }

    // ── Categorias ────────────────────────────────────────────────────────────

    [HttpPost("categorias")]
    public async Task<ActionResult<CategoriaCatalogoResponse>> CriarCategoria([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new CatalogoCategoria { Name = request.Name, Grade = request.Grade ?? [], Active = request.Active };
        _db.CategoriasBase.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new CategoriaCatalogoResponse(entidade.Id, entidade.Name, entidade.Grade, 0, entidade.Active));
    }

    [HttpGet("categorias/{id:guid}")]
    public async Task<ActionResult<CategoriaCatalogoResponse>> ObterCategoria(Guid id)
    {
        var item = await _db.CategoriasBase.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.Categoria == item.Name);
        return Ok(new CategoriaCatalogoResponse(item.Id, item.Name, item.Grade, count, item.Active));
    }

    [HttpPut("categorias/{id:guid}")]
    public async Task<ActionResult<CategoriaCatalogoResponse>> AtualizarCategoria(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.CategoriasBase.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Grade = request.Grade ?? item.Grade;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.Categoria == item.Name);
        return Ok(new CategoriaCatalogoResponse(item.Id, item.Name, item.Grade, count, item.Active));
    }

    [HttpDelete("categorias/{id:guid}")]
    public async Task<IActionResult> ExcluirCategoria(Guid id)
    {
        var item = await _db.CategoriasBase.FindAsync(id);
        if (item == null) return NotFound();
        _db.CategoriasBase.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Marcas ────────────────────────────────────────────────────────────────

    [HttpPost("marcas")]
    public async Task<ActionResult<CatalogoSimplesResponse>> CriarMarca([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new CatalogoMarca { Name = request.Name, Active = request.Active };
        _db.CatalogoMarcas.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new CatalogoSimplesResponse(entidade.Id, entidade.Name, 0, entidade.Active));
    }

    [HttpGet("marcas/{id:guid}")]
    public async Task<ActionResult<CatalogoSimplesResponse>> ObterMarca(Guid id)
    {
        var item = await _db.CatalogoMarcas.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.Marca == item.Name);
        return Ok(new CatalogoSimplesResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpPut("marcas/{id:guid}")]
    public async Task<ActionResult<CatalogoSimplesResponse>> AtualizarMarca(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.CatalogoMarcas.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.Marca == item.Name);
        return Ok(new CatalogoSimplesResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpDelete("marcas/{id:guid}")]
    public async Task<IActionResult> ExcluirMarca(Guid id)
    {
        var item = await _db.CatalogoMarcas.FindAsync(id);
        if (item == null) return NotFound();
        _db.CatalogoMarcas.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Tipos ─────────────────────────────────────────────────────────────────

    [HttpPost("tipos")]
    public async Task<ActionResult<TipoCatalogoResponse>> CriarTipo([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new CatalogoTipo { Name = request.Name, Active = request.Active };
        _db.CatalogoTipos.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new TipoCatalogoResponse(entidade.Id, entidade.Name, 0, entidade.Active, 0));
    }

    [HttpGet("tipos/{id:guid}")]
    public async Task<ActionResult<TipoCatalogoResponse>> ObterTipo(Guid id)
    {
        var item = await _db.CatalogoTipos.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.Tipo == item.Name);
        var subtypes = await _db.CatalogoSubtipos.CountAsync(s => s.Type == item.Name);
        return Ok(new TipoCatalogoResponse(item.Id, item.Name, count, item.Active, subtypes));
    }

    [HttpPut("tipos/{id:guid}")]
    public async Task<ActionResult<TipoCatalogoResponse>> AtualizarTipo(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.CatalogoTipos.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.Tipo == item.Name);
        var subtypes = await _db.CatalogoSubtipos.CountAsync(s => s.Type == item.Name);
        return Ok(new TipoCatalogoResponse(item.Id, item.Name, count, item.Active, subtypes));
    }

    [HttpDelete("tipos/{id:guid}")]
    public async Task<IActionResult> ExcluirTipo(Guid id)
    {
        var item = await _db.CatalogoTipos.FindAsync(id);
        if (item == null) return NotFound();
        _db.CatalogoTipos.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Subtipos ──────────────────────────────────────────────────────────────

    [HttpPost("subtipos")]
    public async Task<ActionResult<SubtipoCatalogoResponse>> CriarSubtipo([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new CatalogoSubtipo { Name = request.Name, Type = request.Type ?? "", Active = request.Active };
        _db.CatalogoSubtipos.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new SubtipoCatalogoResponse(entidade.Id, entidade.Name, 0, entidade.Active, entidade.Type));
    }

    [HttpGet("subtipos/{id:guid}")]
    public async Task<ActionResult<SubtipoCatalogoResponse>> ObterSubtipo(Guid id)
    {
        var item = await _db.CatalogoSubtipos.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.Subtipo == item.Name);
        return Ok(new SubtipoCatalogoResponse(item.Id, item.Name, count, item.Active, item.Type));
    }

    [HttpPut("subtipos/{id:guid}")]
    public async Task<ActionResult<SubtipoCatalogoResponse>> AtualizarSubtipo(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.CatalogoSubtipos.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Type = request.Type ?? item.Type;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.Subtipo == item.Name);
        return Ok(new SubtipoCatalogoResponse(item.Id, item.Name, count, item.Active, item.Type));
    }

    [HttpDelete("subtipos/{id:guid}")]
    public async Task<IActionResult> ExcluirSubtipo(Guid id)
    {
        var item = await _db.CatalogoSubtipos.FindAsync(id);
        if (item == null) return NotFound();
        _db.CatalogoSubtipos.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Coleções ──────────────────────────────────────────────────────────────

    [HttpPost("colecoes")]
    public async Task<ActionResult<ColecaoCatalogoResponse>> CriarColecao([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new CatalogoColecao { Name = request.Name, Period = request.Period ?? "", Active = request.Active };
        _db.CatalogoColecoes.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new ColecaoCatalogoResponse(entidade.Id, entidade.Name, 0, entidade.Active, entidade.Period));
    }

    [HttpGet("colecoes/{id:guid}")]
    public async Task<ActionResult<ColecaoCatalogoResponse>> ObterColecao(Guid id)
    {
        var item = await _db.CatalogoColecoes.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.Colecao == item.Name);
        return Ok(new ColecaoCatalogoResponse(item.Id, item.Name, count, item.Active, item.Period));
    }

    [HttpPut("colecoes/{id:guid}")]
    public async Task<ActionResult<ColecaoCatalogoResponse>> AtualizarColecao(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.CatalogoColecoes.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Period = request.Period ?? item.Period;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.Colecao == item.Name);
        return Ok(new ColecaoCatalogoResponse(item.Id, item.Name, count, item.Active, item.Period));
    }

    [HttpDelete("colecoes/{id:guid}")]
    public async Task<IActionResult> ExcluirColecao(Guid id)
    {
        var item = await _db.CatalogoColecoes.FindAsync(id);
        if (item == null) return NotFound();
        _db.CatalogoColecoes.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Modelos ───────────────────────────────────────────────────────────────

    [HttpPost("modelos")]
    public async Task<ActionResult<CatalogoSimplesResponse>> CriarModelo([FromBody] CatalogoProdutoRequest request)
    {
        var entidade = new CatalogoModelo { Name = request.Name, Active = request.Active };
        _db.CatalogoModelos.Add(entidade);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new CatalogoSimplesResponse(entidade.Id, entidade.Name, 0, entidade.Active));
    }

    [HttpGet("modelos/{id:guid}")]
    public async Task<ActionResult<CatalogoSimplesResponse>> ObterModelo(Guid id)
    {
        var item = await _db.CatalogoModelos.FindAsync(id);
        if (item == null) return NotFound();
        var count = await _db.Produtos.CountAsync(p => p.Modelo == item.Name);
        return Ok(new CatalogoSimplesResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpPut("modelos/{id:guid}")]
    public async Task<ActionResult<CatalogoSimplesResponse>> AtualizarModelo(Guid id, [FromBody] CatalogoProdutoRequest request)
    {
        var item = await _db.CatalogoModelos.FindAsync(id);
        if (item == null) return NotFound();
        item.Name = request.Name;
        item.Active = request.Active;
        await _db.SaveChangesAsync();
        var count = await _db.Produtos.CountAsync(p => p.Modelo == item.Name);
        return Ok(new CatalogoSimplesResponse(item.Id, item.Name, count, item.Active));
    }

    [HttpDelete("modelos/{id:guid}")]
    public async Task<IActionResult> ExcluirModelo(Guid id)
    {
        var item = await _db.CatalogoModelos.FindAsync(id);
        if (item == null) return NotFound();
        _db.CatalogoModelos.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
