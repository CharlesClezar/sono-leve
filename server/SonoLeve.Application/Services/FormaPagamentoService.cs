using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class FormaPagamentoService : IFormaPagamentoService
{
    private readonly IFormaPagamentoRepository _repo;
    public FormaPagamentoService(IFormaPagamentoRepository repo) => _repo = repo;

    public Task<IEnumerable<FormaPagamento>> ListarAsync() => _repo.ListarAsync();

    public async Task<FormaPagamento> ObterPorIdAsync(Guid id) =>
        await _repo.ObterPorIdAsync(id) ?? throw new KeyNotFoundException("Forma de pagamento não encontrada.");

    public Task<FormaPagamento> CriarAsync(FormaPagamento forma) => _repo.AdicionarAsync(forma);

    public Task<FormaPagamento> AtualizarAsync(FormaPagamento forma) => _repo.AtualizarAsync(forma);

    public Task ExcluirAsync(Guid id) => _repo.ExcluirAsync(id);
}
