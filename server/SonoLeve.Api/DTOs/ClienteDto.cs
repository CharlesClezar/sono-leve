using System.ComponentModel.DataAnnotations;

namespace SonoLeve.Api.DTOs;

public record ClienteRequest(
    [Required, StringLength(200)] string Nome,
    [StringLength(20)] string Telefone,
    [StringLength(14)] string Cpf,
    [Required, StringLength(20)] string Tipo,
    [Required, StringLength(20)] string Status,
    [Range(0, 999999.99)] decimal Credito
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
