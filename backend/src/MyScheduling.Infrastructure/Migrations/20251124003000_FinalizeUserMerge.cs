using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyScheduling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FinalizeUserMerge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure all tables have user_id and backfill from people where present
            migrationBuilder.Sql(@"
-- Add missing user_id columns (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='person_skills' AND column_name='user_id') THEN
        ALTER TABLE person_skills ADD COLUMN user_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='person_certifications' AND column_name='user_id') THEN
        ALTER TABLE person_certifications ADD COLUMN user_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resume_sections' AND column_name='user_id') THEN
        ALTER TABLE resume_sections ADD COLUMN user_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='linked_in_imports' AND column_name='user_id') THEN
        ALTER TABLE linked_in_imports ADD COLUMN user_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_calendars' AND column_name='owner_user_id') THEN
        ALTER TABLE team_calendars ADD COLUMN owner_user_id uuid;
    END IF;
END$$;

-- Backfill user_id from people table where still null
UPDATE assignments a SET user_id = p.user_id FROM people p WHERE a.person_id = p.id AND a.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE bookings b SET user_id = p.user_id FROM people p WHERE b.person_id = p.id AND b.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE work_location_preferences w SET user_id = p.user_id FROM people p WHERE w.person_id = p.id AND w.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE resume_profiles r SET user_id = p.user_id FROM people p WHERE r.person_id = p.id AND r.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE resume_versions rv SET user_id = r.user_id FROM resume_profiles r WHERE rv.resume_profile_id = r.id AND rv.user_id IS NULL AND r.user_id IS NOT NULL;
UPDATE resume_sections rs SET user_id = r.user_id FROM resume_profiles r WHERE rs.resume_profile_id = r.id AND rs.user_id IS NULL AND r.user_id IS NOT NULL;
UPDATE person_skills ps SET user_id = p.user_id FROM people p WHERE ps.person_id = p.id AND ps.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE person_certifications pc SET user_id = p.user_id FROM people p WHERE pc.person_id = p.id AND pc.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE linked_in_imports li SET user_id = p.user_id FROM people p WHERE li.person_id = p.id AND li.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE team_calendar_members tcm SET user_id = p.user_id FROM people p WHERE tcm.person_id = p.id AND tcm.user_id IS NULL AND p.user_id IS NOT NULL;
UPDATE team_calendars tc SET owner_user_id = p.user_id FROM people p WHERE tc.owner_id = p.id AND tc.owner_user_id IS NULL AND p.user_id IS NOT NULL;

-- Drop FK constraints to people
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS fk_assignments__people_person_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings__people_person_id;
ALTER TABLE work_location_preferences DROP CONSTRAINT IF EXISTS fk_work_location_preferences_people_person_id;
ALTER TABLE resume_profiles DROP CONSTRAINT IF EXISTS fk_resume_profiles_people_person_id;
ALTER TABLE resume_sections DROP CONSTRAINT IF EXISTS fk_resume_sections_people_person_id;
ALTER TABLE person_skills DROP CONSTRAINT IF EXISTS fk_person_skills_people_person_id;
ALTER TABLE person_certifications DROP CONSTRAINT IF EXISTS fk_person_certifications_people_person_id;
ALTER TABLE team_calendar_members DROP CONSTRAINT IF EXISTS fk_team_calendar_members_people_person_id;
ALTER TABLE linked_in_imports DROP CONSTRAINT IF EXISTS fk_linked_in_imports__people_person_id;
ALTER TABLE team_calendars DROP CONSTRAINT IF EXISTS fk_team_calendars_people_owner_id;

