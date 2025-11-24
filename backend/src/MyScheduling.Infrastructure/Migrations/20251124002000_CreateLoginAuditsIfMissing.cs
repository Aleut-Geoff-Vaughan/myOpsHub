using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CreateLoginAuditsIfMissing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create login_audits table if it doesn't exist (idempotent safeguard for missing initial migration)
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_audits') THEN
        CREATE TABLE login_audits (
            id uuid NOT NULL PRIMARY KEY,
            created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
            updated_at timestamptz NULL,
            deleted_at timestamptz NULL,
            is_deleted boolean NOT NULL DEFAULT false,
            user_id uuid NULL,
            email text NULL,
            is_success boolean NOT NULL,
            ip_address text NULL,
            user_agent text NULL,
            device text NULL,
            operating_system text NULL,
            browser text NULL
        );
        CREATE INDEX ix_login_audits_user_id ON login_audits(user_id);
        ALTER TABLE login_audits
            ADD CONSTRAINT fk_login_audits_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END$$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Do not drop; safeguard only
        }
    }
}
