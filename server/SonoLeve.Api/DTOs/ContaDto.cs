namespace SonoLeve.Api.DTOs;

public record ContaRequest(
    string Cliente,
    string Origem,
    decimal Total,
    decimal Recebido,
    DateTime Vencimento,
    string Status
);

public record ContaResponse(
    Guid Id,
    string Cliente,
    string Origem,
    decimal Total,
    decimal Recebido,
    DateTime Vencimento,
    string Status,
    DateTime CriadoEm
);
