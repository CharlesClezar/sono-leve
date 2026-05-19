namespace SonoLeve.Domain.Entities;

public class Categoria
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public List<string> Grade { get; set; } = [];
    public bool Active { get; set; } = true;
}
