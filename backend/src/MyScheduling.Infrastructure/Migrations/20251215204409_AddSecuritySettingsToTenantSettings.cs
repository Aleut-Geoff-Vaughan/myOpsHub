using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSecuritySettingsToTenantSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "allow_self_registration",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "email_notifications_enabled",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "failed_login_attempts_before_lock",
                table: "tenant_settings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "maintenance_mode",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "password_min_length",
                table: "tenant_settings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "require2_fa",
                table: "tenant_settings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "session_timeout_minutes",
                table: "tenant_settings",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "allow_self_registration",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "email_notifications_enabled",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "failed_login_attempts_before_lock",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "maintenance_mode",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "password_min_length",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "require2_fa",
                table: "tenant_settings");

            migrationBuilder.DropColumn(
                name: "session_timeout_minutes",
                table: "tenant_settings");
        }
    }
}
