namespace SonoLeve.Domain.Entities;

public class ItemVenda
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VendaId { get; set; }
    public string Produto { get; set; } = "";
    public string Ref { get; set; } = "";
    public string Tamanho { get; set; } = "";
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
}
