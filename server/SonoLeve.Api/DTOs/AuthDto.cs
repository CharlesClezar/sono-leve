namespace SonoLeve.Api.DTOs;

public record LoginRequest(string Email, string Senha);

public record LoginResponse(string Token, UsuarioResponse Usuario);

public record UsuarioResponse(Guid Id, string Nome, string Email);
