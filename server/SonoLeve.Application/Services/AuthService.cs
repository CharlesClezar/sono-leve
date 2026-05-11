using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;

namespace SonoLeve.Application.Services;

public class JwtOpcoes
{
    public string Segredo { get; set; } = "";
    public int ExpiracaoMinutos { get; set; } = 15;
}

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly JwtOpcoes _jwt;

    public AuthService(IUsuarioRepository usuarioRepository, IOptions<JwtOpcoes> jwt)
    {
        _usuarioRepository = usuarioRepository;
        _jwt = jwt.Value;
    }

    public async Task<(Usuario usuario, string token)> LoginAsync(string email, string senha)
    {
        var usuario = await _usuarioRepository.BuscarPorEmailAsync(email)
            ?? throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (!usuario.Ativo || !BCrypt.Net.BCrypt.Verify(senha, usuario.SenhaHash))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        return (usuario, GerarToken(usuario));
    }

    public string GerarToken(Usuario usuario)
    {
        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Segredo));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(JwtRegisteredClaimNames.Name, usuario.Nome),
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiracaoMinutos),
            signingCredentials: new SigningCredentials(chave, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
