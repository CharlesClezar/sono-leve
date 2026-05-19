namespace SonoLeve.Domain.Entities;

public class Colecao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public DateOnly? DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public bool Active { get; set; } = true;
}
