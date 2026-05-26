using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/bandeiras-cartao")]
public class BandeiraCartaoController : ControllerBase
{
    private readonly IBandeiraCartaoService _service;
    public BandeiraCartaoController(IBandeiraCartaoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BandeiraCartaoResponse>>> Listar()
    {
        var bandeiras = await _service.ListarAsync();
        return Ok(bandeiras.Select(b => new BandeiraCartaoResponse(b.Id, b.Nome, b.Ativo)));
    }

    [HttpPost]
    public async Task<ActionResult<BandeiraCartaoResponse>> Criar([FromBody] BandeiraCartaoRequest request)
    {
        var criado = await _service.CriarAsync(new BandeiraCartao { Nome = request.Nome, Ativo = request.Ativo });
        return CreatedAtAction(nameof(Listar), new BandeiraCartaoResponse(criado.Id, criado.Nome, criado.Ativo));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BandeiraCartaoResponse>> Atualizar(Guid id, [FromBody] BandeiraCartaoRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Nome  = request.Nome;
            existente.Ativo = request.Ativo;
            var atualizado = await _service.AtualizarAsync(existente);
            return Ok(new BandeiraCartaoResponse(atualizado.Id, atualizado.Nome, atualizado.Ativo));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _service.ExcluirAsync(id);
        return NoContent();
    }
}
