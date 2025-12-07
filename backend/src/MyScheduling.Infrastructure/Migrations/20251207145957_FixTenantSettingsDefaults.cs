using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixTenantSettingsDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix default values for existing tenant_settings records
            migrationBuilder.Sql(@"
                UPDATE tenant_settings
                SET default_pto_days_per_month = 1.5,
                    standard_hours_per_day = 8.0,
                    exclude_saturdays = true,
                    exclude_sundays = true,
                    fiscal_year_prefix = 'FY'
                WHERE default_pto_days_per_month = 0
                   OR fiscal_year_prefix = ''
                   OR fiscal_year_prefix IS NULL;
            ");

            migrationBuilder.AddColumn<DateTime>(
                name: "imported_at",
                table: "cost_rate_import_batches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "imported_by_user_id",
                table: "cost_rate_import_batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_cost_rate_import_batches_imported_by_user_id",
                table: "cost_rate_import_batches",
                column: "imported_by_user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_cost_rate_import_batches__users_imported_by_user_id",
                table: "cost_rate_import_batches",
                column: "imported_by_user_id",
                principalTable: "users",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_cost_rate_import_batches__users_imported_by_user_id",
                table: "cost_rate_import_batches");

            migrationBuilder.DropIndex(
                name: "ix_cost_rate_import_batches_imported_by_user_id",
                table: "cost_rate_import_batches");

            migrationBuilder.DropColumn(
                name: "imported_at",
                table: "cost_rate_import_batches");

            migrationBuilder.DropColumn(
                name: "imported_by_user_id",
                table: "cost_rate_import_batches");
        }
    }
}
