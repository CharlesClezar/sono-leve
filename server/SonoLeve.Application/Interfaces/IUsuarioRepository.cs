using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> BuscarPorEmailAsync(string email);
}
