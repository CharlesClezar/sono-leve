namespace SonoLeve.Api.DTOs;

public record ProdutoRequest(
    string Nome,
    string Ref,
    Guid? MarcaId,
    Guid? TipoId,
    Guid? SubtipoId,
    Guid? CategoriaId,
    Guid? ColecaoId,
    Guid? ModeloId,
    decimal PrecoVarejo,
    decimal PrecoAtacado,
    bool Ativo,
    int Estoque
);

public record ProdutoResponse(
    Guid Id,
    string Nome,
    string Ref,
    Guid? MarcaId,
    string? MarcaNome,
    Guid? TipoId,
    string? TipoNome,
    Guid? SubtipoId,
    string? SubtipoNome,
    Guid? CategoriaId,
    string? CategoriaNome,
    Guid? ColecaoId,
    string? ColecaoNome,
    Guid? ModeloId,
    string? ModeloNome,
    decimal PrecoVarejo,
    decimal PrecoAtacado,
    bool Ativo,
    int Estoque,
    DateTime CriadoEm,
    string? ImagemUrl
);
