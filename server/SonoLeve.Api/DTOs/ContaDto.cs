using System.ComponentModel.DataAnnotations;

namespace SonoLeve.Api.DTOs;

public record ContaRequest(
    Guid ClienteId,
    [Required, StringLength(100)] string Origem,
    [Range(0, 9_999_999.99)] decimal Total,
    [Range(0, 9_999_999.99)] decimal Recebido,
    DateTime Vencimento,
    [Required, StringLength(20)] string Status,
    bool EhManual = true,
    string? Descricao = null,
    Guid? VendaId = null,
    int? NumeroParcelas = null,
    [Range(0, 100)] decimal? PercentualTaxaCartao = null,
    [Range(0, 999_999.99)] decimal? TaxaFixaCartao = null,
    [Range(0, 999_999.99)] decimal? ValorTaxaCartao = null
);

public record ContaResponse(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    bool EhManual,
    string Origem,
    string? Descricao,
    Guid? VendaId,
    decimal Total,
    decimal Recebido,
    decimal ValorLiquido,
    DateTime Vencimento,
    string Status,
    int? NumeroParcelas,
    decimal? PercentualTaxaCartao,
    decimal? TaxaFixaCartao,
    decimal? ValorTaxaCartao,
    DateTime CriadoEm
);
