namespace SonoLeve.Domain.Entities;

public class ItemEncomenda
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EncomendaId { get; set; }
    public Encomenda? Encomenda { get; set; }

    public Guid ProdutoId { get; set; }
    public Produto? Produto { get; set; }

    public string Tamanho { get; set; } = "";
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
}
