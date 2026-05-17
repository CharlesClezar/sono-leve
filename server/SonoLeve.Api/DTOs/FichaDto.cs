namespace SonoLeve.Api.DTOs;

public record FichaRequest(
    string Revendedora,
    DateTime DataAbertura,
    int Enviadas,
    int Devolvidas,
    int Vendidas,
    decimal TotalVendido,
    string Status
);

public record FichaResponse(
    Guid Id,
    string Revendedora,
    DateTime DataAbertura,
    int Enviadas,
    int Devolvidas,
    int Vendidas,
    decimal TotalVendido,
    string Status,
    DateTime CriadoEm
);
