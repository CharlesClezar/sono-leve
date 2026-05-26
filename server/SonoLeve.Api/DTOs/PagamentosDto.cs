namespace SonoLeve.Api.DTOs;

// ── Bandeiras ─────────────────────────────────────────────────────────────────

public record BandeiraCartaoRequest(string Nome, bool Ativo);

public record BandeiraCartaoResponse(Guid Id, string Nome, bool Ativo);

// ── Configuração de Taxas ─────────────────────────────────────────────────────

public record ConfiguracaoTaxaCartaoParcelaRequest(
    int NumeroParcelas,
    decimal PercentualTaxa,
    int PrazoRecebimentoDias,
    decimal? TaxaFixa);

public record ConfiguracaoTaxaCartaoRequest(
    Guid FormaPagamentoId,
    Guid BandeiraId,
    string TipoCartao,
    bool Ativo,
    List<ConfiguracaoTaxaCartaoParcelaRequest> Parcelas);

public record ConfiguracaoTaxaCartaoResponse(
    Guid Id,
    Guid FormaPagamentoId,
    string FormaPagamentoNome,
    Guid BandeiraId,
    string BandeiraNome,
    string TipoCartao,
    bool Ativo,
    List<ConfiguracaoTaxaCartaoParcelaResponse> Parcelas);

public record ConfiguracaoTaxaCartaoParcelaResponse(
    Guid Id,
    int NumeroParcelas,
    decimal PercentualTaxa,
    int PrazoRecebimentoDias,
    decimal? TaxaFixa);
