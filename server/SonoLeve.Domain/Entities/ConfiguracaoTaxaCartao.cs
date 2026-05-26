namespace SonoLeve.Domain.Entities;

public class ConfiguracaoTaxaCartao : EntidadeBase
{
    public Guid FormaPagamentoId { get; set; }
    public Guid BandeiraId { get; set; }
    /// <summary>"Crédito" | "Débito"</summary>
    public string TipoCartao { get; set; } = "";
    public bool Ativo { get; set; } = true;

    public FormaPagamento FormaPagamento { get; set; } = null!;
    public BandeiraCartao Bandeira { get; set; } = null!;
    public List<ConfiguracaoTaxaCartaoParcela> Parcelas { get; set; } = [];
}
