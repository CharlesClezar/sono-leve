namespace SonoLeve.Domain.Entities;

public class FormaPagamento : EntidadeBase
{
    public string Nome { get; set; } = "";
    public string Condicao { get; set; } = "";
    public string Taxa { get; set; } = "";
    public bool Ativo { get; set; } = true;
}
