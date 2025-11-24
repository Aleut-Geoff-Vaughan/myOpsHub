# User/Person Merge Plan (WIP)

Goal: collapse `Person` into `User` so every person is a user with login. All references to `Person` move to `User`, permissions are unified, and hierarchy (manager → direct/indirect reports) is maintained on users.

## Phased Plan

**Phase 1 – Prepare**
- Add missing profile fields to `User` (OrgUnit, Location, CostCenter, LaborCategory, JobTitle, Type/Status, ManagerId self-reference, optional Resume/Preferences links).
- Add migration to create new columns on `users` and ManagerId FK.
- Add recursive manager reporting service (direct vs. all reports) so UI can toggle scopes.
- Keep `Person` table temporarily; add compatibility endpoints that read from `User` once populated.

**Phase 2 – Move Data**
- Backfill `users` from `people`: for each person, map profile fields and ManagerId to the corresponding user (require one-to-one). Generate a script to assert or create missing users.
- Re-point FK columns on dependent tables from `person_id` to `user_id` (assignments, bookings, work location preferences, resumes, team calendar members, etc.).
- Update EF entities and migrations to drop `PersonId` in favor of `UserId` on all dependent entities.

**Phase 3 – Remove Person**
- Remove `Person` entity/table and related permissions; consolidate permission seeds to `User`.
- Remove or rewrite controllers/services/DTOs that referenced `Person`.
- Update frontend services/components to use user-based endpoints/fields.

## Notes & Risks
- Data integrity: need a reliable mapping `person.Id -> user.Id`. If mismatches exist, create users or update join tables before dropping `Person`.
- Large migration: many FK touch points (assignments, bookings, resumes, team calendars, work location preferences, skills, certifications). Plan incremental migrations and a backfill script.
- Frontend impact: any “person” API calls must be routed to user-based endpoints once data is moved.

## New Feature (manager scopes)
- Add a `scope` parameter to manager/team calendar view (`direct` vs `all`) using the manager hierarchy (recursive).
