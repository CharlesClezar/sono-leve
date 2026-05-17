namespace SonoLeve.Api.DTOs;

public record FormaPagamentoRequest(string Nome, string Condicao, string Taxa, bool Ativo);

public record FormaPagamentoResponse(Guid Id, string Nome, string Condicao, string Taxa, bool Ativo);
