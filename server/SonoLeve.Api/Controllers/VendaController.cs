using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/vendas")]
public class VendaController : ControllerBase
{
    private readonly IVendaService _service;
    public VendaController(IVendaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ListaResponse<VendaResponse>>> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _service.ListarAsync(page, pageSize);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return Ok(new ListaResponse<VendaResponse>(items.Select(Mapear), total, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VendaResponse>> ObterPorId(Guid id)
    {
        try { return Ok(Mapear(await _service.ObterPorIdAsync(id))); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("{id:guid}/itens")]
    public async Task<ActionResult<IEnumerable<ItemVendaResponse>>> ObterItens(Guid id)
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
    public async Task<ActionResult<VendaResponse>> Criar([FromBody] VendaRequest request)
    {
        var entidade = MapearEntidade(request);
        var itens = MapearItensRequest(request.Items);
        var criado = await _service.CriarAsync(entidade, itens);
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, Mapear(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VendaResponse>> Atualizar(Guid id, [FromBody] VendaRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Cliente = request.Cliente;
            existente.Data = request.Data;
            existente.Pecas = request.Pecas;
            existente.Pagamento = request.Pagamento;
            existente.Total = request.Total;
            existente.Status = Enum.Parse<StatusVenda>(request.Status, true);
            existente.Origem = ParseOrigem(request.Origem);
            var itens = MapearItensRequest(request.Items);
            return Ok(Mapear(await _service.AtualizarAsync(existente, itens)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("{id:guid}/cancelar")]
    public async Task<ActionResult<VendaResponse>> Cancelar(Guid id, [FromBody] CancelarVendaRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.Status = StatusVenda.Cancelada;
            return Ok(Mapear(await _service.AtualizarAsync(existente)));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private static IEnumerable<ItemVenda>? MapearItensRequest(List<ItemVendaRequest>? items) =>
        items?.Select(i => new ItemVenda
        {
            Produto = i.Product,
            Ref = i.Ref,
            Tamanho = i.Size,
            Quantidade = i.Quantity,
            PrecoUnitario = i.UnitPrice,
        });

    private static Venda MapearEntidade(VendaRequest r) => new()
    {
        Cliente = r.Cliente, Data = r.Data, Pecas = r.Pecas,
        Pagamento = r.Pagamento, Total = r.Total,
        Status = Enum.Parse<StatusVenda>(r.Status, true),
        Origem = ParseOrigem(r.Origem),
    };

    private static VendaResponse Mapear(Venda v) => new(
        v.Id, v.Cliente, v.Data, v.Pecas, v.Pagamento, v.Total,
        v.Status.ToString(), OrigemPt(v.Origem), v.CriadoEm
    );

    private static ItemVendaResponse MapearItem(ItemVenda i) => new(
        i.Produto, i.Ref, i.Tamanho, i.Quantidade, i.PrecoUnitario
    );

    private static string OrigemPt(OrigemVenda origem) => origem switch
    {
        OrigemVenda.Balcao => "Balcão",
        OrigemVenda.Encomenda => "Encomenda",
        OrigemVenda.Ficha => "Ficha",
        _ => origem.ToString()
    };

    private static OrigemVenda ParseOrigem(string s) => s switch
    {
        "Balcão" => OrigemVenda.Balcao,
        "Encomenda" => OrigemVenda.Encomenda,
        "Ficha" => OrigemVenda.Ficha,
        _ => Enum.Parse<OrigemVenda>(s, true)
    };
}

public record CancelarVendaRequest(string Motivo);
