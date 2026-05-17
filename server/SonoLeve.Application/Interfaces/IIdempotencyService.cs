using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Interfaces;

public interface IIdempotencyService
{
    Task<IdempotencyRecord?> ObterAsync(string key);
    Task SalvarAsync(IdempotencyRecord registro);
}
