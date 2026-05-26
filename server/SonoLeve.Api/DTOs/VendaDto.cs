using System.ComponentModel.DataAnnotations;

namespace SonoLeve.Api.DTOs;

public record ItemVendaRequest(
    Guid ProdutoId,
    [Required, StringLength(10)] string Tamanho,
    [Range(1, 9999)] int Quantidade,
    [Range(0, 999999.99)] decimal PrecoUnitario,
    [Range(0, 100)] decimal? DescontoPct = null,
    [Range(0, 999999.99)] decimal? DescontoVal = null
);

public record ItemVendaResponse(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    string ProdutoRef,
    string Tamanho,
    int Quantidade,
    decimal PrecoUnitario,
    decimal? DescontoPct,
    decimal? DescontoVal
);

public record VendaRequest(
    Guid ClienteId,
    Guid? FormaPagamentoId,
    DateTime? Data,
    [Range(1, 99999)] int Pecas,
    [Range(0, 9999999.99)] decimal Total,
    [Required, StringLength(20)] string Status,
    [Required, StringLength(50)] string Origem,
    List<ItemVendaRequest>? Items = null,
    // ── Pagamento / taxa (para snapshot na Conta) ──────────────────────────
    Guid? BandeiraId = null,
    int? NumeroParcelas = null,
    [Range(0, 100)] decimal? PercentualTaxaCartao = null,
    [Range(0, 999999.99)] decimal? TaxaFixaCartao = null,
    [Range(0, 999999.99)] decimal? ValorTaxaCartao = null,
    /// <summary>Prazo de recebimento em dias (da parcela selecionada).</summary>
    int? PrazoRecebimentoDias = null,
    /// <summary>Valor já pago no ato da venda.</summary>
    [Range(0, 9999999.99)] decimal? ValorPago = null
);

public record VendaResponse(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    Guid? FormaPagamentoId,
    string? FormaPagamentoNome,
    DateTime Data,
    int Pecas,
    decimal Total,
    string Status,
    string Origem,
    DateTime CriadoEm
);
