namespace SonoLeve.Api.DTOs;

public record ItemEncomendaRequest(
    string Product,
    string Ref,
    string Size,
    int Quantity,
    decimal UnitPrice
);

public record ItemEncomendaResponse(
    string Product,
    string Ref,
    string Size,
    int Quantity,
    decimal UnitPrice
);

public record EncomendaRequest(
    string Cliente,
    DateTime Previsao,
    decimal Total,
    decimal Entrada,
    string Status,
    List<ItemEncomendaRequest>? Items = null
);

public record EncomendaResponse(
    Guid Id,
    string Cliente,
    DateTime Previsao,
    decimal Total,
    decimal Entrada,
    int Pecas,
    string Status,
    DateTime CriadoEm
);
