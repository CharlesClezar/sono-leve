using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/configuracoes-taxa-cartao")]
public class ConfiguracaoTaxaCartaoController : ControllerBase
{
    private readonly IConfiguracaoTaxaCartaoService _service;
    public ConfiguracaoTaxaCartaoController(IConfiguracaoTaxaCartaoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConfiguracaoTaxaCartaoResponse>>> Listar()
    {
        var configs = await _service.ListarAsync();
        return Ok(configs.Select(Mapear));
    }

    [HttpPost]
    public async Task<ActionResult<ConfiguracaoTaxaCartaoResponse>> Criar([FromBody] ConfiguracaoTaxaCartaoRequest request)
    {
        var config = MapearEntidade(request);
        var criado = await _service.CriarAsync(config);
        var comRelacoes = await _service.ObterPorIdAsync(criado.Id);
        return CreatedAtAction(nameof(Listar), Mapear(comRelacoes));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ConfiguracaoTaxaCartaoResponse>> Atualizar(Guid id, [FromBody] ConfiguracaoTaxaCartaoRequest request)
    {
        try
        {
            var existente = await _service.ObterPorIdAsync(id);
            existente.FormaPagamentoId  = request.FormaPagamentoId;
            existente.BandeiraId        = request.BandeiraId;
            existente.TipoCartao        = request.TipoCartao;
            existente.Ativo             = request.Ativo;
            existente.Parcelas          = request.Parcelas.Select(p => new ConfiguracaoTaxaCartaoParcela
            {
                ConfiguracaoTaxaCartaoId = id,
                NumeroParcelas           = p.NumeroParcelas,
                PercentualTaxa           = p.PercentualTaxa,
                PrazoRecebimentoDias     = p.PrazoRecebimentoDias,
                TaxaFixa                 = p.TaxaFixa,
            }).ToList();

            var atualizado = await _service.AtualizarAsync(existente);
            return Ok(Mapear(atualizado));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _service.ExcluirAsync(id);
        return NoContent();
    }

    private static ConfiguracaoTaxaCartao MapearEntidade(ConfiguracaoTaxaCartaoRequest r) =>
        new()
        {
            FormaPagamentoId = r.FormaPagamentoId,
            BandeiraId       = r.BandeiraId,
            TipoCartao       = r.TipoCartao,
            Ativo            = r.Ativo,
            Parcelas         = r.Parcelas.Select(p => new ConfiguracaoTaxaCartaoParcela
            {
                NumeroParcelas       = p.NumeroParcelas,
                PercentualTaxa       = p.PercentualTaxa,
                PrazoRecebimentoDias = p.PrazoRecebimentoDias,
                TaxaFixa             = p.TaxaFixa,
            }).ToList(),
        };

    private static ConfiguracaoTaxaCartaoResponse Mapear(ConfiguracaoTaxaCartao c) =>
        new(
            c.Id,
            c.FormaPagamentoId,
            c.FormaPagamento?.Nome ?? "",
            c.BandeiraId,
            c.Bandeira?.Nome ?? "",
            c.TipoCartao,
            c.Ativo,
            c.Parcelas.Select(p => new ConfiguracaoTaxaCartaoParcelaResponse(
                p.Id, p.NumeroParcelas, p.PercentualTaxa, p.PrazoRecebimentoDias, p.TaxaFixa
            )).ToList()
        );
}
