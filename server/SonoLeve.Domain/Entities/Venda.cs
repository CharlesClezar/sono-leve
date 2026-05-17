using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Venda : EntidadeBase
{
    public string Cliente { get; set; } = "";
    public DateTime Data { get; set; }
    public int Pecas { get; set; }
    public string Pagamento { get; set; } = "";
    public decimal Total { get; set; }
    public StatusVenda Status { get; set; } = StatusVenda.Gerada;
    public OrigemVenda Origem { get; set; } = OrigemVenda.Balcao;
}
