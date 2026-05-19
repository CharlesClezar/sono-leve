using System.ComponentModel.DataAnnotations;

namespace SonoLeve.Api.DTOs;

public record FichaRequest(
    Guid ClienteId,
    DateTime DataAbertura,
    [Range(0, 99999)] int Enviadas,
    [Range(0, 99999)] int Devolvidas,
    [Range(0, 99999)] int Vendidas,
    [Range(0, 9999999.99)] decimal TotalVendido,
    [Required, StringLength(20)] string Status
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
