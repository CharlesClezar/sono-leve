using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SonoLeve.Infra.Data;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
public class AuditLogController : ControllerBase
{
    private readonly SonoLeveDbContext _db;

    // Todas as entidades do domínio que podem aparecer no histórico
    private static readonly string[] EntidadesSistema =
    [
        "BandeiraCartao", "Categoria", "Cliente", "Colecao",
        "ConfiguracaoTaxaCartao", "ConfiguracaoTaxaCartaoParcela",
        "Conta", "Encomenda", "Ficha", "FormaPagamento",
        "ItemEncomenda", "ItemVenda", "Marca", "Produto",
        "Subtipo", "Tipo", "Usuario", "Venda",
    ];

    public AuditLogController(SonoLeveDbContext db)
    {
        _db = db;
    }

    [HttpGet("entidades")]
    public IActionResult ListarEntidades() => Ok(EntidadesSistema.OrderBy(e => e));

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? entidade,
        [FromQuery] string? entidadeId,
        [FromQuery] string? acao,
        [FromQuery] string? busca,
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        pageSize = Math.Min(pageSize, 100);
        page = Math.Max(page, 1);

        var query = _db.AuditLog.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(entidade))
            query = query.Where(a => a.Entidade == entidade);

        if (!string.IsNullOrWhiteSpace(entidadeId))
            query = query.Where(a => EF.Functions.ILike(a.EntidadeId, $"%{entidadeId}%"));

        if (!string.IsNullOrWhiteSpace(acao))
            query = query.Where(a => a.Acao == acao);

        if (DateOnly.TryParseExact(dataInicio, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var di))
            query = query.Where(a => a.OcorridoEm >= di.ToDateTime(TimeOnly.MinValue));

        if (DateOnly.TryParseExact(dataFim, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var df))
            query = query.Where(a => a.OcorridoEm < df.AddDays(1).ToDateTime(TimeOnly.MinValue));

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var padrao = $"%{busca}%";
            query = query.Where(a =>
                EF.Functions.ILike(a.EntidadeId, padrao) ||
                EF.Functions.ILike(a.Acao, padrao) ||
                (a.Endpoint != null && EF.Functions.ILike(a.Endpoint, padrao)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.OcorridoEm)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.Entidade,
                a.EntidadeId,
                a.Acao,
                a.DadosAntes,
                a.DadosDepois,
                a.Endpoint,
                a.OcorridoEm,
            })
            .ToListAsync();

        return Ok(new
        {
            data = items,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
        });
    }
}
