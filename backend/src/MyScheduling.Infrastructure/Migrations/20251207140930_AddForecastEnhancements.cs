using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddForecastEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "default_pto_days_per_month",
                table: "tenant_settings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "exclude_saturdays",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "exclude_sundays",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "fiscal_year_prefix",
                table: "tenant_settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "standard_hours_per_day",
                table: "tenant_settings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "cost_rate_import_batches",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    file_type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    total_records = table.Column<int>(type: "integer", nullable: false),
                    success_count = table.Column<int>(type: "integer", nullable: false),
                    error_count = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    error_details = table.Column<string>(type: "text", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cost_rate_import_batches", x => x.id);
                    table.ForeignKey(
                        name: "fk_cost_rate_import_batches__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "non_labor_cost_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    category = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_non_labor_cost_types", x => x.id);
                    table.ForeignKey(
                        name: "fk_non_labor_cost_types__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "employee_cost_rates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    effective_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    loaded_cost_rate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    source = table.Column<int>(type: "integer", nullable: false),
                    import_batch_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employee_cost_rates", x => x.id);
                    table.ForeignKey(
                        name: "fk_employee_cost_rates__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_employee_cost_rates__users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_employee_cost_rates_cost_rate_import_batches_import_batch_id",
                        column: x => x.import_batch_id,
                        principalTable: "cost_rate_import_batches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "actual_non_labor_costs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    non_labor_cost_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    wbs_element_id = table.Column<Guid>(type: "uuid", nullable: true),
                    year = table.Column<int>(type: "integer", nullable: false),
                    month = table.Column<int>(type: "integer", nullable: false),
                    actual_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    source = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_actual_non_labor_costs", x => x.id);
                    table.ForeignKey(
                        name: "fk_actual_non_labor_costs__non_labor_cost_types_non_labor_cost_typ~",
                        column: x => x.non_labor_cost_type_id,
                        principalTable: "non_labor_cost_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_actual_non_labor_costs__projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_actual_non_labor_costs__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_actual_non_labor_costs__wbs_elements_wbs_element_id",
                        column: x => x.wbs_element_id,
                        principalTable: "wbs_elements",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "non_labor_budget_lines",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_budget_id = table.Column<Guid>(type: "uuid", nullable: false),
                    non_labor_cost_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    wbs_element_id = table.Column<Guid>(type: "uuid", nullable: true),
                    year = table.Column<int>(type: "integer", nullable: false),
                    month = table.Column<int>(type: "integer", nullable: false),
                    budgeted_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_non_labor_budget_lines", x => x.id);
                    table.ForeignKey(
                        name: "fk_non_labor_budget_lines__non_labor_cost_types_non_labor_cost_typ~",
                        column: x => x.non_labor_cost_type_id,
                        principalTable: "non_labor_cost_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_non_labor_budget_lines__project_budgets_project_budget_id",
                        column: x => x.project_budget_id,
                        principalTable: "project_budgets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_non_labor_budget_lines__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_non_labor_budget_lines__wbs_elements_wbs_element_id",
                        column: x => x.wbs_element_id,
                        principalTable: "wbs_elements",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "non_labor_forecasts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    wbs_element_id = table.Column<Guid>(type: "uuid", nullable: true),
                    non_labor_cost_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    forecast_version_id = table.Column<Guid>(type: "uuid", nullable: true),
                    year = table.Column<int>(type: "integer", nullable: false),
                    month = table.Column<int>(type: "integer", nullable: false),
                    forecasted_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    submitted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_non_labor_forecasts", x => x.id);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts__projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts__users_approved_by_user_id",
                        column: x => x.approved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts__users_submitted_by_user_id",
                        column: x => x.submitted_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts__wbs_elements_wbs_element_id",
                        column: x => x.wbs_element_id,
                        principalTable: "wbs_elements",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts_forecast_versions_forecast_version_id",
                        column: x => x.forecast_version_id,
                        principalTable: "forecast_versions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_non_labor_forecasts_non_labor_cost_types_non_labor_cost_typ~",
                        column: x => x.non_labor_cost_type_id,
                        principalTable: "non_labor_cost_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_actual_non_labor_costs_non_labor_cost_type_id",
                table: "actual_non_labor_costs",
                column: "non_labor_cost_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_actual_non_labor_costs_project_id",
                table: "actual_non_labor_costs",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_actual_non_labor_costs_tenant_id_project_id_year_month",
                table: "actual_non_labor_costs",
                columns: new[] { "tenant_id", "project_id", "year", "month" });

            migrationBuilder.CreateIndex(
                name: "ix_actual_non_labor_costs_wbs_element_id",
                table: "actual_non_labor_costs",
                column: "wbs_element_id");

            migrationBuilder.CreateIndex(
                name: "ix_cost_rate_import_batches_tenant_id_created_at",
                table: "cost_rate_import_batches",
                columns: new[] { "tenant_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_employee_cost_rates_import_batch_id",
                table: "employee_cost_rates",
                column: "import_batch_id");

            migrationBuilder.CreateIndex(
                name: "ix_employee_cost_rates_tenant_id_effective_date",
                table: "employee_cost_rates",
                columns: new[] { "tenant_id", "effective_date" });

            migrationBuilder.CreateIndex(
                name: "ix_employee_cost_rates_tenant_id_user_id_effective_date",
                table: "employee_cost_rates",
                columns: new[] { "tenant_id", "user_id", "effective_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_employee_cost_rates_user_id_effective_date",
                table: "employee_cost_rates",
                columns: new[] { "user_id", "effective_date" });

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_budget_lines_non_labor_cost_type_id",
                table: "non_labor_budget_lines",
                column: "non_labor_cost_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_budget_lines_project_budget_id",
                table: "non_labor_budget_lines",
                column: "project_budget_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_budget_lines_tenant_id_project_budget_id_year_mon~",
                table: "non_labor_budget_lines",
                columns: new[] { "tenant_id", "project_budget_id", "year", "month" });

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_budget_lines_wbs_element_id",
                table: "non_labor_budget_lines",
                column: "wbs_element_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_cost_types_tenant_id_code",
                table: "non_labor_cost_types",
                columns: new[] { "tenant_id", "code" });

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_cost_types_tenant_id_is_active_sort_order",
                table: "non_labor_cost_types",
                columns: new[] { "tenant_id", "is_active", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_approved_by_user_id",
                table: "non_labor_forecasts",
                column: "approved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_forecast_version_id",
                table: "non_labor_forecasts",
                column: "forecast_version_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_non_labor_cost_type_id",
                table: "non_labor_forecasts",
                column: "non_labor_cost_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_project_id_non_labor_cost_type_id_year_~",
                table: "non_labor_forecasts",
                columns: new[] { "project_id", "non_labor_cost_type_id", "year", "month" });

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_submitted_by_user_id",
                table: "non_labor_forecasts",
                column: "submitted_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_tenant_id_project_id_year_month",
                table: "non_labor_forecasts",
                columns: new[] { "tenant_id", "project_id", "year", "month" });

            migrationBuilder.CreateIndex(
                name: "ix_non_labor_forecasts_wbs_element_id",
                table: "non_labor_forecasts",
                column: "wbs_element_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "actual_non_labor_costs");

            migrationBuilder.DropTable(
                name: "employee_cost_rates");

            migrationBuilder.DropTable(
                name: "non_labor_budget_lines");

            migrationBuilder.DropTable(
                name: "non_labor_forecasts");

            migrationBuilder.DropTable(
                name: "cost_rate_import_batches");

            migrationBuilder.DropTable(
                name: "non_labor_cost_types");

            migrationBuilder.DropColumn(
                name: "default_pto_days_per_month",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "exclude_saturdays",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "exclude_sundays",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "fiscal_year_prefix",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "standard_hours_per_day",
                table: "tenant_settings");
        }
    }
}
