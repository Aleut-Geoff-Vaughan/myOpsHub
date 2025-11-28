using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "end_datetime",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<DateTime>(
                name: "booked_at",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "booked_by_user_id",
                table: "bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_permanent",
                table: "bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_bookings_booked_by_user_id",
                table: "bookings",
                column: "booked_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_bookings_is_permanent",
                table: "bookings",
                column: "is_permanent");

            migrationBuilder.AddForeignKey(
                name: "fk_bookings__users_booked_by_user_id",
                table: "bookings",
                column: "booked_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bookings__users_booked_by_user_id",
                table: "bookings");

            migrationBuilder.DropIndex(
                name: "ix_bookings_booked_by_user_id",
                table: "bookings");

            migrationBuilder.DropIndex(
                name: "ix_bookings_is_permanent",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "booked_at",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "booked_by_user_id",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "is_permanent",
                table: "bookings");

            migrationBuilder.AlterColumn<DateTime>(
                name: "end_datetime",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}
