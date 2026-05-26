using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SonoLeve.Application.Interfaces;
using SonoLeve.Domain.Entities;
using System.Text.Json;

namespace SonoLeve.Api.Filters;

public class IdempotencyFilter : IAsyncActionFilter
{
    private const int HorasExpiracao = 24;

    private readonly IIdempotencyService _service;

    public IdempotencyFilter(IIdempotencyService service) => _service = service;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Aplica apenas a POST (PUT já é naturalmente idempotente)
        if (!HttpMethods.IsPost(context.HttpContext.Request.Method))
        {
            await next();
            return;
        }

        if (!context.HttpContext.Request.Headers.TryGetValue("Idempotency-Key", out var keyValues))
        {
            await next();
            return;
        }

        var key = keyValues.ToString().Trim();
        if (string.IsNullOrEmpty(key) || key.Length > 128)
        {
            await next();
            return;
        }

        var existente = await _service.ObterAsync(key);
        if (existente != null)
        {
            context.Result = new ContentResult
            {
                StatusCode = existente.StatusCode,
                Content = existente.ResponseBody,
                ContentType = existente.ContentType,
            };
            return;
        }

        var executado = await next();

        if (executado.Result is ObjectResult { StatusCode: >= 200 and < 300 } resultado)
        {
            await _service.SalvarAsync(new IdempotencyRecord
            {
                Key = key,
                StatusCode = resultado.StatusCode ?? 200,
                ResponseBody = JsonSerializer.Serialize(resultado.Value),
                ContentType = "application/json",
                ExpiraEm = DateTime.UtcNow.AddHours(HorasExpiracao),
            });
        }
    }
}
