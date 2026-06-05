namespace SonoLeve.Domain.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public string Entidade { get; set; } = "";
    public string EntidadeId { get; set; } = "";
    public string Acao { get; set; } = "";
    public string? DadosAntes { get; set; }
    public string? DadosDepois { get; set; }
    public string? Endpoint { get; set; }
    public string? StackTrace { get; set; }
    public DateTime OcorridoEm { get; set; } = DateTime.UtcNow;
}
