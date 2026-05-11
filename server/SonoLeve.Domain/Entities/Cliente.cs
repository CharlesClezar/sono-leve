using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Cliente : EntidadeBase
{
    public string Nome { get; set; } = "";
    public string Telefone { get; set; } = "";
    public string Cpf { get; set; } = "";
    public TipoCliente Tipo { get; set; } = TipoCliente.Varejo;
    public string Status { get; set; } = "Ativo";
    public decimal Credito { get; set; } = 0;
}
