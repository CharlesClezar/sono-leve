namespace SonoLeve.Api.DTOs;

public record ItemVendaRequest(
    Guid ProdutoId,
    string Tamanho,
    int Quantidade,
    decimal PrecoUnitario
);

public record ItemVendaResponse(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    string ProdutoRef,
    string Tamanho,
    int Quantidade,
    decimal PrecoUnitario
);

public record VendaRequest(
    Guid ClienteId,
    Guid? FormaPagamentoId,
    DateTime? Data,
    int Pecas,
    decimal Total,
    string Status,
    string Origem,
    List<ItemVendaRequest>? Items = null
);

public record VendaResponse(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    Guid? FormaPagamentoId,
    string? FormaPagamentoNome,
    DateTime Data,
    int Pecas,
    decimal Total,
    string Status,
    string Origem,
    DateTime CriadoEm
);
