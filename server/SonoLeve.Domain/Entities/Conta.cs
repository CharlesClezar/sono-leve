using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Conta : EntidadeBase
{
    public string Cliente { get; set; } = "";
    public string Origem { get; set; } = "";
    public decimal Total { get; set; }
    public decimal Recebido { get; set; }
    public DateTime Vencimento { get; set; }
    public StatusConta Status { get; set; } = StatusConta.Aberto;
}
