using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SonoLeve.Infra.Data;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    [DbContext(typeof(SonoLeveDbContext))]
    [Migration("20260519000000_AdicionarIndicesPerformance")]
    public partial class AdicionarIndicesPerformance : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Vendas: filtro por período e por status
            migrationBuilder.CreateIndex("IX_Vendas_Data",   "Vendas", "Data");
            migrationBuilder.CreateIndex("IX_Vendas_Status", "Vendas", "Status");

            // Encomendas: filtro por status e ordenação/filtro por previsão de entrega
            migrationBuilder.CreateIndex("IX_Encomendas_Status",   "Encomendas", "Status");
            migrationBuilder.CreateIndex("IX_Encomendas_Previsao", "Encomendas", "Previsao");

            // Fichas: filtro por status e ordenação por data de abertura
            migrationBuilder.CreateIndex("IX_Fichas_Status",      "Fichas", "Status");
            migrationBuilder.CreateIndex("IX_Fichas_DataAbertura", "Fichas", "DataAbertura");

            // Contas: filtro por status e ordenação por vencimento
            migrationBuilder.CreateIndex("IX_Contas_Status",    "Contas", "Status");
            migrationBuilder.CreateIndex("IX_Contas_Vencimento", "Contas", "Vencimento");

            // Produtos: filtro por ativo e busca por referência
            migrationBuilder.CreateIndex("IX_Produtos_Ativo", "Produtos", "Ativo");
            migrationBuilder.CreateIndex("IX_Produtos_Ref",   "Produtos", "Ref");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex("IX_Vendas_Data",   "Vendas");
            migrationBuilder.DropIndex("IX_Vendas_Status", "Vendas");

            migrationBuilder.DropIndex("IX_Encomendas_Status",   "Encomendas");
            migrationBuilder.DropIndex("IX_Encomendas_Previsao", "Encomendas");

            migrationBuilder.DropIndex("IX_Fichas_Status",      "Fichas");
            migrationBuilder.DropIndex("IX_Fichas_DataAbertura", "Fichas");

            migrationBuilder.DropIndex("IX_Contas_Status",    "Contas");
            migrationBuilder.DropIndex("IX_Contas_Vencimento", "Contas");

            migrationBuilder.DropIndex("IX_Produtos_Ativo", "Produtos");
            migrationBuilder.DropIndex("IX_Produtos_Ref",   "Produtos");
        }
    }
}
