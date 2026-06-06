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
    private readonly IWebHostEnvironment _env;
    private static readonly string[] _extensoesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];

    public ProdutoController(IProdutoService service, IWebHostEnvironment env)
    {
        _service = service;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<ListaResponse<ProdutoResponse>>> Listar(
        [FromQuery] string? search,
        [FromQuery] string? marca,
        [FromQuery] bool? ativo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(search, marca, ativo, page, pageSize);
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
            existente.MarcaId = request.MarcaId;
            existente.TipoId = request.TipoId;
            existente.SubtipoId = request.SubtipoId;
            existente.CategoriaId = request.CategoriaId;
            existente.ColecaoId = request.ColecaoId;
            existente.PrecoVarejo = request.PrecoVarejo;
            existente.PrecoAtacado = request.PrecoAtacado;
            existente.Ativo = request.Ativo;
            existente.Estoque = request.Estoque;
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/imagem")]
    [RequestSizeLimit(5_242_880)] // 5 MB
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

            var dir = Path.Combine(_env.WebRootPath, "imagens", "produto");
            Directory.CreateDirectory(dir);

            if (!string.IsNullOrEmpty(produto.ImagemUrl))
            {
                var anterior = Path.Combine(_env.WebRootPath,
                    produto.ImagemUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(anterior))
                    System.IO.File.Delete(anterior);
            }

            var nomeArquivo = $"{id}{ext}";
            var caminho = Path.Combine(dir, nomeArquivo);

            await using var stream = new FileStream(caminho, FileMode.Create);
            await arquivo.CopyToAsync(stream);

            produto.ImagemUrl = $"/imagens/produto/{nomeArquivo}";
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
                var caminho = Path.Combine(_env.WebRootPath,
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
        Nome = r.Nome, Ref = r.Ref,
        MarcaId = r.MarcaId, TipoId = r.TipoId, SubtipoId = r.SubtipoId,
        CategoriaId = r.CategoriaId, ColecaoId = r.ColecaoId,
        PrecoVarejo = r.PrecoVarejo, PrecoAtacado = r.PrecoAtacado,
        Ativo = r.Ativo, Estoque = r.Estoque,
    };

    private static ProdutoResponse Mapear(Produto p) => new(
        p.Id, p.Nome, p.Ref,
        p.MarcaId, p.Marca?.Name,
        p.TipoId, p.Tipo?.Name,
        p.SubtipoId, p.Subtipo?.Name,
        p.CategoriaId, p.Categoria?.Name, p.Categoria?.Grade?.ToArray(),
        p.ColecaoId, p.Colecao?.Name,
        p.PrecoVarejo, p.PrecoAtacado, p.Ativo, p.Estoque, p.CriadoEm, p.ImagemUrl
    );
}
