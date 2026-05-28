namespace SonoLeve.Domain.Entities;

public class FormaPagamento : EntidadeBase
{
    public string Nome { get; set; } = "";
    /// <summary>"Dinheiro" | "Pix" | "Debito" | "Credito" | "Boleto"</summary>
    public string Tipo { get; set; } = "";
    public bool PermiteParcelamento { get; set; } = false;
    public bool ExigeBandeira { get; set; } = false;
    public bool Ativo { get; set; } = true;
    /// <summary>Cobra a taxa do cliente (true) ou absorve a taxa (false)</summary>
    public bool RepassaTaxaAoCliente { get; set; } = false;
}
