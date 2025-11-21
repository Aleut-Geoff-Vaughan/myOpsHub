using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyHolidaysAndPTO : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_wbs_change_history__wbs_elements_wbs_element_id",
                table: "wbs_change_history");

            migrationBuilder.DropForeignKey(
                name: "fk_wbs_change_history_users_changed_by_id",
                table: "wbs_change_history");

            migrationBuilder.DropPrimaryKey(
                name: "pk_wbs_change_history",
                table: "wbs_change_history");

            migrationBuilder.DropIndex(
                name: "ix_wbs_change_history_changed_by_id",
                table: "wbs_change_history");

            migrationBuilder.DropColumn(
                name: "changed_by_id",
                table: "wbs_change_history");

            migrationBuilder.RenameTable(
                name: "wbs_change_history",
                newName: "wbs_change_histories");

            migrationBuilder.RenameIndex(
                name: "ix_wbs_change_history_wbs_element_id",
                table: "wbs_change_histories",
                newName: "ix_wbs_change_histories_wbs_element_id");

            migrationBuilder.AlterColumn<string>(
                name: "change_type",
                table: "wbs_change_histories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddPrimaryKey(
                name: "pk_wbs_change_histories",
                table: "wbs_change_histories",
                column: "id");

            migrationBuilder.CreateTable(
                name: "company_holidays",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    holiday_date = table.Column<DateOnly>(type: "date", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    is_recurring = table.Column<bool>(type: "boolean", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_observed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_holidays", x => x.id);
                    table.ForeignKey(
                        name: "fk_company_holidays__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_wbs_change_histories_changed_by_user_id",
                table: "wbs_change_histories",
                column: "changed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_wbs_change_histories_wbs_element_id_changed_at",
                table: "wbs_change_histories",
                columns: new[] { "wbs_element_id", "changed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_company_holidays_tenant_id_holiday_date_type",
                table: "company_holidays",
                columns: new[] { "tenant_id", "holiday_date", "type" });

            migrationBuilder.CreateIndex(
                name: "ix_company_holidays_tenant_id_is_observed",
                table: "company_holidays",
                columns: new[] { "tenant_id", "is_observed" });

            migrationBuilder.AddForeignKey(
                name: "fk_wbs_change_histories__wbs_elements_wbs_element_id",
                table: "wbs_change_histories",
                column: "wbs_element_id",
                principalTable: "wbs_elements",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_wbs_change_histories_users_changed_by_user_id",
                table: "wbs_change_histories",
                column: "changed_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_wbs_change_histories__wbs_elements_wbs_element_id",
                table: "wbs_change_histories");

            migrationBuilder.DropForeignKey(
                name: "fk_wbs_change_histories_users_changed_by_user_id",
                table: "wbs_change_histories");

            migrationBuilder.DropTable(
                name: "company_holidays");

            migrationBuilder.DropPrimaryKey(
                name: "pk_wbs_change_histories",
                table: "wbs_change_histories");

            migrationBuilder.DropIndex(
                name: "ix_wbs_change_histories_changed_by_user_id",
                table: "wbs_change_histories");

            migrationBuilder.DropIndex(
                name: "ix_wbs_change_histories_wbs_element_id_changed_at",
                table: "wbs_change_histories");

            migrationBuilder.RenameTable(
                name: "wbs_change_histories",
                newName: "wbs_change_history");

            migrationBuilder.RenameIndex(
                name: "ix_wbs_change_histories_wbs_element_id",
                table: "wbs_change_history",
                newName: "ix_wbs_change_history_wbs_element_id");

            migrationBuilder.AlterColumn<string>(
                name: "change_type",
                table: "wbs_change_history",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<Guid>(
                name: "changed_by_id",
                table: "wbs_change_history",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "pk_wbs_change_history",
                table: "wbs_change_history",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_wbs_change_history_changed_by_id",
                table: "wbs_change_history",
                column: "changed_by_id");

            migrationBuilder.AddForeignKey(
                name: "fk_wbs_change_history__wbs_elements_wbs_element_id",
                table: "wbs_change_history",
                column: "wbs_element_id",
                principalTable: "wbs_elements",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_wbs_change_history_users_changed_by_id",
                table: "wbs_change_history",
                column: "changed_by_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
