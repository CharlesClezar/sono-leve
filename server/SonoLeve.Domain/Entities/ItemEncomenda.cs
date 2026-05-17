namespace SonoLeve.Domain.Entities;

public class ItemEncomenda
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EncomendaId { get; set; }
    public string Produto { get; set; } = "";
    public string Ref { get; set; } = "";
    public string Tamanho { get; set; } = "";
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
}
