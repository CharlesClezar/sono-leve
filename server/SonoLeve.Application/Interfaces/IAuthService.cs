using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IAuthService
{
    Task<(Usuario usuario, string token)> LoginAsync(string email, string senha);
    string GerarToken(Usuario usuario);
}
