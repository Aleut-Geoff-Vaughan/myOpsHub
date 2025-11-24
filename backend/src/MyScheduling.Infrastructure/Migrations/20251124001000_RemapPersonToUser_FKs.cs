using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemapPersonToUser_FKs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ResumeProfile -> User
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "resume_profiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE resume_profiles rp SET user_id = p.user_id FROM people p WHERE p.id = rp.person_id AND p.user_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_resume_profiles_user_id",
                table: "resume_profiles",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_resume_profiles_users_user_id",
                table: "resume_profiles",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            // ResumeVersions -> User
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "resume_versions",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE resume_versions rv SET user_id = rp.user_id FROM resume_profiles rp WHERE rp.id = rv.resume_profile_id AND rp.user_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_resume_versions_user_id",
                table: "resume_versions",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_resume_versions_users_user_id",
                table: "resume_versions",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // Assignments -> User
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "assignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE assignments a SET user_id = p.user_id FROM people p WHERE p.id = a.person_id AND p.user_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_assignments_user_id",
                table: "assignments",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_assignments_users_user_id",
                table: "assignments",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // Bookings -> User
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE bookings b SET user_id = p.user_id FROM people p WHERE p.id = b.person_id AND p.user_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_bookings_user_id",
                table: "bookings",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bookings_users_user_id",
                table: "bookings",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // WorkLocationPreferences -> User
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "work_location_preferences",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE work_location_preferences w SET user_id = p.user_id FROM people p WHERE p.id = w.person_id AND p.user_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_work_location_preferences_user_id",
                table: "work_location_preferences",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_work_location_preferences_users_user_id",
                table: "work_location_preferences",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            // TeamCalendarMembers -> User
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "team_calendar_members",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE team_calendar_members tcm SET user_id = p.user_id FROM people p WHERE p.id = tcm.person_id AND p.user_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_team_calendar_members_user_id",
                table: "team_calendar_members",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_team_calendar_members_users_user_id",
                table: "team_calendar_members",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_resume_profiles_users_user_id",
                table: "resume_profiles");
            migrationBuilder.DropIndex(
                name: "ix_resume_profiles_user_id",
                table: "resume_profiles");
            migrationBuilder.DropColumn(
                name: "user_id",
                table: "resume_profiles");

            migrationBuilder.DropForeignKey(
                name: "fk_resume_versions_users_user_id",
                table: "resume_versions");
            migrationBuilder.DropIndex(
                name: "ix_resume_versions_user_id",
                table: "resume_versions");
            migrationBuilder.DropColumn(
                name: "user_id",
                table: "resume_versions");

            migrationBuilder.DropForeignKey(
                name: "fk_assignments_users_user_id",
                table: "assignments");
            migrationBuilder.DropIndex(
                name: "ix_assignments_user_id",
                table: "assignments");
            migrationBuilder.DropColumn(
                name: "user_id",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "fk_bookings_users_user_id",
                table: "bookings");
            migrationBuilder.DropIndex(
                name: "ix_bookings_user_id",
                table: "bookings");
            migrationBuilder.DropColumn(
                name: "user_id",
                table: "bookings");

            migrationBuilder.DropForeignKey(
                name: "fk_work_location_preferences_users_user_id",
                table: "work_location_preferences");
            migrationBuilder.DropIndex(
                name: "ix_work_location_preferences_user_id",
                table: "work_location_preferences");
            migrationBuilder.DropColumn(
                name: "user_id",
                table: "work_location_preferences");

            migrationBuilder.DropForeignKey(
                name: "fk_team_calendar_members_users_user_id",
                table: "team_calendar_members");
            migrationBuilder.DropIndex(
                name: "ix_team_calendar_members_user_id",
                table: "team_calendar_members");
            migrationBuilder.DropColumn(
                name: "user_id",
                table: "team_calendar_members");
        }
    }
}
