namespace SonoLeve.Domain.Entities;

public class CatalogoSubtipo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public bool Active { get; set; } = true;
}
