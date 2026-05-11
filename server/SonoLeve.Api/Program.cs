using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SonoLeve.Application.Interfaces;
using SonoLeve.Application.Services;
using SonoLeve.Infra.Data;
using SonoLeve.Infra.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// EF Core + PostgreSQL
builder.Services.AddDbContext<SonoLeveDbContext>(opcoes =>
    opcoes.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// CORS
var origensPermitidas = builder.Configuration["Cors:Origens"]?.Split(",")
    ?? ["http://localhost:3010"];

builder.Services.AddCors(opcoes =>
    opcoes.AddDefaultPolicy(politica =>
        politica.WithOrigins(origensPermitidas)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()));

// JWT
var segredoJwt = builder.Configuration["Jwt:Segredo"]
    ?? throw new InvalidOperationException("Jwt:Segredo não configurado.");

builder.Services.Configure<JwtOpcoes>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opcoes =>
    {
        opcoes.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(segredoJwt)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Repositories
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IClienteService, ClienteService>();

var app = builder.Build();

// Aplicar migrations automaticamente
using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<SonoLeveDbContext>();
    db.Database.Migrate();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
