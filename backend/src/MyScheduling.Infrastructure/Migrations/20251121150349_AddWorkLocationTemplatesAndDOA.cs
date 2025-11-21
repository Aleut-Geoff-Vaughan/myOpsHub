using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkLocationTemplatesAndDOA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "doaactivation_id",
                table: "work_location_preferences",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "delegation_of_authority_letters",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    delegator_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    designee_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    letter_content = table.Column<string>(type: "text", nullable: false),
                    effective_start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    effective_end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_financial_authority = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_operational_authority = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_delegation_of_authority_letters", x => x.id);
                    table.ForeignKey(
                        name: "fk_delegation_of_authority_letters__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_delegation_of_authority_letters__users_delegator_user_id",
                        column: x => x.delegator_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_delegation_of_authority_letters__users_designee_user_id",
                        column: x => x.designee_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "work_location_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    type = table.Column<int>(type: "integer", nullable: false),
                    is_shared = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_work_location_templates", x => x.id);
                    table.ForeignKey(
                        name: "fk_work_location_templates_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_work_location_templates_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "digital_signatures",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    doaletter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    signer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<int>(type: "integer", nullable: false),
                    signature_data = table.Column<string>(type: "text", nullable: false),
                    signed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    user_agent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    is_verified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_digital_signatures", x => x.id);
                    table.ForeignKey(
                        name: "fk_digital_signatures__users_signer_user_id",
                        column: x => x.signer_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_digital_signatures_delegation_of_authority_letters_doalette~",
                        column: x => x.doaletter_id,
                        principalTable: "delegation_of_authority_letters",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "doaactivations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    doaletter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    deactivated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deactivated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doaactivations", x => x.id);
                    table.ForeignKey(
                        name: "fk_doaactivations__delegation_of_authority_letters_doaletter_id",
                        column: x => x.doaletter_id,
                        principalTable: "delegation_of_authority_letters",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_doaactivations__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "work_location_template_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_offset = table.Column<int>(type: "integer", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: true),
                    location_type = table.Column<int>(type: "integer", nullable: false),
                    office_id = table.Column<Guid>(type: "uuid", nullable: true),
                    remote_location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_work_location_template_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_work_location_template_items_offices_office_id",
                        column: x => x.office_id,
                        principalTable: "offices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_work_location_template_items_work_location_templates_templa~",
                        column: x => x.template_id,
                        principalTable: "work_location_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_work_location_preferences_doaactivation_id",
                table: "work_location_preferences",
                column: "doaactivation_id");

            migrationBuilder.CreateIndex(
                name: "ix_delegation_of_authority_letters_delegator_user_id",
                table: "delegation_of_authority_letters",
                column: "delegator_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_delegation_of_authority_letters_designee_user_id",
                table: "delegation_of_authority_letters",
                column: "designee_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_delegation_of_authority_letters_status_effective_start_date~",
                table: "delegation_of_authority_letters",
                columns: new[] { "status", "effective_start_date", "effective_end_date" });

            migrationBuilder.CreateIndex(
                name: "ix_delegation_of_authority_letters_tenant_id_delegator_user_id~",
                table: "delegation_of_authority_letters",
                columns: new[] { "tenant_id", "delegator_user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_delegation_of_authority_letters_tenant_id_designee_user_id_~",
                table: "delegation_of_authority_letters",
                columns: new[] { "tenant_id", "designee_user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_digital_signatures_doaletter_id_role",
                table: "digital_signatures",
                columns: new[] { "doaletter_id", "role" });

            migrationBuilder.CreateIndex(
                name: "ix_digital_signatures_signer_user_id",
                table: "digital_signatures",
                column: "signer_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_doaactivations_doaletter_id",
                table: "doaactivations",
                column: "doaletter_id");

            migrationBuilder.CreateIndex(
                name: "ix_doaactivations_start_date_end_date",
                table: "doaactivations",
                columns: new[] { "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "ix_doaactivations_tenant_id_doaletter_id_is_active",
                table: "doaactivations",
                columns: new[] { "tenant_id", "doaletter_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_work_location_template_items_office_id",
                table: "work_location_template_items",
                column: "office_id");

            migrationBuilder.CreateIndex(
                name: "ix_work_location_template_items_template_id_day_offset",
                table: "work_location_template_items",
                columns: new[] { "template_id", "day_offset" });

            migrationBuilder.CreateIndex(
                name: "ix_work_location_templates_tenant_id_user_id_is_shared",
                table: "work_location_templates",
                columns: new[] { "tenant_id", "user_id", "is_shared" });

            migrationBuilder.CreateIndex(
                name: "ix_work_location_templates_type",
                table: "work_location_templates",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "ix_work_location_templates_user_id",
                table: "work_location_templates",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_work_location_preferences_doaactivations_doaactivation_id",
                table: "work_location_preferences",
                column: "doaactivation_id",
                principalTable: "doaactivations",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_work_location_preferences_doaactivations_doaactivation_id",
                table: "work_location_preferences");

            migrationBuilder.DropTable(
                name: "digital_signatures");

            migrationBuilder.DropTable(
                name: "doaactivations");

            migrationBuilder.DropTable(
                name: "work_location_template_items");

            migrationBuilder.DropTable(
                name: "delegation_of_authority_letters");

            migrationBuilder.DropTable(
                name: "work_location_templates");

            migrationBuilder.DropIndex(
                name: "ix_work_location_preferences_doaactivation_id",
                table: "work_location_preferences");

            migrationBuilder.DropColumn(
                name: "doaactivation_id",
                table: "work_location_preferences");
        }
    }
}
