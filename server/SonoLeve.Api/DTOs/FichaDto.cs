namespace SonoLeve.Api.DTOs;

public record FichaRequest(
    Guid ClienteId,
    DateTime DataAbertura,
    int Enviadas,
    int Devolvidas,
    int Vendidas,
    decimal TotalVendido,
    string Status
);

public record FichaResponse(
    Guid Id,
    Guid ClienteId,
    string RevendedoraNome,
    DateTime DataAbertura,
    int Enviadas,
    int Devolvidas,
    int Vendidas,
    decimal TotalVendido,
    string Status,
    DateTime CriadoEm
);
