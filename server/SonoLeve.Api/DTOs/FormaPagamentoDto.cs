namespace SonoLeve.Api.DTOs;

public record FormaPagamentoRequest(
    string Nome,
    string Tipo,
    bool PermiteParcelamento,
    bool ExigeBandeira,
    bool Ativo);

public record FormaPagamentoResponse(
    Guid Id,
    string Nome,
    string Tipo,
    bool PermiteParcelamento,
    bool ExigeBandeira,
    bool Ativo);
