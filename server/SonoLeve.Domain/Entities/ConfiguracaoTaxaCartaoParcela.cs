namespace SonoLeve.Domain.Entities;

public class ConfiguracaoTaxaCartaoParcela : EntidadeBase
{
    public Guid ConfiguracaoTaxaCartaoId { get; set; }
    public int NumeroParcelas { get; set; }
    public decimal PercentualTaxa { get; set; }
    public int PrazoRecebimentoDias { get; set; }
    public decimal? TaxaFixa { get; set; }

    public ConfiguracaoTaxaCartao ConfiguracaoTaxaCartao { get; set; } = null!;
}
