using System.ComponentModel.DataAnnotations;

namespace SonoLeve.Domain.Entities;

public class IdempotencyRecord
{
    [Key]
    public string Key { get; set; } = default!;
    public int StatusCode { get; set; }
    public string ResponseBody { get; set; } = default!;
    public string ContentType { get; set; } = "application/json";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime ExpiraEm { get; set; }
}
