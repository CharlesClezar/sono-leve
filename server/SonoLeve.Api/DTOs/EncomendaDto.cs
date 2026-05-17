namespace SonoLeve.Api.DTOs;

public record ItemEncomendaRequest(
    Guid ProdutoId,
    string Tamanho,
    int Quantidade,
    decimal PrecoUnitario
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
    decimal Total,
    decimal Entrada,
    string Status,
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
