using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SonoLeve.Infra.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLog",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Entidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntidadeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Acao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DadosAntes = table.Column<string>(type: "text", nullable: true),
                    DadosDepois = table.Column<string>(type: "text", nullable: true),
                    Endpoint = table.Column<string>(type: "text", nullable: true),
                    StackTrace = table.Column<string>(type: "text", nullable: true),
                    OcorridoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLog", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BandeiraCartao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BandeiraCartao", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categoria",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Grade = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categoria", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cliente",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Telefone = table.Column<string>(type: "text", nullable: false),
                    Cpf = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Credito = table.Column<decimal>(type: "numeric", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cliente", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Colecao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: true),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Colecao", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FormaPagamento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    PermiteParcelamento = table.Column<bool>(type: "boolean", nullable: false),
                    ExigeBandeira = table.Column<bool>(type: "boolean", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    RepassaTaxaAoCliente = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormaPagamento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IdempotencyRecord",
                columns: table => new
                {
                    Key = table.Column<string>(type: "text", nullable: false),
                    StatusCode = table.Column<int>(type: "integer", nullable: false),
                    ResponseBody = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdempotencyRecord", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "Marca",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Marca", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Subtipo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subtipo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tipo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tipo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    SenhaHash = table.Column<string>(type: "text", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Encomenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Previsao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Total = table.Column<decimal>(type: "numeric", nullable: false),
                    Entrada = table.Column<decimal>(type: "numeric", nullable: false),
                    Pecas = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Encomenda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Encomenda_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Ficha",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataAbertura = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Enviadas = table.Column<int>(type: "integer", nullable: false),
                    Devolvidas = table.Column<int>(type: "integer", nullable: false),
                    Vendidas = table.Column<int>(type: "integer", nullable: false),
                    TotalVendido = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ficha", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ficha_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracaoTaxaCartao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FormaPagamentoId = table.Column<Guid>(type: "uuid", nullable: false),
                    BandeiraId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoCartao = table.Column<string>(type: "text", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracaoTaxaCartao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfiguracaoTaxaCartao_BandeiraCartao_BandeiraId",
                        column: x => x.BandeiraId,
                        principalTable: "BandeiraCartao",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConfiguracaoTaxaCartao_FormaPagamento_FormaPagamentoId",
                        column: x => x.FormaPagamentoId,
                        principalTable: "FormaPagamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Venda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    FormaPagamentoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Pecas = table.Column<int>(type: "integer", nullable: false),
                    Total = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Origem = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Venda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Venda_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Venda_FormaPagamento_FormaPagamentoId",
                        column: x => x.FormaPagamentoId,
                        principalTable: "FormaPagamento",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Produto",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Ref = table.Column<string>(type: "text", nullable: false),
                    MarcaId = table.Column<Guid>(type: "uuid", nullable: true),
                    TipoId = table.Column<Guid>(type: "uuid", nullable: true),
                    SubtipoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CategoriaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ColecaoId = table.Column<Guid>(type: "uuid", nullable: true),
                    PrecoVarejo = table.Column<decimal>(type: "numeric", nullable: false),
                    PrecoAtacado = table.Column<decimal>(type: "numeric", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    Estoque = table.Column<int>(type: "integer", nullable: false),
                    ImagemUrl = table.Column<string>(type: "text", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Produto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Produto_Categoria_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "Categoria",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Produto_Colecao_ColecaoId",
                        column: x => x.ColecaoId,
                        principalTable: "Colecao",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Produto_Marca_MarcaId",
                        column: x => x.MarcaId,
                        principalTable: "Marca",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Produto_Subtipo_SubtipoId",
                        column: x => x.SubtipoId,
                        principalTable: "Subtipo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Produto_Tipo_TipoId",
                        column: x => x.TipoId,
                        principalTable: "Tipo",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracaoTaxaCartaoParcela",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConfiguracaoTaxaCartaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroParcelas = table.Column<int>(type: "integer", nullable: false),
                    PercentualTaxa = table.Column<decimal>(type: "numeric", nullable: false),
                    PrazoRecebimentoDias = table.Column<int>(type: "integer", nullable: false),
                    TaxaFixa = table.Column<decimal>(type: "numeric", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracaoTaxaCartaoParcela", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfiguracaoTaxaCartaoParcela_ConfiguracaoTaxaCartao_Config~",
                        column: x => x.ConfiguracaoTaxaCartaoId,
                        principalTable: "ConfiguracaoTaxaCartao",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Conta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    EhManual = table.Column<bool>(type: "boolean", nullable: false),
                    Origem = table.Column<string>(type: "text", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    VendaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Total = table.Column<decimal>(type: "numeric", nullable: false),
                    Recebido = table.Column<decimal>(type: "numeric", nullable: false),
                    Vencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    NumeroParcelas = table.Column<int>(type: "integer", nullable: true),
                    PercentualTaxaCartao = table.Column<decimal>(type: "numeric", nullable: true),
                    TaxaFixaCartao = table.Column<decimal>(type: "numeric", nullable: true),
                    ValorTaxaCartao = table.Column<decimal>(type: "numeric", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conta_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Conta_Venda_VendaId",
                        column: x => x.VendaId,
                        principalTable: "Venda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ItemEncomenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EncomendaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProdutoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tamanho = table.Column<string>(type: "text", nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    PrecoUnitario = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemEncomenda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemEncomenda_Encomenda_EncomendaId",
                        column: x => x.EncomendaId,
                        principalTable: "Encomenda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItemEncomenda_Produto_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItemVenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProdutoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tamanho = table.Column<string>(type: "text", nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    PrecoUnitario = table.Column<decimal>(type: "numeric", nullable: false),
                    DescontoPct = table.Column<decimal>(type: "numeric", nullable: true),
                    DescontoVal = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemVenda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemVenda_Produto_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItemVenda_Venda_VendaId",
                        column: x => x.VendaId,
                        principalTable: "Venda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_Entidade",
                table: "AuditLog",
                column: "Entidade");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_OcorridoEm",
                table: "AuditLog",
                column: "OcorridoEm");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracaoTaxaCartao_BandeiraId",
                table: "ConfiguracaoTaxaCartao",
                column: "BandeiraId");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracaoTaxaCartao_FormaPagamentoId",
                table: "ConfiguracaoTaxaCartao",
                column: "FormaPagamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracaoTaxaCartaoParcela_ConfiguracaoTaxaCartaoId",
                table: "ConfiguracaoTaxaCartaoParcela",
                column: "ConfiguracaoTaxaCartaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Conta_ClienteId",
                table: "Conta",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Conta_VendaId",
                table: "Conta",
                column: "VendaId");

            migrationBuilder.CreateIndex(
                name: "IX_Encomenda_ClienteId",
                table: "Encomenda",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Ficha_ClienteId",
                table: "Ficha",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemEncomenda_EncomendaId",
                table: "ItemEncomenda",
                column: "EncomendaId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemEncomenda_ProdutoId",
                table: "ItemEncomenda",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemVenda_ProdutoId",
                table: "ItemVenda",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemVenda_VendaId",
                table: "ItemVenda",
                column: "VendaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produto_CategoriaId",
                table: "Produto",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produto_ColecaoId",
                table: "Produto",
                column: "ColecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produto_MarcaId",
                table: "Produto",
                column: "MarcaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produto_SubtipoId",
                table: "Produto",
                column: "SubtipoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produto_TipoId",
                table: "Produto",
                column: "TipoId");

            migrationBuilder.CreateIndex(
                name: "IX_Venda_ClienteId",
                table: "Venda",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Venda_FormaPagamentoId",
                table: "Venda",
                column: "FormaPagamentoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLog");

            migrationBuilder.DropTable(
                name: "ConfiguracaoTaxaCartaoParcela");

            migrationBuilder.DropTable(
                name: "Conta");

            migrationBuilder.DropTable(
                name: "Ficha");

            migrationBuilder.DropTable(
                name: "IdempotencyRecord");

            migrationBuilder.DropTable(
                name: "ItemEncomenda");

            migrationBuilder.DropTable(
                name: "ItemVenda");

            migrationBuilder.DropTable(
                name: "Usuario");

            migrationBuilder.DropTable(
                name: "ConfiguracaoTaxaCartao");

            migrationBuilder.DropTable(
                name: "Encomenda");

            migrationBuilder.DropTable(
                name: "Produto");

            migrationBuilder.DropTable(
                name: "Venda");

            migrationBuilder.DropTable(
                name: "BandeiraCartao");

            migrationBuilder.DropTable(
                name: "Categoria");

            migrationBuilder.DropTable(
                name: "Colecao");

            migrationBuilder.DropTable(
                name: "Marca");

            migrationBuilder.DropTable(
                name: "Subtipo");

            migrationBuilder.DropTable(
                name: "Tipo");

            migrationBuilder.DropTable(
                name: "Cliente");

            migrationBuilder.DropTable(
                name: "FormaPagamento");
        }
    }
}
