namespace SonoLeve.Api.DTOs;

public record ClienteRequest(
    string Nome,
    string Telefone,
    string Cpf,
    string Tipo,
    string Status,
    decimal Credito
);

public record ClienteResponse(
    Guid Id,
    string Nome,
    string Telefone,
    string Cpf,
    string Tipo,
    string Status,
    decimal Credito,
    DateTime CriadoEm
);

public record ListaResponse<T>(
    IEnumerable<T> Data,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
