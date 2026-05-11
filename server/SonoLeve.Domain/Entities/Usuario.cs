namespace SonoLeve.Domain.Entities;

public class Usuario : EntidadeBase
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string SenhaHash { get; set; } = "";
    public bool Ativo { get; set; } = true;
}
