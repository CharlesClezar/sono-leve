namespace SonoLeve.Domain.Entities;

public class Produto : EntidadeBase
{
    public string Nome { get; set; } = "";
    public string Ref { get; set; } = "";

    public Guid? MarcaId { get; set; }
    public CatalogoMarca? Marca { get; set; }

    public Guid? TipoId { get; set; }
    public CatalogoTipo? Tipo { get; set; }

    public Guid? SubtipoId { get; set; }
    public CatalogoSubtipo? Subtipo { get; set; }

    public Guid? CategoriaId { get; set; }
    public CatalogoCategoria? Categoria { get; set; }

    public Guid? ColecaoId { get; set; }
    public CatalogoColecao? Colecao { get; set; }

    public Guid? ModeloId { get; set; }
    public CatalogoModelo? Modelo { get; set; }

    public decimal PrecoVarejo { get; set; }
    public decimal PrecoAtacado { get; set; }
    public bool Ativo { get; set; } = true;
    public int Estoque { get; set; }
    public string? ImagemUrl { get; set; }
}
