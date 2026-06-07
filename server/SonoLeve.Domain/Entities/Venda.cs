using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Venda : EntidadeBase
{
    public Guid ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public Guid? FormaPagamentoId { get; set; }
    public FormaPagamento? FormaPagamento { get; set; }

    public Guid? BandeiraId { get; set; }
    public int? NumeroParcelas { get; set; }

    public DateTime Data { get; set; }
    public int Pecas { get; set; }
    public decimal Total { get; set; }
    public StatusVenda Status { get; set; } = StatusVenda.Gerada;
    public OrigemVenda Origem { get; set; } = OrigemVenda.Balcao;

    public ICollection<ItemVenda> Itens { get; set; } = [];
}
