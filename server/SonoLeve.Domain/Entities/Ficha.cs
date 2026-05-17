using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Ficha : EntidadeBase
{
    public Guid ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public DateTime DataAbertura { get; set; }
    public int Enviadas { get; set; }
    public int Devolvidas { get; set; }
    public int Vendidas { get; set; }
    public decimal TotalVendido { get; set; }
    public StatusFicha Status { get; set; } = StatusFicha.Aberta;
}
