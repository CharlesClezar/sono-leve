using Microsoft.AspNetCore.Mvc;
using SonoLeve.Api.DTOs;
using SonoLeve.Application.Interfaces;

namespace SonoLeve.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var (usuario, token) = await _authService.LoginAsync(request.Email, request.Senha);
            return Ok(new LoginResponse(token, new UsuarioResponse(usuario.Id, usuario.Nome, usuario.Email)));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout() => NoContent();
}
