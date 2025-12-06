using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDOAActivations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_work_location_preferences_doaactivations_doaactivation_id",
                table: "work_location_preferences");

            migrationBuilder.DropTable(
                name: "doaactivations");

            migrationBuilder.DropIndex(
                name: "ix_work_location_preferences_doaactivation_id",
                table: "work_location_preferences");

            migrationBuilder.DropColumn(
                name: "doaactivation_id",
                table: "work_location_preferences");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "doaactivation_id",
                table: "work_location_preferences",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "doaactivations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    doaletter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deactivated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deactivated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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

            migrationBuilder.CreateIndex(
                name: "ix_work_location_preferences_doaactivation_id",
                table: "work_location_preferences",
                column: "doaactivation_id");

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

            migrationBuilder.AddForeignKey(
                name: "fk_work_location_preferences_doaactivations_doaactivation_id",
                table: "work_location_preferences",
                column: "doaactivation_id",
                principalTable: "doaactivations",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
