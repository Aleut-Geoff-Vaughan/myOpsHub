using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfficeLocationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "city",
                table: "offices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "country_code",
                table: "offices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "icon_url",
                table: "offices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "latitude",
                table: "offices",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                table: "offices",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "state_code",
                table: "offices",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "city",
                table: "offices");

            migrationBuilder.DropColumn(
                name: "country_code",
                table: "offices");

            migrationBuilder.DropColumn(
                name: "icon_url",
                table: "offices");

            migrationBuilder.DropColumn(
                name: "latitude",
                table: "offices");

            migrationBuilder.DropColumn(
                name: "longitude",
                table: "offices");

            migrationBuilder.DropColumn(
                name: "state_code",
                table: "offices");
        }
    }
}