-- Drop person-based indexes
DROP INDEX IF EXISTS ix_assignments_person_id;
DROP INDEX IF EXISTS ix_assignments_tenant_id_person_id_status;
DROP INDEX IF EXISTS ix_bookings_person_id_status;
DROP INDEX IF EXISTS ix_linked_in_imports_person_id_imported_at;
DROP INDEX IF EXISTS ix_person_certifications_person_id_certification_id;
DROP INDEX IF EXISTS ix_person_skills_person_id_skill_id;
DROP INDEX IF EXISTS ix_resume_profiles_person_id;
DROP INDEX IF EXISTS ix_resume_sections_person_id_display_order;
DROP INDEX IF EXISTS ix_team_calendar_members_person_id_is_active;
DROP INDEX IF EXISTS ix_team_calendar_members_tenant_id_team_calendar_id_person_id;
DROP INDEX IF EXISTS ix_work_location_preferences_person_id;
DROP INDEX IF EXISTS ix_work_location_preferences_tenant_id_person_id_work_date;
DROP INDEX IF EXISTS ix_team_calendars_owner_id;

-- Make user_id required and add FKs/indexes
ALTER TABLE assignments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS ix_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS ix_assignments_tenant_id_user_id_status ON assignments(tenant_id, user_id, status);
ALTER TABLE assignments DROP COLUMN IF EXISTS person_id;

ALTER TABLE bookings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS ix_bookings_user_id_status ON bookings(user_id, status);
ALTER TABLE bookings DROP COLUMN IF EXISTS person_id;

ALTER TABLE work_location_preferences ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE work_location_preferences ADD CONSTRAINT fk_work_location_preferences_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_work_location_preferences_tenant_id_user_id_work_date ON work_location_preferences(tenant_id, user_id, work_date);
DROP INDEX IF EXISTS ix_work_location_preferences_tenant_id_user_id;
CREATE INDEX IF NOT EXISTS ix_work_location_preferences_user_id ON work_location_preferences(user_id);
ALTER TABLE work_location_preferences DROP COLUMN IF EXISTS person_id;

ALTER TABLE resume_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE resume_profiles ADD CONSTRAINT fk_resume_profiles_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_resume_profiles_user_id ON resume_profiles(user_id);
ALTER TABLE resume_profiles DROP COLUMN IF EXISTS person_id;

ALTER TABLE resume_versions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE resume_versions DROP CONSTRAINT IF EXISTS fk_resume_versions_users_user_id;
ALTER TABLE resume_versions ADD CONSTRAINT fk_resume_versions_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE resume_sections ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE resume_sections ADD CONSTRAINT fk_resume_sections_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS ix_resume_sections_user_id_display_order ON resume_sections(user_id, display_order);
ALTER TABLE resume_sections DROP COLUMN IF EXISTS person_id;

ALTER TABLE person_skills ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE person_skills ADD CONSTRAINT fk_person_skills_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_person_skills_user_id_skill_id ON person_skills(user_id, skill_id);
ALTER TABLE person_skills DROP COLUMN IF EXISTS person_id;

ALTER TABLE person_certifications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE person_certifications ADD CONSTRAINT fk_person_certifications_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_person_certifications_user_id_certification_id ON person_certifications(user_id, certification_id);
ALTER TABLE person_certifications DROP COLUMN IF EXISTS person_id;

ALTER TABLE linked_in_imports ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE linked_in_imports ADD CONSTRAINT fk_linked_in_imports_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS ix_linked_in_imports_user_id_imported_at ON linked_in_imports(user_id, imported_at);
ALTER TABLE linked_in_imports DROP COLUMN IF EXISTS person_id;

ALTER TABLE team_calendar_members ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE team_calendar_members ADD CONSTRAINT fk_team_calendar_members_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_team_calendar_members_tenant_id_team_calendar_id_user_id ON team_calendar_members(tenant_id, team_calendar_id, user_id);
CREATE INDEX IF NOT EXISTS ix_team_calendar_members_user_id_is_active ON team_calendar_members(user_id, is_active);
ALTER TABLE team_calendar_members DROP COLUMN IF EXISTS person_id;

ALTER TABLE team_calendars DROP COLUMN IF EXISTS owner_id;
ALTER TABLE team_calendars ADD CONSTRAINT fk_team_calendars_users_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_team_calendars_owner_user_id ON team_calendars(owner_user_id);

-- Finally drop people table
DROP TABLE IF EXISTS people CASCADE;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Not implementing Down as this migration removes Person and rewires the schema to User-only.
        }
    }
}
