namespace SonoLeve.Api.DTOs;

public record ItemVendaRequest(
    string Product,
    string Ref,
    string Size,
    int Quantity,
    decimal UnitPrice
);

public record ItemVendaResponse(
    string Product,
    string Ref,
    string Size,
    int Quantity,
    decimal UnitPrice
);

public record VendaRequest(
    string Cliente,
    DateTime Data,
    int Pecas,
    string Pagamento,
    decimal Total,
    string Status,
    string Origem,
    List<ItemVendaRequest>? Items = null
);

public record VendaResponse(
    Guid Id,
    string Cliente,
    DateTime Data,
    int Pecas,
    string Pagamento,
    decimal Total,
    string Status,
    string Origem,
    DateTime CriadoEm
);
