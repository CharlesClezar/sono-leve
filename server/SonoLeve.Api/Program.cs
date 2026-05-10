using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SonoLeve.Infra.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// EF Core + PostgreSQL
builder.Services.AddDbContext<SonoLeveDbContext>(opcoes =>
    opcoes.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// CORS
var origensPermitidas = builder.Configuration["Cors:Origens"]?.Split(",")
    ?? ["http://localhost:3000"];

builder.Services.AddCors(opcoes =>
    opcoes.AddDefaultPolicy(politica =>
        politica.WithOrigins(origensPermitidas)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()));

// JWT
var segredoJwt = builder.Configuration["Jwt:Segredo"]
    ?? throw new InvalidOperationException("Jwt:Segredo não configurado.");

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

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

var app = builder.Build();

// Aplicar migrations automaticamente na inicialização
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
