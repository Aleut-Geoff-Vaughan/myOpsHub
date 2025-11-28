using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFacilitiesEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "availability_type",
                table: "spaces",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "floor_id",
                table: "spaces",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "zone_id",
                table: "spaces",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "booking_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    office_id = table.Column<Guid>(type: "uuid", nullable: true),
                    space_id = table.Column<Guid>(type: "uuid", nullable: true),
                    space_type = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    min_duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    max_duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    min_advance_booking_minutes = table.Column<int>(type: "integer", nullable: true),
                    max_advance_booking_days = table.Column<int>(type: "integer", nullable: true),
                    earliest_start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    latest_end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    allowed_days_of_week = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    allow_recurring = table.Column<bool>(type: "boolean", nullable: false),
                    max_recurring_weeks = table.Column<int>(type: "integer", nullable: true),
                    requires_approval = table.Column<bool>(type: "boolean", nullable: false),
                    auto_approve_for_roles = table.Column<bool>(type: "boolean", nullable: false),
                    auto_approve_roles = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    max_bookings_per_user_per_day = table.Column<int>(type: "integer", nullable: true),
                    max_bookings_per_user_per_week = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("pk_booking_rules", x => x.id);
                    table.ForeignKey(
                        name: "fk_booking_rules__offices_office_id",
                        column: x => x.office_id,
                        principalTable: "offices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_booking_rules__spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_booking_rules__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "floors",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    office_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false),
                    floor_plan_url = table.Column<string>(type: "text", nullable: true),
                    square_footage = table.Column<decimal>(type: "numeric", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_floors", x => x.id);
                    table.ForeignKey(
                        name: "fk_floors__offices_office_id",
                        column: x => x.office_id,
                        principalTable: "offices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_floors__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "space_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    type = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("pk_space_assignments", x => x.id);
                    table.ForeignKey(
                        name: "fk_space_assignments__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_space_assignments__users_approved_by_user_id",
                        column: x => x.approved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_space_assignments__users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_space_assignments_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "zones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    floor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_zones", x => x.id);
                    table.ForeignKey(
                        name: "fk_zones_floors_floor_id",
                        column: x => x.floor_id,
                        principalTable: "floors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_zones_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_spaces_floor_id_zone_id",
                table: "spaces",
                columns: new[] { "floor_id", "zone_id" });

            migrationBuilder.CreateIndex(
                name: "ix_spaces_zone_id",
                table: "spaces",
                column: "zone_id");

            migrationBuilder.CreateIndex(
                name: "ix_booking_rules_office_id",
                table: "booking_rules",
                column: "office_id");

            migrationBuilder.CreateIndex(
                name: "ix_booking_rules_priority",
                table: "booking_rules",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "ix_booking_rules_space_id",
                table: "booking_rules",
                column: "space_id");

            migrationBuilder.CreateIndex(
                name: "ix_booking_rules_space_type_is_active",
                table: "booking_rules",
                columns: new[] { "space_type", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_booking_rules_tenant_id_office_id_is_active",
                table: "booking_rules",
                columns: new[] { "tenant_id", "office_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_floors_office_id_is_active",
                table: "floors",
                columns: new[] { "office_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_floors_tenant_id_office_id_level",
                table: "floors",
                columns: new[] { "tenant_id", "office_id", "level" });

            migrationBuilder.CreateIndex(
                name: "ix_space_assignments_approved_by_user_id",
                table: "space_assignments",
                column: "approved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_assignments_space_id",
                table: "space_assignments",
                column: "space_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_assignments_start_date_end_date",
                table: "space_assignments",
                columns: new[] { "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "ix_space_assignments_tenant_id_space_id_status",
                table: "space_assignments",
                columns: new[] { "tenant_id", "space_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_space_assignments_tenant_id_user_id_status",
                table: "space_assignments",
                columns: new[] { "tenant_id", "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_space_assignments_user_id",
                table: "space_assignments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_zones_floor_id_is_active",
                table: "zones",
                columns: new[] { "floor_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_zones_tenant_id_floor_id",
                table: "zones",
                columns: new[] { "tenant_id", "floor_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_spaces__zones_zone_id",
                table: "spaces",
                column: "zone_id",
                principalTable: "zones",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_spaces_floors_floor_id",
                table: "spaces",
                column: "floor_id",
                principalTable: "floors",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_spaces__zones_zone_id",
                table: "spaces");

            migrationBuilder.DropForeignKey(
                name: "fk_spaces_floors_floor_id",
                table: "spaces");

            migrationBuilder.DropTable(
                name: "booking_rules");

            migrationBuilder.DropTable(
                name: "space_assignments");

            migrationBuilder.DropTable(
                name: "zones");

            migrationBuilder.DropTable(
                name: "floors");

            migrationBuilder.DropIndex(
                name: "ix_spaces_floor_id_zone_id",
                table: "spaces");

            migrationBuilder.DropIndex(
                name: "ix_spaces_zone_id",
                table: "spaces");

            migrationBuilder.DropColumn(
                name: "availability_type",
                table: "spaces");

            migrationBuilder.DropColumn(
                name: "floor_id",
                table: "spaces");

            migrationBuilder.DropColumn(
                name: "zone_id",
                table: "spaces");
        }
    }
}
