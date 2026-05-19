namespace SonoLeve.Domain.Entities;

public class Subtipo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public bool Active { get; set; } = true;
}
