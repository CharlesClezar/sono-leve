using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarFKsRelacionamentos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cliente",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "Pagamento",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Colecao",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Marca",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Modelo",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Subtipo",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Produto",
                table: "ItensVenda");

            migrationBuilder.DropColumn(
                name: "Ref",
                table: "ItensVenda");

            migrationBuilder.DropColumn(
                name: "Produto",
                table: "ItensEncomenda");

            migrationBuilder.DropColumn(
                name: "Ref",
                table: "ItensEncomenda");

            migrationBuilder.DropColumn(
                name: "Revendedora",
                table: "Fichas");

            migrationBuilder.DropColumn(
                name: "Cliente",
                table: "Encomendas");

            migrationBuilder.DropColumn(
                name: "Cliente",
                table: "Contas");

            migrationBuilder.AddColumn<Guid>(
                name: "ClienteId",
                table: "Vendas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "FormaPagamentoId",
                table: "Vendas",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CategoriaId",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ColecaoId",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MarcaId",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeloId",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SubtipoId",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TipoId",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProdutoId",
                table: "ItensVenda",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ProdutoId",
                table: "ItensEncomenda",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClienteId",
                table: "Fichas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClienteId",
                table: "Encomendas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClienteId",
                table: "Contas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Vendas_ClienteId",
                table: "Vendas",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Vendas_FormaPagamentoId",
                table: "Vendas",
                column: "FormaPagamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_CategoriaId",
                table: "Produtos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_ColecaoId",
                table: "Produtos",
                column: "ColecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_MarcaId",
                table: "Produtos",
                column: "MarcaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_ModeloId",
                table: "Produtos",
                column: "ModeloId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_SubtipoId",
                table: "Produtos",
                column: "SubtipoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_TipoId",
                table: "Produtos",
                column: "TipoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensVenda_ProdutoId",
                table: "ItensVenda",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensVenda_VendaId",
                table: "ItensVenda",
                column: "VendaId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensEncomenda_EncomendaId",
                table: "ItensEncomenda",
                column: "EncomendaId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensEncomenda_ProdutoId",
                table: "ItensEncomenda",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_Fichas_ClienteId",
                table: "Fichas",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Encomendas_ClienteId",
                table: "Encomendas",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Contas_ClienteId",
                table: "Contas",
                column: "ClienteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contas_Clientes_ClienteId",
                table: "Contas",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Encomendas_Clientes_ClienteId",
                table: "Encomendas",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Fichas_Clientes_ClienteId",
                table: "Fichas",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ItensEncomenda_Encomendas_EncomendaId",
                table: "ItensEncomenda",
                column: "EncomendaId",
                principalTable: "Encomendas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ItensEncomenda_Produtos_ProdutoId",
                table: "ItensEncomenda",
                column: "ProdutoId",
                principalTable: "Produtos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ItensVenda_Produtos_ProdutoId",
                table: "ItensVenda",
                column: "ProdutoId",
                principalTable: "Produtos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ItensVenda_Vendas_VendaId",
                table: "ItensVenda",
                column: "VendaId",
                principalTable: "Vendas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_CatalogoColecoes_ColecaoId",
                table: "Produtos",
                column: "ColecaoId",
                principalTable: "CatalogoColecoes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_CatalogoMarcas_MarcaId",
                table: "Produtos",
                column: "MarcaId",
                principalTable: "CatalogoMarcas",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_CatalogoModelos_ModeloId",
                table: "Produtos",
                column: "ModeloId",
                principalTable: "CatalogoModelos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_CatalogoSubtipos_SubtipoId",
                table: "Produtos",
                column: "SubtipoId",
                principalTable: "CatalogoSubtipos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_CatalogoTipos_TipoId",
                table: "Produtos",
                column: "TipoId",
                principalTable: "CatalogoTipos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_CategoriasBase_CategoriaId",
                table: "Produtos",
                column: "CategoriaId",
                principalTable: "CategoriasBase",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vendas_Clientes_ClienteId",
                table: "Vendas",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vendas_FormasPagamento_FormaPagamentoId",
                table: "Vendas",
                column: "FormaPagamentoId",
                principalTable: "FormasPagamento",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contas_Clientes_ClienteId",
                table: "Contas");

            migrationBuilder.DropForeignKey(
                name: "FK_Encomendas_Clientes_ClienteId",
                table: "Encomendas");

            migrationBuilder.DropForeignKey(
                name: "FK_Fichas_Clientes_ClienteId",
                table: "Fichas");

            migrationBuilder.DropForeignKey(
                name: "FK_ItensEncomenda_Encomendas_EncomendaId",
                table: "ItensEncomenda");

            migrationBuilder.DropForeignKey(
                name: "FK_ItensEncomenda_Produtos_ProdutoId",
                table: "ItensEncomenda");

            migrationBuilder.DropForeignKey(
                name: "FK_ItensVenda_Produtos_ProdutoId",
                table: "ItensVenda");

            migrationBuilder.DropForeignKey(
                name: "FK_ItensVenda_Vendas_VendaId",
                table: "ItensVenda");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_CatalogoColecoes_ColecaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_CatalogoMarcas_MarcaId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_CatalogoModelos_ModeloId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_CatalogoSubtipos_SubtipoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_CatalogoTipos_TipoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_CategoriasBase_CategoriaId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Vendas_Clientes_ClienteId",
                table: "Vendas");

            migrationBuilder.DropForeignKey(
                name: "FK_Vendas_FormasPagamento_FormaPagamentoId",
                table: "Vendas");

            migrationBuilder.DropIndex(
                name: "IX_Vendas_ClienteId",
                table: "Vendas");

            migrationBuilder.DropIndex(
                name: "IX_Vendas_FormaPagamentoId",
                table: "Vendas");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_CategoriaId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_ColecaoId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_MarcaId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_ModeloId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_SubtipoId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_TipoId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_ItensVenda_ProdutoId",
                table: "ItensVenda");

            migrationBuilder.DropIndex(
                name: "IX_ItensVenda_VendaId",
                table: "ItensVenda");

            migrationBuilder.DropIndex(
                name: "IX_ItensEncomenda_EncomendaId",
                table: "ItensEncomenda");

            migrationBuilder.DropIndex(
                name: "IX_ItensEncomenda_ProdutoId",
                table: "ItensEncomenda");

            migrationBuilder.DropIndex(
                name: "IX_Fichas_ClienteId",
                table: "Fichas");

            migrationBuilder.DropIndex(
                name: "IX_Encomendas_ClienteId",
                table: "Encomendas");

            migrationBuilder.DropIndex(
                name: "IX_Contas_ClienteId",
                table: "Contas");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "FormaPagamentoId",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "ColecaoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "MarcaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "ModeloId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "SubtipoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "TipoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "ProdutoId",
                table: "ItensVenda");

            migrationBuilder.DropColumn(
                name: "ProdutoId",
                table: "ItensEncomenda");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Fichas");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Encomendas");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Contas");

            migrationBuilder.AddColumn<string>(
                name: "Cliente",
                table: "Vendas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Pagamento",
                table: "Vendas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Categoria",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Colecao",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Marca",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Modelo",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Subtipo",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Produto",
                table: "ItensVenda",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Ref",
                table: "ItensVenda",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Produto",
                table: "ItensEncomenda",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Ref",
                table: "ItensEncomenda",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Revendedora",
                table: "Fichas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Cliente",
                table: "Encomendas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Cliente",
                table: "Contas",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
