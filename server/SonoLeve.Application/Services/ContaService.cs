using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Application.Services;

public class ContaService : IContaService
{
    private readonly IContaRepository _repo;
    public ContaService(IContaRepository repo) => _repo = repo;

    public Task<(IEnumerable<Conta> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(search, status, pagina, tamanhoPagina);

    public Task<Conta> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);
    public Task<Conta> CriarAsync(Conta conta) => _repo.CriarAsync(conta);
    public Task<Conta> AtualizarAsync(Conta conta) => _repo.AtualizarAsync(conta);

    public async Task<Conta> SincronizarContaDeVendaAsync(
        Guid vendaId,
        Guid clienteId,
        decimal total,
        decimal recebido,
        DateTime dataVenda,
        int? numeroParcelas,
        decimal? percentualTaxaCartao,
        decimal? taxaFixaCartao,
        decimal? valorTaxaCartao,
        int prazoRecebimentoDias)
    {
        var status = CalcularStatus(total, recebido);
        var vencimento = dataVenda.AddDays(prazoRecebimentoDias > 0 ? prazoRecebimentoDias : 0);

        var existente = await _repo.ObterPorVendaIdAsync(vendaId);
        if (existente is not null)
        {
            // Atualiza dados financeiros; preserva taxa se o usuário tiver editado manualmente
            existente.ClienteId            = clienteId;
            existente.Total                = total;
            existente.Recebido             = recebido;
            existente.Vencimento           = vencimento;
            existente.Status               = status;
            existente.NumeroParcelas       = numeroParcelas;
            existente.PercentualTaxaCartao = percentualTaxaCartao;
            existente.TaxaFixaCartao       = taxaFixaCartao;
            existente.ValorTaxaCartao      = valorTaxaCartao;
            return await _repo.AtualizarAsync(existente);
        }

        var nova = new Conta
        {
            ClienteId            = clienteId,
            EhManual             = false,
            Origem               = "Venda",
            VendaId              = vendaId,
            Total                = total,
            Recebido             = recebido,
            Vencimento           = vencimento,
            Status               = status,
            NumeroParcelas       = numeroParcelas,
            PercentualTaxaCartao = percentualTaxaCartao,
            TaxaFixaCartao       = taxaFixaCartao,
            ValorTaxaCartao      = valorTaxaCartao,
        };
        return await _repo.CriarAsync(nova);
    }

    private static StatusConta CalcularStatus(decimal total, decimal recebido)
    {
        if (recebido <= 0) return StatusConta.Aberto;
        if (recebido >= total) return StatusConta.Pago;
        return StatusConta.Parcial;
    }
}
