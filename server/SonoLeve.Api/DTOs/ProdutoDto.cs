using System.ComponentModel.DataAnnotations;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Api.DTOs;

public record ProdutoRequest(
    [Required, StringLength(200)] string Nome,
    [Required, StringLength(50)] string Ref,
    Guid? MarcaId,
    Guid? TipoId,
    Guid? SubtipoId,
    Guid? CategoriaId,
    Guid? ColecaoId,
    [Range(0, 999999.99)] decimal PrecoVarejo,
    [Range(0, 999999.99)] decimal PrecoAtacado,
    bool Ativo,
    ModalidadeProduto Modalidade,
    [Range(0, int.MaxValue)] int Estoque
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
    string[]? CategoriaGrade,
    Guid? ColecaoId,
    string? ColecaoNome,
    decimal PrecoVarejo,
    decimal PrecoAtacado,
    bool Ativo,
    ModalidadeProduto Modalidade,
    int Estoque,
    DateTime CriadoEm,
    string? ImagemUrl
);
