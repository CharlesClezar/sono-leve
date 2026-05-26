using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarTaxaContaEContaManual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Descricao",
                table: "Contas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EhManual",
                table: "Contas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "NumeroParcelas",
                table: "Contas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PercentualTaxaCartao",
                table: "Contas",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxaFixaCartao",
                table: "Contas",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorTaxaCartao",
                table: "Contas",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VendaId",
                table: "Contas",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contas_VendaId",
                table: "Contas",
                column: "VendaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contas_Vendas_VendaId",
                table: "Contas",
                column: "VendaId",
                principalTable: "Vendas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contas_Vendas_VendaId",
                table: "Contas");

            migrationBuilder.DropIndex(
                name: "IX_Contas_VendaId",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "Descricao",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "EhManual",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "NumeroParcelas",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "PercentualTaxaCartao",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "TaxaFixaCartao",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "ValorTaxaCartao",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "VendaId",
                table: "Contas");
        }
    }
}
