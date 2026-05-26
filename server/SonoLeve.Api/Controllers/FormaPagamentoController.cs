using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/formas-pagamento")]
public class FormaPagamentoController : ControllerBase
{
    private readonly IFormaPagamentoService _service;
    public FormaPagamentoController(IFormaPagamentoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FormaPagamentoResponse>>> Listar()
    {
        var formas = await _service.ListarAsync();
        return Ok(formas.Select(Mapear));
    }

    [HttpPost]
    public async Task<ActionResult<FormaPagamentoResponse>> Criar([FromBody] FormaPagamentoRequest request)
    {
        var criado = await _service.CriarAsync(MapearEntidade(request));
        return CreatedAtAction(nameof(Listar), Mapear(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FormaPagamentoResponse>> Atualizar(Guid id, [FromBody] FormaPagamentoRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Nome                = request.Nome;
            existente.Tipo                = request.Tipo;
            existente.PermiteParcelamento = request.PermiteParcelamento;
            existente.ExigeBandeira       = request.ExigeBandeira;
            existente.Ativo               = request.Ativo;
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _service.ExcluirAsync(id);
        return NoContent();
    }

    private static FormaPagamento MapearEntidade(FormaPagamentoRequest r) =>
        new()
        {
            Nome                = r.Nome,
            Tipo                = r.Tipo,
            PermiteParcelamento = r.PermiteParcelamento,
            ExigeBandeira       = r.ExigeBandeira,
            Ativo               = r.Ativo,
        };

    private static FormaPagamentoResponse Mapear(FormaPagamento f) =>
        new(f.Id, f.Nome, f.Tipo, f.PermiteParcelamento, f.ExigeBandeira, f.Ativo);
}
