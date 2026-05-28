namespace SonoLeve.Api.DTOs;

public record FormaPagamentoRequest(
    string Nome,
    string Tipo,
    bool PermiteParcelamento,
    bool ExigeBandeira,
    bool Ativo,
    bool RepassaTaxaAoCliente);

public record FormaPagamentoResponse(
    Guid Id,
    string Nome,
    string Tipo,
    bool PermiteParcelamento,
    bool ExigeBandeira,
    bool Ativo,
    bool RepassaTaxaAoCliente);
