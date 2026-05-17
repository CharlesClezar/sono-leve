namespace SonoLeve.Api.DTOs;

public record CatalogoProdutoRequest(
    string Name,
    bool Active,
    List<string>? Grade = null,
    string? Type = null,
    string? Period = null
);

public record CategoriaCatalogoResponse(Guid Id, string Name, List<string> Grade, int Products, bool Active);
public record CatalogoSimplesResponse(Guid Id, string Name, int Products, bool Active);
public record TipoCatalogoResponse(Guid Id, string Name, int Products, bool Active, int Subtypes);
public record SubtipoCatalogoResponse(Guid Id, string Name, int Products, bool Active, string Type);
public record ColecaoCatalogoResponse(Guid Id, string Name, int Products, bool Active, string Period);

public record CatalogoProdutosResponse(
    IEnumerable<CategoriaCatalogoResponse> Categorias,
    IEnumerable<CatalogoSimplesResponse> Marcas,
    IEnumerable<TipoCatalogoResponse> Tipos,
    IEnumerable<SubtipoCatalogoResponse> Subtipos,
    IEnumerable<ColecaoCatalogoResponse> Colecoes,
    IEnumerable<CatalogoSimplesResponse> Modelos
);
