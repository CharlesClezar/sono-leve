using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
                .WithHeaders("Content-Type", "Authorization", "Idempotency-Key")
                .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")));

// Rate limiting: 200 req/min por IP
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Repositories
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();
builder.Services.AddScoped<IVendaRepository, VendaRepository>();
builder.Services.AddScoped<IEncomendaRepository, EncomendaRepository>();
builder.Services.AddScoped<IFichaRepository, FichaRepository>();
builder.Services.AddScoped<IContaRepository, ContaRepository>();
builder.Services.AddScoped<IFormaPagamentoRepository, FormaPagamentoRepository>();
builder.Services.AddScoped<IBandeiraCartaoRepository, BandeiraCartaoRepository>();
builder.Services.AddScoped<IConfiguracaoTaxaCartaoRepository, ConfiguracaoTaxaCartaoRepository>();

// Services
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IVendaService, VendaService>();
builder.Services.AddScoped<IEncomendaService, EncomendaService>();
builder.Services.AddScoped<IFichaService, FichaService>();
builder.Services.AddScoped<IContaService, ContaService>();
builder.Services.AddScoped<IFormaPagamentoService, FormaPagamentoService>();
builder.Services.AddScoped<IBandeiraCartaoService, BandeiraCartaoService>();
builder.Services.AddScoped<IConfiguracaoTaxaCartaoService, ConfiguracaoTaxaCartaoService>();

var app = builder.Build();

// Handler global: impede stack trace vazar em produção
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(err => err.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Ocorreu um erro interno." });
    }));
}

// Aplicar migrations pendentes na inicialização
using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<SonoLeveDbContext>();
    db.Database.Migrate();
}

app.UseRateLimiter();
app.UseCors();
app.UseStaticFiles();
app.MapControllers();
app.Run();
