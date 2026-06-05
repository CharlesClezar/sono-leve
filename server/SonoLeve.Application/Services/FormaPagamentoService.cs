using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class FormaPagamentoService : IFormaPagamentoService
{
    private readonly IFormaPagamentoRepository _repo;
    private readonly IUnitOfWork _uow;

    public FormaPagamentoService(IFormaPagamentoRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public Task<IEnumerable<FormaPagamento>> ListarAsync() => _repo.ListarAsync();

    public async Task<FormaPagamento> ObterPorIdAsync(Guid id) =>
        await _repo.ObterPorIdAsync(id) ?? throw new KeyNotFoundException("Forma de pagamento não encontrada.");

    public async Task<FormaPagamento> CriarAsync(FormaPagamento forma)
    {
        var result = await _repo.CriarAsync(forma);
        await _uow.CommitAsync();
        return result;
    }

    public async Task<FormaPagamento> AtualizarAsync(FormaPagamento forma)
    {
        var result = await _repo.AtualizarAsync(forma);
        await _uow.CommitAsync();
        return result;
    }

    public async Task ExcluirAsync(Guid id)
    {
        await _repo.ExcluirAsync(id);
        await _uow.CommitAsync();
    }
}
