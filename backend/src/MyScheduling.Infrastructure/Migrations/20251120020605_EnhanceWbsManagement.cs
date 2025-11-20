using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceWbsManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "approval_notes",
                table: "wbs_elements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "approval_status",
                table: "wbs_elements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "approved_at",
                table: "wbs_elements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "approver_id",
                table: "wbs_elements",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "approver_user_id",
                table: "wbs_elements",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "owner_id",
                table: "wbs_elements",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "owner_user_id",
                table: "wbs_elements",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "type",
                table: "wbs_elements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "valid_from",
                table: "wbs_elements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "valid_to",
                table: "wbs_elements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "wbs_change_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    wbs_element_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    change_type = table.Column<string>(type: "text", nullable: false),
                    old_values = table.Column<string>(type: "text", nullable: true),
                    new_values = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    changed_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wbs_change_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_wbs_change_history__wbs_elements_wbs_element_id",
                        column: x => x.wbs_element_id,
                        principalTable: "wbs_elements",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_wbs_change_history_users_changed_by_id",
                        column: x => x.changed_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_wbs_elements_approver_id",
                table: "wbs_elements",
                column: "approver_id");

            migrationBuilder.CreateIndex(
                name: "ix_wbs_elements_owner_id",
                table: "wbs_elements",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_wbs_change_history_changed_by_id",
                table: "wbs_change_history",
                column: "changed_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_wbs_change_history_wbs_element_id",
                table: "wbs_change_history",
                column: "wbs_element_id");

            migrationBuilder.AddForeignKey(
                name: "fk_wbs_elements_users_approver_id",
                table: "wbs_elements",
                column: "approver_id",
                principalTable: "users",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_wbs_elements_users_owner_id",
                table: "wbs_elements",
                column: "owner_id",
                principalTable: "users",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_wbs_elements_users_approver_id",
                table: "wbs_elements");

            migrationBuilder.DropForeignKey(
                name: "fk_wbs_elements_users_owner_id",
                table: "wbs_elements");

            migrationBuilder.DropTable(
                name: "wbs_change_history");

            migrationBuilder.DropIndex(
                name: "ix_wbs_elements_approver_id",
                table: "wbs_elements");

            migrationBuilder.DropIndex(
                name: "ix_wbs_elements_owner_id",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "approval_notes",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "approval_status",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "approved_at",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "approver_id",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "approver_user_id",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "owner_id",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "owner_user_id",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "type",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "valid_from",
                table: "wbs_elements");

            migrationBuilder.DropColumn(
                name: "valid_to",
                table: "wbs_elements");
        }
    }
}
