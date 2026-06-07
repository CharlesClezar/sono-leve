using SonoLeve.Domain.Enums;

namespace SonoLeve.Domain.Entities;

public class Produto : EntidadeBase
{
    public string Nome { get; set; } = "";
    public string Ref { get; set; } = "";

    public Guid? MarcaId { get; set; }
    public Marca? Marca { get; set; }

    public Guid? TipoId { get; set; }
    public Tipo? Tipo { get; set; }

    public Guid? SubtipoId { get; set; }
    public Subtipo? Subtipo { get; set; }

    public Guid? CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }

    public Guid? ColecaoId { get; set; }
    public Colecao? Colecao { get; set; }

    public decimal PrecoVarejo { get; set; }
    public decimal PrecoAtacado { get; set; }
    public bool Ativo { get; set; } = true;
    public ModalidadeProduto Modalidade { get; set; } = ModalidadeProduto.Aberto;
    public int Estoque { get; set; }
    public string? ImagemUrl { get; set; }
}
