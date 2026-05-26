using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Conta : EntidadeBase
{
    public Guid ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    /// <summary>true = criada manualmente; false = gerada automaticamente de uma Venda</summary>
    public bool EhManual { get; set; } = false;

    /// <summary>Referência legível: "Venda", "Manual", nome do produto etc.</summary>
    public string Origem { get; set; } = "";

    /// <summary>Descrição livre para lançamentos manuais.</summary>
    public string? Descricao { get; set; }

    // ── Vínculo com venda ────────────────────────────────────────────────────
    public Guid? VendaId { get; set; }
    public Venda? Venda { get; set; }

    // ── Valores ──────────────────────────────────────────────────────────────
    public decimal Total { get; set; }
    public decimal Recebido { get; set; }
    public DateTime Vencimento { get; set; }
    public StatusConta Status { get; set; } = StatusConta.Aberto;

    // ── Snapshot da taxa de cartão no momento do lançamento ──────────────────
    /// <summary>Número de parcelas selecionado na venda (snapshot).</summary>
    public int? NumeroParcelas { get; set; }

    /// <summary>Percentual da taxa de cartão (snapshot).</summary>
    public decimal? PercentualTaxaCartao { get; set; }

    /// <summary>Taxa fixa em R$ do cartão (snapshot).</summary>
    public decimal? TaxaFixaCartao { get; set; }

    /// <summary>Valor calculado da taxa (snapshot). ValorLiquido = Total - ValorTaxaCartao.</summary>
    public decimal? ValorTaxaCartao { get; set; }
}
