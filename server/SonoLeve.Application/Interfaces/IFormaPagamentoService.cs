using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IFormaPagamentoService
{
    Task<IEnumerable<FormaPagamento>> ListarAsync();
    Task<FormaPagamento> ObterPorIdAsync(Guid id);
    Task<FormaPagamento> CriarAsync(FormaPagamento forma);
    Task<FormaPagamento> AtualizarAsync(FormaPagamento forma);
    Task ExcluirAsync(Guid id);
}
