using System.ComponentModel.DataAnnotations;

namespace SonoLeve.Api.DTOs;

public record ItemEncomendaRequest(
    Guid ProdutoId,
    [Required, StringLength(10)] string Tamanho,
    [Range(1, 9999)] int Quantidade,
    [Range(0, 999999.99)] decimal PrecoUnitario
);

public record ItemEncomendaResponse(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    string ProdutoRef,
    string Tamanho,
    int Quantidade,
    decimal PrecoUnitario
);

public record EncomendaRequest(
    Guid ClienteId,
    DateTime Previsao,
    [Range(0, 9999999.99)] decimal Total,
    [Range(0, 9999999.99)] decimal Entrada,
    [Required, StringLength(30)] string Status,
    List<ItemEncomendaRequest>? Items = null
);

public record EncomendaResponse(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    DateTime Previsao,
    decimal Total,
    decimal Entrada,
    int Pecas,
    string Status,
    DateTime CriadoEm
);
