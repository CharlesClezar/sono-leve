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
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(search, status, page, pageSize);
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
            existente.ClienteId            = request.ClienteId;
            existente.Origem               = request.Origem;
            existente.Descricao            = request.Descricao;
            existente.Total                = request.Total;
            existente.Recebido             = request.Recebido;
            existente.Vencimento           = request.Vencimento;
            existente.Status               = Enum.Parse<StatusConta>(request.Status, true);
            existente.NumeroParcelas       = request.NumeroParcelas;
            existente.PercentualTaxaCartao = request.PercentualTaxaCartao;
            existente.TaxaFixaCartao       = request.TaxaFixaCartao;
            existente.ValorTaxaCartao      = request.ValorTaxaCartao;
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private static Conta MapearEntidade(ContaRequest r) => new()
    {
        ClienteId            = r.ClienteId,
        EhManual             = r.EhManual,
        Origem               = r.Origem,
        Descricao            = r.Descricao,
        VendaId              = r.VendaId,
        Total                = r.Total,
        Recebido             = r.Recebido,
        Vencimento           = r.Vencimento,
        Status               = Enum.Parse<StatusConta>(r.Status, true),
        NumeroParcelas       = r.NumeroParcelas,
        PercentualTaxaCartao = r.PercentualTaxaCartao,
        TaxaFixaCartao       = r.TaxaFixaCartao,
        ValorTaxaCartao      = r.ValorTaxaCartao,
    };

    private static ContaResponse Mapear(Conta c) => new(
        c.Id,
        c.ClienteId,
        c.Cliente?.Nome ?? "",
        c.EhManual,
        c.Origem,
        c.Descricao,
        c.VendaId,
        c.Total,
        c.Recebido,
        c.Total - (c.ValorTaxaCartao ?? 0),   // ValorLiquido
        c.Vencimento,
        c.Status.ToString(),
        c.NumeroParcelas,
        c.PercentualTaxaCartao,
        c.TaxaFixaCartao,
        c.ValorTaxaCartao,
        c.CriadoEm
    );
}
