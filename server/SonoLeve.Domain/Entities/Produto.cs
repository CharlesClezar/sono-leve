namespace SonoLeve.Domain.Entities;

public class Produto : EntidadeBase
{
    public string Nome { get; set; } = "";
    public string Ref { get; set; } = "";
    public string Marca { get; set; } = "";
    public string Tipo { get; set; } = "";
    public string Subtipo { get; set; } = "";
    public string Categoria { get; set; } = "";
    public string Colecao { get; set; } = "";
    public string Modelo { get; set; } = "";
    public decimal PrecoVarejo { get; set; }
    public decimal PrecoAtacado { get; set; }
    public bool Ativo { get; set; } = true;
    public int Estoque { get; set; }
    public string? ImagemUrl { get; set; }
}
