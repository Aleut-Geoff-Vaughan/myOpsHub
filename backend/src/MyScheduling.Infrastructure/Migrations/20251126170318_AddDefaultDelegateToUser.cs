using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDefaultDelegateToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "default_delegate_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "default_delegate_user_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_default_delegate_id",
                table: "users",
                column: "default_delegate_id");

            migrationBuilder.AddForeignKey(
                name: "fk_users_users_default_delegate_id",
                table: "users",
                column: "default_delegate_id",
                principalTable: "users",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_users_users_default_delegate_id",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_users_default_delegate_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "default_delegate_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "default_delegate_user_id",
                table: "users");
        }
    }
}
