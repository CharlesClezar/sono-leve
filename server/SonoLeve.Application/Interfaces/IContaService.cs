using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IContaService
{
    Task<(IEnumerable<Conta> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina);
    Task<Conta> ObterPorIdAsync(Guid id);
    Task<Conta> CriarAsync(Conta conta);
    Task<Conta> AtualizarAsync(Conta conta);

    /// <summary>
    /// Cria (ou atualiza) a Conta vinculada a uma Venda com as taxas de cartão snapshotadas.
    /// Se já existe uma Conta para a Venda, ela é atualizada.
    /// </summary>
    Task<Conta> SincronizarContaDeVendaAsync(
        Guid vendaId,
        Guid clienteId,
        decimal total,
        decimal recebido,
        DateTime dataVenda,
        int? numeroParcelas,
        decimal? percentualTaxaCartao,
        decimal? taxaFixaCartao,
        decimal? valorTaxaCartao,
        int prazoRecebimentoDias);
}
