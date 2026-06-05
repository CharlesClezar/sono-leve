using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Domain.Enums;

namespace SonoLeve.Application.Services;

public class ContaService : IContaService
{
    private readonly IContaRepository _repo;
    private readonly IUnitOfWork _uow;

    public ContaService(IContaRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public Task<(IEnumerable<Conta> items, int total)> ListarAsync(
        string? search, string? status, int pagina, int tamanhoPagina) =>
        _repo.ListarAsync(search, status, pagina, tamanhoPagina);

    public Task<Conta> ObterPorIdAsync(Guid id) => _repo.ObterPorIdAsync(id);

    public async Task<Conta> CriarAsync(Conta conta)
    {
        var result = await _repo.CriarAsync(conta);
        await _uow.CommitAsync();
        return result;
    }

    public async Task<Conta> AtualizarAsync(Conta conta)
    {
        var result = await _repo.AtualizarAsync(conta);
        await _uow.CommitAsync();
        return result;
    }

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
        Conta result;
        if (existente is not null)
        {
            existente.ClienteId            = clienteId;
            existente.Total                = total;
            existente.Recebido             = recebido;
            existente.Vencimento           = vencimento;
            existente.Status               = status;
            existente.NumeroParcelas       = numeroParcelas;
            existente.PercentualTaxaCartao = percentualTaxaCartao;
            existente.TaxaFixaCartao       = taxaFixaCartao;
            existente.ValorTaxaCartao      = valorTaxaCartao;
            result = await _repo.AtualizarAsync(existente);
        }
        else
        {
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
            result = await _repo.CriarAsync(nova);
        }

        await _uow.CommitAsync();
        return result;
    }

    private static StatusConta CalcularStatus(decimal total, decimal recebido)
    {
        if (recebido <= 0) return StatusConta.Aberto;
        if (recebido >= total) return StatusConta.Pago;
        return StatusConta.Parcial;
    }
}
