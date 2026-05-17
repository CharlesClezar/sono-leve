using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/produtos")]
public class ProdutoController : ControllerBase
{
    private readonly IProdutoService _service;
    private static readonly string[] _extensoesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];

    public ProdutoController(IProdutoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ListaResponse<ProdutoResponse>>> Listar(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(search, page, pageSize);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return Ok(new ListaResponse<ProdutoResponse>(items.Select(Mapear), total, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProdutoResponse>> ObterPorId(Guid id)
    {
        try { return Ok(Mapear(await _service.ObterPorIdAsync(id))); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<ProdutoResponse>> Criar([FromBody] ProdutoRequest request)
    {
        var criado = await _service.CriarAsync(MapearEntidade(request));
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, Mapear(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProdutoResponse>> Atualizar(Guid id, [FromBody] ProdutoRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Nome = request.Nome;
            existente.Ref = request.Ref;
            existente.Marca = request.Marca;
            existente.Tipo = request.Tipo;
            existente.Subtipo = request.Subtipo;
            existente.Categoria = request.Categoria;
            existente.Colecao = request.Colecao;
            existente.Modelo = request.Modelo;
            existente.PrecoVarejo = request.PrecoVarejo;
            existente.PrecoAtacado = request.PrecoAtacado;
            existente.Ativo = request.Ativo;
            existente.Estoque = request.Estoque;
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/imagem")]
    [DisableRequestSizeLimit]
    public async Task<ActionResult<object>> UploadImagem(Guid id, IFormFile arquivo)
    {
        if (arquivo == null || arquivo.Length == 0)
            return BadRequest(new { message = "Arquivo inválido." });

        var ext = Path.GetExtension(arquivo.FileName).ToLowerInvariant();
        if (!_extensoesPermitidas.Contains(ext))
            return BadRequest(new { message = "Formato não suportado. Use JPG, PNG ou WebP." });

        try
        {
            var produto = await _service.ObterPorIdAsync(id);

            var dir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagens", "produtos");
            Directory.CreateDirectory(dir);

            // remove imagem anterior se existir
            if (!string.IsNullOrEmpty(produto.ImagemUrl))
            {
                var anterior = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                    produto.ImagemUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(anterior))
                    System.IO.File.Delete(anterior);
            }

            var nomeArquivo = $"{id}{ext}";
            var caminho = Path.Combine(dir, nomeArquivo);

            await using var stream = new FileStream(caminho, FileMode.Create);
            await arquivo.CopyToAsync(stream);

            produto.ImagemUrl = $"/imagens/produtos/{nomeArquivo}";
            await _service.AtualizarAsync(produto);

            return Ok(new { imagemUrl = produto.ImagemUrl });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}/imagem")]
    public async Task<IActionResult> RemoverImagem(Guid id)
    {
        try
        {
            var produto = await _service.ObterPorIdAsync(id);
            if (!string.IsNullOrEmpty(produto.ImagemUrl))
            {
                var caminho = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                    produto.ImagemUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(caminho))
                    System.IO.File.Delete(caminho);
                produto.ImagemUrl = null;
                await _service.AtualizarAsync(produto);
            }
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private static Produto MapearEntidade(ProdutoRequest r) => new()
    {
        Nome = r.Nome, Ref = r.Ref, Marca = r.Marca, Tipo = r.Tipo,
        Subtipo = r.Subtipo, Categoria = r.Categoria, Colecao = r.Colecao,
        Modelo = r.Modelo, PrecoVarejo = r.PrecoVarejo, PrecoAtacado = r.PrecoAtacado,
        Ativo = r.Ativo, Estoque = r.Estoque,
    };

    private static ProdutoResponse Mapear(Produto p) => new(
        p.Id, p.Nome, p.Ref, p.Marca, p.Tipo, p.Subtipo, p.Categoria,
        p.Colecao, p.Modelo, p.PrecoVarejo, p.PrecoAtacado, p.Ativo, p.Estoque, p.CriadoEm, p.ImagemUrl
    );
}
