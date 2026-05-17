using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClienteController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClienteController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet]
    public async Task<ActionResult<ListaResponse<ClienteResponse>>> Listar(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _clienteService.ListarAsync(search, page, pageSize);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);

        return Ok(new ListaResponse<ClienteResponse>(
            items.Select(MapearResposta),
            total, page, pageSize, totalPages
        ));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClienteResponse>> ObterPorId(Guid id)
    {
        try
        {
            var cliente = await _clienteService.ObterPorIdAsync(id);
            return Ok(MapearResposta(cliente));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ClienteResponse>> Criar([FromBody] ClienteRequest request)
    {
        var cliente = MapearEntidade(request);
        var criado = await _clienteService.CriarAsync(cliente);
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, MapearResposta(criado));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClienteResponse>> Atualizar(Guid id, [FromBody] ClienteRequest request)
    {
        try
        {
            var existente = await _clienteService.ObterPorIdAsync(id);
            existente.Nome = request.Nome;
            existente.Telefone = request.Telefone;
            existente.Cpf = request.Cpf;
            existente.Tipo = Enum.Parse<TipoCliente>(request.Tipo, true);
            existente.Status = request.Status;
            existente.Credito = request.Credito;

            var atualizado = await _clienteService.AtualizarAsync(existente);
            return Ok(MapearResposta(atualizado));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private static Cliente MapearEntidade(ClienteRequest request) => new()
    {
        Nome = request.Nome,
        Telefone = request.Telefone,
        Cpf = request.Cpf,
        Tipo = Enum.Parse<TipoCliente>(request.Tipo, true),
        Status = request.Status,
        Credito = request.Credito,
    };

    private static ClienteResponse MapearResposta(Cliente c) => new(
        c.Id, c.Nome, c.Telefone, c.Cpf,
        c.Tipo.ToString().ToLower(), c.Status, c.Credito, c.CriadoEm
    );
}
