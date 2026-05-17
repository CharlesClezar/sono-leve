namespace SonoLeve.Api.DTOs;

public record ProdutoRequest(
    string Nome,
    string Ref,
    string Marca,
    string Tipo,
    string Subtipo,
    string Categoria,
    string Colecao,
    string Modelo,
    decimal PrecoVarejo,
    decimal PrecoAtacado,
    bool Ativo,
    int Estoque
);

public record ProdutoResponse(
    Guid Id,
    string Nome,
    string Ref,
    string Marca,
    string Tipo,
    string Subtipo,
    string Categoria,
    string Colecao,
    string Modelo,
    decimal PrecoVarejo,
    decimal PrecoAtacado,
    bool Ativo,
    int Estoque,
    DateTime CriadoEm,
    string? ImagemUrl
);
