using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStackTraceFromAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StackTrace",
                table: "AuditLog");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StackTrace",
                table: "AuditLog",
                type: "text",
                nullable: true);
        }
    }
}
