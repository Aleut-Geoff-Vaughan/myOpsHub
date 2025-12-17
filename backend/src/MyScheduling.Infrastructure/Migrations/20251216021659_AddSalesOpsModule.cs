using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesOpsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bidding_entities",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    legal_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    short_name = table.Column<string>(type: "text", nullable: true),
                    duns_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    cage_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    uei_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    tax_id = table.Column<string>(type: "text", nullable: true),
                    is8a = table.Column<bool>(type: "boolean", nullable: false),
                    sba_entry_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sba_expiration_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sba_graduation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_small_business = table.Column<bool>(type: "boolean", nullable: false),
                    is_sdvosb = table.Column<bool>(type: "boolean", nullable: false),
                    is_vosb = table.Column<bool>(type: "boolean", nullable: false),
                    is_wosb = table.Column<bool>(type: "boolean", nullable: false),
                    is_edwosb = table.Column<bool>(type: "boolean", nullable: false),
                    is_hubzone = table.Column<bool>(type: "boolean", nullable: false),
                    is_sdb = table.Column<bool>(type: "boolean", nullable: false),
                    address = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    postal_code = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_bidding_entities", x => x.id);
                    table.ForeignKey(
                        name: "fk_bidding_entities__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "loss_reasons",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_loss_reasons", x => x.id);
                    table.ForeignKey(
                        name: "fk_loss_reasons__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    acronym = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    parent_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    account_type = table.Column<string>(type: "text", nullable: true),
                    federal_department = table.Column<string>(type: "text", nullable: true),
                    portfolio = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    postal_code = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_sales_accounts", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_accounts__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_accounts_sales_accounts_parent_account_id",
                        column: x => x.parent_account_id,
                        principalTable: "sales_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sales_custom_field_definitions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    field_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    field_type = table.Column<int>(type: "integer", nullable: false),
                    picklist_options = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    default_value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    is_searchable = table.Column<bool>(type: "boolean", nullable: false),
                    is_visible_in_list = table.Column<bool>(type: "boolean", nullable: false),
                    section = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    help_text = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    lookup_entity_type = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_sales_custom_field_definitions", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_custom_field_definitions__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_forecast_groups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    code = table.Column<string>(type: "text", nullable: true),
                    group_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    parent_group_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_sales_forecast_groups", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_forecast_groups__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_forecast_groups_sales_forecast_groups_parent_group_id",
                        column: x => x.parent_group_id,
                        principalTable: "sales_forecast_groups",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_stages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    default_probability = table.Column<int>(type: "integer", nullable: false),
                    color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_won_stage = table.Column<bool>(type: "boolean", nullable: false),
                    is_lost_stage = table.Column<bool>(type: "boolean", nullable: false),
                    is_closed_stage = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_sales_stages", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_stages__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contract_vehicles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    contract_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    vehicle_type = table.Column<string>(type: "text", nullable: true),
                    issuing_agency = table.Column<string>(type: "text", nullable: true),
                    award_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expiration_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ceiling_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    awarded_value = table.Column<decimal>(type: "numeric", nullable: true),
                    remaining_value = table.Column<decimal>(type: "numeric", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    eligibility_notes = table.Column<string>(type: "text", nullable: true),
                    bidding_entity_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_contract_vehicles", x => x.id);
                    table.ForeignKey(
                        name: "fk_contract_vehicles__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_contract_vehicles_bidding_entities_bidding_entity_id",
                        column: x => x.bidding_entity_id,
                        principalTable: "bidding_entities",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_contacts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    department = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    mobile_phone = table.Column<string>(type: "text", nullable: true),
                    linked_in_url = table.Column<string>(type: "text", nullable: true),
                    mailing_address = table.Column<string>(type: "text", nullable: true),
                    mailing_city = table.Column<string>(type: "text", nullable: true),
                    mailing_state = table.Column<string>(type: "text", nullable: true),
                    mailing_postal_code = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_sales_contacts", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_contacts__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_contacts_sales_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "sales_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_custom_field_values",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    field_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text_value = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    number_value = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    date_value = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    bool_value = table.Column<bool>(type: "boolean", nullable: true),
                    picklist_value = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    lookup_value = table.Column<Guid>(type: "uuid", nullable: true),
                    sales_custom_field_definition_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_sales_custom_field_values", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_custom_field_values__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_custom_field_values_sales_custom_field_definitions_fi~",
                        column: x => x.field_definition_id,
                        principalTable: "sales_custom_field_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_custom_field_values_sales_custom_field_definitions_sa~",
                        column: x => x.sales_custom_field_definition_id,
                        principalTable: "sales_custom_field_definitions",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_forecast_targets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    forecast_group_id = table.Column<Guid>(type: "uuid", nullable: true),
                    fiscal_year = table.Column<int>(type: "integer", nullable: false),
                    fiscal_quarter = table.Column<int>(type: "integer", nullable: true),
                    fiscal_month = table.Column<int>(type: "integer", nullable: true),
                    target_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    actual_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_sales_forecast_targets", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_forecast_targets__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_forecast_targets_sales_forecast_groups_forecast_group~",
                        column: x => x.forecast_group_id,
                        principalTable: "sales_forecast_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_opportunities",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    opportunity_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    bidding_entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    contract_vehicle_id = table.Column<Guid>(type: "uuid", nullable: true),
                    primary_contact_id = table.Column<Guid>(type: "uuid", nullable: true),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stage_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    growth_type = table.Column<int>(type: "integer", nullable: false),
                    acquisition_type = table.Column<int>(type: "integer", nullable: false),
                    contract_type = table.Column<int>(type: "integer", nullable: false),
                    bid_decision = table.Column<int>(type: "integer", nullable: false),
                    primary_business_line = table.Column<string>(type: "text", nullable: true),
                    capability = table.Column<string>(type: "text", nullable: true),
                    capability_business_line = table.Column<string>(type: "text", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    total_contract_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    probability_percent = table.Column<int>(type: "integer", nullable: false),
                    probability_go_percent = table.Column<int>(type: "integer", nullable: true),
                    target_gross_margin_percent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    target_gross_margin_amount = table.Column<decimal>(type: "numeric", nullable: true),
                    target_operating_income_percent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    target_operating_income_amount = table.Column<decimal>(type: "numeric", nullable: true),
                    included_in_forecast = table.Column<bool>(type: "boolean", nullable: false),
                    revenue_stream = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    close_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    close_fiscal_year = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    close_fiscal_quarter = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    rfi_status = table.Column<int>(type: "integer", nullable: false),
                    planned_rfi_submission_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_rfi_submission_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    planned_rfp_release_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_rfp_release_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    planned_proposal_submission_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_proposal_submission_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    project_start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    project_finish_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    duration_months = table.Column<int>(type: "integer", nullable: true),
                    opportunity_terms = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    solicitation_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    primary_naics_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    costpoint_project_code = table.Column<string>(type: "text", nullable: true),
                    incumbent_contract_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    incumbent = table.Column<string>(type: "text", nullable: true),
                    incumbent_award_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    incumbent_expire_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_direct_award = table.Column<bool>(type: "boolean", nullable: false),
                    is_front_door = table.Column<bool>(type: "boolean", nullable: false),
                    proposal_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    master_contract_id = table.Column<Guid>(type: "uuid", nullable: true),
                    master_contract_title = table.Column<string>(type: "text", nullable: true),
                    place_of_performance = table.Column<string>(type: "text", nullable: true),
                    priority = table.Column<string>(type: "text", nullable: true),
                    next_step = table.Column<string>(type: "text", nullable: true),
                    solution_details = table.Column<string>(type: "text", nullable: true),
                    result = table.Column<int>(type: "integer", nullable: true),
                    loss_reason_id = table.Column<Guid>(type: "uuid", nullable: true),
                    customer_feedback = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    winning_price_tcv = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    winning_competitor = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    lead_source = table.Column<string>(type: "text", nullable: true),
                    gov_win_id = table.Column<string>(type: "text", nullable: true),
                    opportunity_link = table.Column<string>(type: "text", nullable: true),
                    band_pcode = table.Column<string>(type: "text", nullable: true),
                    response_folder = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_sales_opportunities", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_opportunities__sales_stages_stage_id",
                        column: x => x.stage_id,
                        principalTable: "sales_stages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sales_opportunities__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_opportunities__users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sales_opportunities_bidding_entities_bidding_entity_id",
                        column: x => x.bidding_entity_id,
                        principalTable: "bidding_entities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sales_opportunities_contract_vehicles_contract_vehicle_id",
                        column: x => x.contract_vehicle_id,
                        principalTable: "contract_vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sales_opportunities_loss_reasons_loss_reason_id",
                        column: x => x.loss_reason_id,
                        principalTable: "loss_reasons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sales_opportunities_sales_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "sales_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sales_opportunities_sales_contacts_primary_contact_id",
                        column: x => x.primary_contact_id,
                        principalTable: "sales_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "opportunity_capabilities",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    opportunity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    capability_business_line = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    capability = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    parent_capability = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    allocated_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    weighted_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
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
                    table.PrimaryKey("pk_opportunity_capabilities", x => x.id);
                    table.ForeignKey(
                        name: "fk_opportunity_capabilities__sales_opportunities_opportunity_id",
                        column: x => x.opportunity_id,
                        principalTable: "sales_opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_capabilities__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "opportunity_contact_roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    opportunity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    contact_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    sales_contact_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_opportunity_contact_roles", x => x.id);
                    table.ForeignKey(
                        name: "fk_opportunity_contact_roles__sales_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "sales_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_contact_roles__sales_contacts_sales_contact_id",
                        column: x => x.sales_contact_id,
                        principalTable: "sales_contacts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_opportunity_contact_roles__sales_opportunities_opportunity_id",
                        column: x => x.opportunity_id,
                        principalTable: "sales_opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_contact_roles__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "opportunity_field_histories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    opportunity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    field_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    old_value = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    new_value = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("pk_opportunity_field_histories", x => x.id);
                    table.ForeignKey(
                        name: "fk_opportunity_field_histories__sales_opportunities_opportunity_~",
                        column: x => x.opportunity_id,
                        principalTable: "sales_opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_field_histories__users_changed_by_user_id",
                        column: x => x.changed_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "opportunity_notes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    opportunity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    note_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
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
                    table.PrimaryKey("pk_opportunity_notes", x => x.id);
                    table.ForeignKey(
                        name: "fk_opportunity_notes__sales_opportunities_opportunity_id",
                        column: x => x.opportunity_id,
                        principalTable: "sales_opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_notes__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "opportunity_team_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    opportunity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_opportunity_team_members", x => x.id);
                    table.ForeignKey(
                        name: "fk_opportunity_team_members__sales_opportunities_opportunity_id",
                        column: x => x.opportunity_id,
                        principalTable: "sales_opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_team_members__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_opportunity_team_members__users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bidding_entities_tenant_id_is8a",
                table: "bidding_entities",
                columns: new[] { "tenant_id", "is8a" });

            migrationBuilder.CreateIndex(
                name: "ix_bidding_entities_tenant_id_name",
                table: "bidding_entities",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_bidding_entities_tenant_id_sba_expiration_date",
                table: "bidding_entities",
                columns: new[] { "tenant_id", "sba_expiration_date" });

            migrationBuilder.CreateIndex(
                name: "ix_contract_vehicles_bidding_entity_id",
                table: "contract_vehicles",
                column: "bidding_entity_id");

            migrationBuilder.CreateIndex(
                name: "ix_contract_vehicles_tenant_id_expiration_date",
                table: "contract_vehicles",
                columns: new[] { "tenant_id", "expiration_date" });

            migrationBuilder.CreateIndex(
                name: "ix_contract_vehicles_tenant_id_name",
                table: "contract_vehicles",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_loss_reasons_tenant_id_name",
                table: "loss_reasons",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_capabilities_opportunity_id",
                table: "opportunity_capabilities",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_capabilities_tenant_id_opportunity_id",
                table: "opportunity_capabilities",
                columns: new[] { "tenant_id", "opportunity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_contact_roles_contact_id",
                table: "opportunity_contact_roles",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_contact_roles_opportunity_id",
                table: "opportunity_contact_roles",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_contact_roles_sales_contact_id",
                table: "opportunity_contact_roles",
                column: "sales_contact_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_contact_roles_tenant_id_opportunity_id_contact_~",
                table: "opportunity_contact_roles",
                columns: new[] { "tenant_id", "opportunity_id", "contact_id" });

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_field_histories_changed_by_user_id",
                table: "opportunity_field_histories",
                column: "changed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_field_histories_opportunity_id_changed_at",
                table: "opportunity_field_histories",
                columns: new[] { "opportunity_id", "changed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_notes_opportunity_id",
                table: "opportunity_notes",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_notes_tenant_id_opportunity_id",
                table: "opportunity_notes",
                columns: new[] { "tenant_id", "opportunity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_team_members_opportunity_id",
                table: "opportunity_team_members",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_team_members_tenant_id_opportunity_id_user_id",
                table: "opportunity_team_members",
                columns: new[] { "tenant_id", "opportunity_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_opportunity_team_members_user_id",
                table: "opportunity_team_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_accounts_parent_account_id",
                table: "sales_accounts",
                column: "parent_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_accounts_tenant_id_account_type",
                table: "sales_accounts",
                columns: new[] { "tenant_id", "account_type" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_accounts_tenant_id_name",
                table: "sales_accounts",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_contacts_account_id",
                table: "sales_contacts",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_contacts_tenant_id_account_id",
                table: "sales_contacts",
                columns: new[] { "tenant_id", "account_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_contacts_tenant_id_email",
                table: "sales_contacts",
                columns: new[] { "tenant_id", "email" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_custom_field_definitions_tenant_id_entity_type_field_~",
                table: "sales_custom_field_definitions",
                columns: new[] { "tenant_id", "entity_type", "field_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_custom_field_definitions_tenant_id_entity_type_sort_o~",
                table: "sales_custom_field_definitions",
                columns: new[] { "tenant_id", "entity_type", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_custom_field_values_field_definition_id_entity_id",
                table: "sales_custom_field_values",
                columns: new[] { "field_definition_id", "entity_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_custom_field_values_sales_custom_field_definition_id",
                table: "sales_custom_field_values",
                column: "sales_custom_field_definition_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_custom_field_values_tenant_id_entity_type_entity_id",
                table: "sales_custom_field_values",
                columns: new[] { "tenant_id", "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_forecast_groups_parent_group_id",
                table: "sales_forecast_groups",
                column: "parent_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_forecast_groups_tenant_id_group_type",
                table: "sales_forecast_groups",
                columns: new[] { "tenant_id", "group_type" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_forecast_groups_tenant_id_name",
                table: "sales_forecast_groups",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_forecast_targets_forecast_group_id",
                table: "sales_forecast_targets",
                column: "forecast_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_forecast_targets_tenant_id_forecast_group_id_fiscal_y~",
                table: "sales_forecast_targets",
                columns: new[] { "tenant_id", "forecast_group_id", "fiscal_year", "fiscal_quarter" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_account_id",
                table: "sales_opportunities",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_bidding_entity_id",
                table: "sales_opportunities",
                column: "bidding_entity_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_contract_vehicle_id",
                table: "sales_opportunities",
                column: "contract_vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_loss_reason_id",
                table: "sales_opportunities",
                column: "loss_reason_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_owner_id",
                table: "sales_opportunities",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_primary_contact_id",
                table: "sales_opportunities",
                column: "primary_contact_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_stage_id",
                table: "sales_opportunities",
                column: "stage_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_tenant_id_account_id",
                table: "sales_opportunities",
                columns: new[] { "tenant_id", "account_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_tenant_id_close_date",
                table: "sales_opportunities",
                columns: new[] { "tenant_id", "close_date" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_tenant_id_opportunity_number",
                table: "sales_opportunities",
                columns: new[] { "tenant_id", "opportunity_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_tenant_id_owner_id",
                table: "sales_opportunities",
                columns: new[] { "tenant_id", "owner_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_tenant_id_result",
                table: "sales_opportunities",
                columns: new[] { "tenant_id", "result" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_opportunities_tenant_id_stage_id",
                table: "sales_opportunities",
                columns: new[] { "tenant_id", "stage_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_stages_tenant_id_name",
                table: "sales_stages",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_stages_tenant_id_sort_order",
                table: "sales_stages",
                columns: new[] { "tenant_id", "sort_order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "opportunity_capabilities");

            migrationBuilder.DropTable(
                name: "opportunity_contact_roles");

            migrationBuilder.DropTable(
                name: "opportunity_field_histories");

            migrationBuilder.DropTable(
                name: "opportunity_notes");

            migrationBuilder.DropTable(
                name: "opportunity_team_members");

            migrationBuilder.DropTable(
                name: "sales_custom_field_values");

            migrationBuilder.DropTable(
                name: "sales_forecast_targets");

            migrationBuilder.DropTable(
                name: "sales_opportunities");

            migrationBuilder.DropTable(
                name: "sales_custom_field_definitions");

            migrationBuilder.DropTable(
                name: "sales_forecast_groups");

            migrationBuilder.DropTable(
                name: "sales_stages");

            migrationBuilder.DropTable(
                name: "contract_vehicles");

            migrationBuilder.DropTable(
                name: "loss_reasons");

            migrationBuilder.DropTable(
                name: "sales_contacts");

            migrationBuilder.DropTable(
                name: "bidding_entities");

            migrationBuilder.DropTable(
                name: "sales_accounts");
        }
    }
}
