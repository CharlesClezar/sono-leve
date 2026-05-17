namespace SonoLeve.Api.DTOs;

public record ContaRequest(
    Guid ClienteId,
    string Origem,
    decimal Total,
    decimal Recebido,
    DateTime Vencimento,
    string Status
);

public record ContaResponse(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    string Origem,
    decimal Total,
    decimal Recebido,
    DateTime Vencimento,
    string Status,
    DateTime CriadoEm
);
