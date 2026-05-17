namespace SonoLeve.Domain.Entities;

public class CatalogoColecao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Period { get; set; } = "";
    public bool Active { get; set; } = true;
}
