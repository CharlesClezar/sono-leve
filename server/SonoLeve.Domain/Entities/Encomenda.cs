using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Encomenda : EntidadeBase
{
    public string Cliente { get; set; } = "";
    public DateTime Previsao { get; set; }
    public decimal Total { get; set; }
    public decimal Entrada { get; set; }
    public int Pecas { get; set; }
    public StatusEncomenda Status { get; set; } = StatusEncomenda.Aberta;
}
