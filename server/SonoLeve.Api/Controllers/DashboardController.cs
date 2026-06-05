using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SonoLeve.Api.DTOs;
using SonoLeve.Domain.Enums;
using SonoLeve.Infra.Data;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly SonoLeveDbContext _db;
    public DashboardController(SonoLeveDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<DashboardKpisResponse>> Obter()
    {
        var vendasRaw = await _db.Vendas
            .AsNoTracking()
            .Select(v => new { v.Id, v.Data, v.Total, v.Status })
            .ToListAsync();

        var fichasRaw = await _db.Fichas
            .AsNoTracking()
            .Select(f => new { f.Id, f.DataAbertura, f.Status })
            .ToListAsync();

        var contasRaw = await _db.Contas
            .AsNoTracking()
            .Select(c => new { c.Id, c.Vencimento, c.Total, c.Recebido })
            .ToListAsync();

        var vendas = vendasRaw.Select(v => new VendaDashboard(v.Id, v.Data, v.Total, v.Status.ToString())).ToList();
        var fichas = fichasRaw.Select(f => new FichaDashboard(f.Id, f.DataAbertura, f.Status.ToString())).ToList();
        var contas = contasRaw.Select(c => new ContaDashboard(c.Id, c.Vencimento, c.Total, c.Recebido)).ToList();

        return Ok(new DashboardKpisResponse(vendas, fichas, contas));
    }

    [HttpGet("encomendas")]
    public async Task<ActionResult<IReadOnlyList<EncomendaDashboard>>> ObterEncomendas(
        [FromQuery] DateOnly? inicio = null,
        [FromQuery] DateOnly? fim = null)
    {
        var query = _db.Encomendas
            .AsNoTracking()
            .Where(e => e.Status != StatusEncomenda.Cancelada && e.Status != StatusEncomenda.Entregue);

        if (inicio.HasValue)
        {
            var inicioDateTime = DateTime.SpecifyKind(inicio.Value.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            query = query.Where(e => e.Previsao >= inicioDateTime);
        }
        if (fim.HasValue)
        {
            var fimDateTime = DateTime.SpecifyKind(fim.Value.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);
            query = query.Where(e => e.Previsao <= fimDateTime);
        }

        var raw = await query
            .Select(e => new { e.Id, ClienteNome = e.Cliente != null ? e.Cliente.Nome : "", e.Previsao, e.Total, e.Status })
            .ToListAsync();

        return Ok(raw.Select(e => new EncomendaDashboard(e.Id, e.ClienteNome, e.Previsao, e.Total, StatusEncomendaPt(e.Status))).ToList());
    }

    private static string StatusEncomendaPt(StatusEncomenda status) => status switch
    {
        StatusEncomenda.EmProducao => "Em produção",
        StatusEncomenda.FabricadoParcialmente => "Fabricado parcialmente",
        _ => status.ToString()
    };
}
