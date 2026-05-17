using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/fichas")]
public class FichaController : ControllerBase
{
    private readonly IFichaService _service;
    public FichaController(IFichaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ListaResponse<FichaResponse>>> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(page, pageSize);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return Ok(new ListaResponse<FichaResponse>(items.Select(Mapear), total, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FichaResponse>> ObterPorId(Guid id)
    {
        try { return Ok(Mapear(await _service.ObterPorIdAsync(id))); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<FichaResponse>> Criar([FromBody] FichaRequest request)
    {
        var criado = await _service.CriarAsync(MapearEntidade(request));
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, Mapear(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FichaResponse>> Atualizar(Guid id, [FromBody] FichaRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Revendedora = request.Revendedora;
            existente.DataAbertura = request.DataAbertura;
            existente.Enviadas = request.Enviadas;
            existente.Devolvidas = request.Devolvidas;
            existente.Vendidas = request.Vendidas;
            existente.TotalVendido = request.TotalVendido;
            existente.Status = Enum.Parse<StatusFicha>(request.Status, true);
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private static Ficha MapearEntidade(FichaRequest r) => new()
    {
        Revendedora = r.Revendedora, DataAbertura = r.DataAbertura,
        Enviadas = r.Enviadas, Devolvidas = r.Devolvidas,
        Vendidas = r.Vendidas, TotalVendido = r.TotalVendido,
        Status = Enum.Parse<StatusFicha>(r.Status, true),
    };

    private static FichaResponse Mapear(Ficha f) => new(
        f.Id, f.Revendedora, f.DataAbertura, f.Enviadas, f.Devolvidas,
        f.Vendidas, f.TotalVendido, f.Status.ToString(), f.CriadoEm
    );
}
