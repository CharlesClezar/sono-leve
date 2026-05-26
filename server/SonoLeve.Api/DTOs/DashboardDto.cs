namespace SonoLeve.Api.DTOs;

public record VendaDashboard(Guid Id, DateTime Data, decimal Total, string Status);

public record EncomendaDashboard(Guid Id, string ClienteNome, DateTime Previsao, decimal Total, string Status);

public record FichaDashboard(Guid Id, DateTime DataAbertura, string Status);

public record ContaDashboard(Guid Id, DateTime Vencimento, decimal Total, decimal Recebido);

public record DashboardKpisResponse(
    IReadOnlyList<VendaDashboard> Vendas,
    IReadOnlyList<FichaDashboard> Fichas,
    IReadOnlyList<ContaDashboard> Contas);

