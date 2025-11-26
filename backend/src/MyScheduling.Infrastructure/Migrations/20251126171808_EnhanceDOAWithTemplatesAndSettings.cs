using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceDOAWithTemplatesAndSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "signature_type",
                table: "digital_signatures",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "typed_signature",
                table: "digital_signatures",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subject_line",
                table: "delegation_of_authority_letters",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "doatemplates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    letter_content = table.Column<string>(type: "text", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doatemplates", x => x.id);
                    table.ForeignKey(
                        name: "fk_doatemplates__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tenant_settings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    logo_url = table.Column<string>(type: "text", nullable: true),
                    logo_file_name = table.Column<string>(type: "text", nullable: true),
                    logo_width = table.Column<int>(type: "integer", nullable: true),
                    logo_height = table.Column<int>(type: "integer", nullable: true),
                    doaprint_header_content = table.Column<string>(type: "text", nullable: true),
                    doaprint_footer_content = table.Column<string>(type: "text", nullable: true),
                    doaprint_letterhead = table.Column<string>(type: "text", nullable: true),
                    company_name = table.Column<string>(type: "text", nullable: true),
                    company_address = table.Column<string>(type: "text", nullable: true),
                    company_phone = table.Column<string>(type: "text", nullable: true),
                    company_email = table.Column<string>(type: "text", nullable: true),
                    company_website = table.Column<string>(type: "text", nullable: true),
                    primary_color = table.Column<string>(type: "text", nullable: true),
                    secondary_color = table.Column<string>(type: "text", nullable: true),
                    font_family = table.Column<string>(type: "text", nullable: true),
                    font_size = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tenant_settings", x => x.id);
                    table.ForeignKey(
                        name: "fk_tenant_settings_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_doatemplates_tenant_id",
                table: "doatemplates",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_tenant_settings_tenant_id",
                table: "tenant_settings",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "doatemplates");

            migrationBuilder.DropTable(
                name: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "signature_type",
                table: "digital_signatures");

            migrationBuilder.DropColumn(
                name: "typed_signature",
                table: "digital_signatures");

            migrationBuilder.DropColumn(
                name: "subject_line",
                table: "delegation_of_authority_letters");
        }
    }
}
