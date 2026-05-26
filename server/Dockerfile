# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY NuGet.Config ./
COPY SonoLeve.Domain/SonoLeve.Domain.csproj SonoLeve.Domain/
COPY SonoLeve.Application/SonoLeve.Application.csproj SonoLeve.Application/
COPY SonoLeve.Infra/SonoLeve.Infra.csproj SonoLeve.Infra/
COPY SonoLeve.Api/SonoLeve.Api.csproj SonoLeve.Api/

RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet restore SonoLeve.Api/SonoLeve.Api.csproj

COPY . .
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet publish SonoLeve.Api/SonoLeve.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SonoLeve.Api.dll"]
