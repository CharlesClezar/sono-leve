using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AddBandeiraParcelasToVenda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BandeiraId",
                table: "Venda",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumeroParcelas",
                table: "Venda",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BandeiraId",
                table: "Venda");

            migrationBuilder.DropColumn(
                name: "NumeroParcelas",
                table: "Venda");
        }
    }
}
