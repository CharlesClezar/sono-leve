namespace SonoLeve.Domain.Entities;

public class ItemVenda
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid VendaId { get; set; }
    public Venda? Venda { get; set; }

    public Guid ProdutoId { get; set; }
    public Produto? Produto { get; set; }

    public string Tamanho { get; set; } = "";
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
}
