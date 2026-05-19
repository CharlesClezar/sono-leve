using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/encomendas")]
public class EncomendaController : ControllerBase
{
    private readonly IEncomendaService _service;
    public EncomendaController(IEncomendaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ListaResponse<EncomendaResponse>>> Listar(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(search, status, page, pageSize);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return Ok(new ListaResponse<EncomendaResponse>(items.Select(Mapear), total, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EncomendaResponse>> ObterPorId(Guid id)
    {
        try { return Ok(Mapear(await _service.ObterPorIdAsync(id))); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("{id:guid}/itens")]
    public async Task<ActionResult<IEnumerable<ItemEncomendaResponse>>> ObterItens(Guid id)
    {
        try
        {
            await _service.ObterPorIdAsync(id);
            var itens = await _service.ObterItensAsync(id);
            return Ok(itens.Select(MapearItem));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<EncomendaResponse>> Criar([FromBody] EncomendaRequest request)
    {
        var entidade = MapearEntidade(request);
        var itens = MapearItensRequest(request.Items);
        var criado = await _service.CriarAsync(entidade, itens);
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, Mapear(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EncomendaResponse>> Atualizar(Guid id, [FromBody] EncomendaRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.ClienteId = request.ClienteId;
            existente.Previsao = request.Previsao;
            existente.Total = request.Total;
            existente.Entrada = request.Entrada;
            existente.Status = ParseStatus(request.Status);
            if (request.Items is not null)
                existente.Pecas = request.Items.Sum(i => i.Quantidade);
            var itens = MapearItensRequest(request.Items);
            return Ok(Mapear(await _service.AtualizarAsync(existente, itens)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<EncomendaResponse>> AtualizarStatus(Guid id, [FromBody] AtualizarStatusRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Status = ParseStatus(request.Status);
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private static IEnumerable<ItemEncomenda>? MapearItensRequest(List<ItemEncomendaRequest>? items) =>
        items?.Select(i => new ItemEncomenda
        {
            ProdutoId = i.ProdutoId,
            Tamanho = i.Tamanho,
            Quantidade = i.Quantidade,
            PrecoUnitario = i.PrecoUnitario,
        });

    private static Encomenda MapearEntidade(EncomendaRequest r) => new()
    {
        ClienteId = r.ClienteId, Previsao = r.Previsao, Total = r.Total,
        Entrada = r.Entrada, Status = ParseStatus(r.Status),
        Pecas = r.Items?.Sum(i => i.Quantidade) ?? 0,
    };

    private static EncomendaResponse Mapear(Encomenda e) => new(
        e.Id, e.ClienteId, e.Cliente?.Nome ?? "",
        e.Previsao, e.Total, e.Entrada, e.Pecas, StatusPt(e.Status), e.CriadoEm
    );

    private static ItemEncomendaResponse MapearItem(ItemEncomenda i) => new(
        i.Id, i.ProdutoId, i.Produto?.Nome ?? "", i.Produto?.Ref ?? "",
        i.Tamanho, i.Quantidade, i.PrecoUnitario
    );

    private static string StatusPt(StatusEncomenda status) => status switch
    {
        StatusEncomenda.EmProducao => "Em produção",
        StatusEncomenda.FabricadoParcialmente => "Fabricado parcialmente",
        _ => status.ToString()
    };

    private static StatusEncomenda ParseStatus(string s) => s switch
    {
        "Em produção" => StatusEncomenda.EmProducao,
        "Fabricado parcialmente" => StatusEncomenda.FabricadoParcialmente,
        "Novo" => StatusEncomenda.Aberta,
        _ => Enum.Parse<StatusEncomenda>(s, true)
    };
}

public record AtualizarStatusRequest(string Status);
