using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SonoLeve.Api.Filters;
using SonoLeve.Application.Interfaces;
using SonoLeve.Application.Services;
using SonoLeve.Infra.Data;
using SonoLeve.Infra.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IdempotencyFilter>();
builder.Services.AddScoped<IIdempotencyService, SonoLeve.Infra.Repositories.IdempotencyService>();

builder.Services.AddControllers(opcoes =>
    opcoes.Filters.Add(new ServiceFilterAttribute(typeof(IdempotencyFilter))));

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
                .AllowAnyMethod()));

// Repositories
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();
builder.Services.AddScoped<IVendaRepository, VendaRepository>();
builder.Services.AddScoped<IEncomendaRepository, EncomendaRepository>();
builder.Services.AddScoped<IFichaRepository, FichaRepository>();
builder.Services.AddScoped<IContaRepository, ContaRepository>();
builder.Services.AddScoped<IFormaPagamentoRepository, FormaPagamentoRepository>();

// Services
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IVendaService, VendaService>();
builder.Services.AddScoped<IEncomendaService, EncomendaService>();
builder.Services.AddScoped<IFichaService, FichaService>();
builder.Services.AddScoped<IContaService, ContaService>();
builder.Services.AddScoped<IFormaPagamentoService, FormaPagamentoService>();

var app = builder.Build();

// Aplicar migrations e seed de desenvolvimento
using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<SonoLeveDbContext>();
    db.Database.Migrate();

    if (app.Environment.IsDevelopment())
        await DataSeeder.SeedAsync(db);
}

app.UseCors();
app.UseStaticFiles();
app.MapControllers();
app.Run();
