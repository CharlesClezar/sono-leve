using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/contas-receber")]
public class ContaController : ControllerBase
{
    private readonly IContaService _service;
    public ContaController(IContaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ListaResponse<ContaResponse>>> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(page, pageSize);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return Ok(new ListaResponse<ContaResponse>(items.Select(Mapear), total, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContaResponse>> ObterPorId(Guid id)
    {
        try { return Ok(Mapear(await _service.ObterPorIdAsync(id))); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<ContaResponse>> Criar([FromBody] ContaRequest request)
    {
        var criado = await _service.CriarAsync(MapearEntidade(request));
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, Mapear(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ContaResponse>> Atualizar(Guid id, [FromBody] ContaRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.ClienteId = request.ClienteId;
            existente.Origem = request.Origem;
            existente.Total = request.Total;
            existente.Recebido = request.Recebido;
            existente.Vencimento = request.Vencimento;
            existente.Status = Enum.Parse<StatusConta>(request.Status, true);
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private static Conta MapearEntidade(ContaRequest r) => new()
    {
        ClienteId = r.ClienteId, Origem = r.Origem, Total = r.Total,
        Recebido = r.Recebido, Vencimento = r.Vencimento,
        Status = Enum.Parse<StatusConta>(r.Status, true),
    };

    private static ContaResponse Mapear(Conta c) => new(
        c.Id, c.ClienteId, c.Cliente?.Nome ?? "", c.Origem, c.Total,
        c.Recebido, c.Vencimento, c.Status.ToString(), c.CriadoEm
    );
}
