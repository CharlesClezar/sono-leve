using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarRepassaTaxaFormaPagamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RepassaTaxaAoCliente",
                table: "FormasPagamento",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RepassaTaxaAoCliente",
                table: "FormasPagamento");
        }
    }
}
