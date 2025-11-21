using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamCalendarsAndManagerRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "manager_id",
                table: "people",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "team_calendars",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    type = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_team_calendars", x => x.id);
                    table.ForeignKey(
                        name: "fk_team_calendars__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_team_calendars_people_owner_id",
                        column: x => x.owner_id,
                        principalTable: "people",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "team_calendar_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    team_calendar_id = table.Column<Guid>(type: "uuid", nullable: false),
                    person_id = table.Column<Guid>(type: "uuid", nullable: false),
                    membership_type = table.Column<int>(type: "integer", nullable: false),
                    added_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    added_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_team_calendar_members", x => x.id);
                    table.ForeignKey(
                        name: "fk_team_calendar_members__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_team_calendar_members__users_added_by_user_id",
                        column: x => x.added_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_team_calendar_members_people_person_id",
                        column: x => x.person_id,
                        principalTable: "people",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_team_calendar_members_team_calendars_team_calendar_id",
                        column: x => x.team_calendar_id,
                        principalTable: "team_calendars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_people_manager_id",
                table: "people",
                column: "manager_id");

            migrationBuilder.CreateIndex(
                name: "ix_team_calendar_members_added_by_user_id",
                table: "team_calendar_members",
                column: "added_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_team_calendar_members_person_id_is_active",
                table: "team_calendar_members",
                columns: new[] { "person_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_team_calendar_members_team_calendar_id_is_active",
                table: "team_calendar_members",
                columns: new[] { "team_calendar_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_team_calendar_members_tenant_id_team_calendar_id_person_id",
                table: "team_calendar_members",
                columns: new[] { "tenant_id", "team_calendar_id", "person_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_team_calendars_owner_id",
                table: "team_calendars",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_team_calendars_tenant_id_is_active",
                table: "team_calendars",
                columns: new[] { "tenant_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_team_calendars_tenant_id_type",
                table: "team_calendars",
                columns: new[] { "tenant_id", "type" });

            migrationBuilder.AddForeignKey(
                name: "fk_people_people_manager_id",
                table: "people",
                column: "manager_id",
                principalTable: "people",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_people_people_manager_id",
                table: "people");

            migrationBuilder.DropTable(
                name: "team_calendar_members");

            migrationBuilder.DropTable(
                name: "team_calendars");

            migrationBuilder.DropIndex(
                name: "ix_people_manager_id",
                table: "people");

            migrationBuilder.DropColumn(
                name: "manager_id",
                table: "people");
        }
    }
}
