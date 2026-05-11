using Microsoft.EntityFrameworkCore;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using SonoLeve.Infra.Data;

namespace SonoLeve.Infra.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly SonoLeveDbContext _db;

    public UsuarioRepository(SonoLeveDbContext db)
    {
        _db = db;
    }

    public Task<Usuario?> BuscarPorEmailAsync(string email)
        => _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email && u.Ativo);
}
