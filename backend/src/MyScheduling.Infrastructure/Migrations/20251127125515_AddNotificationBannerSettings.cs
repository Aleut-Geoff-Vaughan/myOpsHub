using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationBannerSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "environment_name",
                table: "tenant_settings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "notification_banner_enabled",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "notification_banner_expires_at",
                table: "tenant_settings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notification_banner_message",
                table: "tenant_settings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notification_banner_type",
                table: "tenant_settings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "show_environment_banner",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "environment_name",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "notification_banner_enabled",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "notification_banner_expires_at",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "notification_banner_message",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "notification_banner_type",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "show_environment_banner",
                table: "tenant_settings");
        }
    }
}
