using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IFichaRepository
{
    Task<(IEnumerable<Ficha> items, int total)> ListarAsync(int pagina, int tamanhoPagina);
    Task<Ficha> ObterPorIdAsync(Guid id);
    Task<Ficha> CriarAsync(Ficha ficha);
    Task<Ficha> AtualizarAsync(Ficha ficha);
}
