using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceCheckInEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "check_in_date",
                table: "check_in_events",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<int>(
                name: "status",
                table: "check_in_events",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_check_in_events_booking_id_check_in_date",
                table: "check_in_events",
                columns: new[] { "booking_id", "check_in_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_check_in_events_processed_by_user_id",
                table: "check_in_events",
                column: "processed_by_user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_check_in_events__users_processed_by_user_id",
                table: "check_in_events",
                column: "processed_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_check_in_events__users_processed_by_user_id",
                table: "check_in_events");

            migrationBuilder.DropIndex(
                name: "ix_check_in_events_booking_id_check_in_date",
                table: "check_in_events");

            migrationBuilder.DropIndex(
                name: "ix_check_in_events_processed_by_user_id",
                table: "check_in_events");

            migrationBuilder.DropColumn(
                name: "check_in_date",
                table: "check_in_events");

            migrationBuilder.DropColumn(
                name: "status",
                table: "check_in_events");
        }
    }
}
