using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectAssignmentsTwoStepModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "project_assignment_id",
                table: "assignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "project_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_project_assignments", x => x.id);
                    table.ForeignKey(
                        name: "fk_project_assignments__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_project_assignments__users_approved_by_user_id",
                        column: x => x.approved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_project_assignments__users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_project_assignments_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_assignments_project_assignment_id_status",
                table: "assignments",
                columns: new[] { "project_assignment_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_project_assignments_approved_by_user_id",
                table: "project_assignments",
                column: "approved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_project_assignments_project_id_status",
                table: "project_assignments",
                columns: new[] { "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_project_assignments_start_date_end_date",
                table: "project_assignments",
                columns: new[] { "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "ix_project_assignments_tenant_id_user_id_status",
                table: "project_assignments",
                columns: new[] { "tenant_id", "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_project_assignments_user_id",
                table: "project_assignments",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_assignments__project_assignments_project_assignment_id",
                table: "assignments",
                column: "project_assignment_id",
                principalTable: "project_assignments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_assignments__project_assignments_project_assignment_id",
                table: "assignments");

            migrationBuilder.DropTable(
                name: "project_assignments");

            migrationBuilder.DropIndex(
                name: "ix_assignments_project_assignment_id_status",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "project_assignment_id",
                table: "assignments");
        }
    }
}
