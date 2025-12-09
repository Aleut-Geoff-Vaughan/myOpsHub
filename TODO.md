# TODO - myScheduling

Focused, current backlog. Historical notes are in `docs/archive/`.

---

## Critical / Blocking Issues

### 1. Azure Blob Storage Implementation (HIGH)
**Status:** Interface exists, no implementation
**Impact:** Profile photos and resume attachments cannot be stored
**Files:**
- [IFileStorageService.cs](backend/src/MyScheduling.Core/Interfaces/IFileStorageService.cs) - Interface defined
- [StoredFile.cs](backend/src/MyScheduling.Core/Entities/StoredFile.cs) - Entity ready
- [UsersController.cs:615-689](backend/src/MyScheduling.Api/Controllers/UsersController.cs#L615-L689) - Profile photo endpoint stubbed (only saves URL, no file)

**What's needed:**
- Install `Azure.Storage.Blobs` NuGet package
- Create `AzureBlobStorageService.cs` implementing `IFileStorageService`
- Add configuration to `appsettings.json`:
  - `Storage:Mode` (Blob|Local)
  - `Storage:ConnectionString` or `UseManagedIdentity`
  - `Storage:ContainerProfiles`, `Storage:ContainerDocuments`
  - `Storage:MaxBytes`, `Storage:AllowedContentTypes`
- Register service in `Program.cs`
- Update `UploadProfilePhoto()` to use the service
- Implement resume attachments feature

### 2. Automated Testing (HIGH)
**Status:** Zero automated tests exist
**Impact:** Manual testing only, risky deployments
**Existing:** Only `test-authorization.sh` bash script for manual endpoint testing

**What's needed:**
- Backend: Add xUnit project with tests for auth, authorization, work locations, staffing, resumes
- Frontend: Add Vitest for component and hook testing
- E2E: Add Playwright for critical user flows

---

## Security & Authorization

### 3. Authorization Coverage (COMPLETE)
~~Add [RequiresPermission] to remaining controllers~~

**Status:** All controllers now have full `[RequiresPermission]` coverage:
- WorkLocationPreferencesController (7 endpoints)
- WbsController (16 endpoints)
- FacilitiesController (12 endpoints)
- UserInvitationsController (4 endpoints)
- TenantMembershipsController (6 endpoints)
- ResumeApprovalsController (9 endpoints)
- HolidaysController (8 endpoints)
- DelegationOfAuthorityController (9 endpoints)

### 4. Auth Hardening (MEDIUM)
**Status:** Pending evaluation for production readiness

**Items:**
- [ ] Rotate JWT secrets per environment
- [ ] Consider refresh tokens
- [ ] Evaluate SSO/MFA (Entra ID) before production
- [ ] Ensure all identity is token-based (no header overrides)

---

## Feature Status Summary

### Work Location Templates (COMPLETE)
- Apply/refresh functionality working
- Dashboard/calendar integration complete
- Clone feature added
- Edit from apply modal added
- Manager portal access removed (kept in "Me" portal only)

### Resumes (COMPLETE)
- Creation/editing/versions working
- Approval workflow complete
- Word/PDF export implemented
- Share links with password protection

### Staffing (PARTIAL - 80% Complete)

**Implemented:**
- Assignment requests with full approval workflow
- Inbox page for approvals
- Staffing admin page (read-only with filters/export)
- Assignment history tracking
- Approver groups at database level

**Needs work:**
- [ ] Approver group admin UI per project/WBS
- [ ] Interactive timeline/Gantt (current implementation is basic horizontal bars, not drag-and-drop)
- [ ] Bulk assignment operations from admin page
- [ ] Direct booking option for staffing managers
- [ ] Workflow notification emails

---

## WBS Improvements

> See [CODE_REVIEW_2025-11-20.md](docs/archive/CODE_REVIEW_2025-11-20.md) and [WBS_FIXES_PRIORITY.md](docs/archive/WBS_FIXES_PRIORITY.md) for full analysis

### Already Fixed:
- [x] Pagination integration in WbsPage (frontend handles paginated response correctly)
- [x] Full [RequiresPermission] coverage on all 16 endpoints

### Still Pending:

#### HIGH Priority
| Issue | Impact | File |
|-------|--------|------|
| Transaction support in bulk operations | Partial failures leave inconsistent state | WbsController.cs:663-1044 |
| N+1 query optimization | 50 items = 50 DB calls in bulk ops | WbsController.cs:674-739 |
| Move PaginatedResponse to Core layer | Cannot reuse for other endpoints | WbsController.cs |
| Move bulk operation DTOs to Core layer | Code duplication | WbsController.cs |
| Add database indexes for WBS queries | Slow queries on large datasets | MySchedulingDbContext.cs |
| Date range validation | Invalid date ranges can be saved | WbsController.cs:200-337 |

#### MEDIUM Priority
- [ ] Add pagination UI controls (page size selector, showing X of Y)
- [ ] Add bulk selection UI with checkboxes
- [ ] Build dedicated WBS Approval Queue page at `/wbs/approvals`
- [ ] Standardize error response format across all controllers

---

## Upcoming Features

### Resume Redesign (PENDING USER INPUT)
**Design document:** [RESUME_REDESIGN_PROPOSAL.md](docs/RESUME_REDESIGN_PROPOSAL.md)

Proposed changes:
- Simplified home page with version tiles
- Expiring certifications section on dashboard
- Resume file attachments via Azure Blob Storage

**Blocked on:** User answers to design questions in proposal document

---

## Operational / Quality

### Observability (MEDIUM)
- [ ] Add structured logging/metrics/traces
- [ ] Better error handling and user-friendly error messages

### Performance (LOW)
- [ ] Review N+1 query hot spots (particularly in bulk operations)
- [ ] Add DB indexes for frequent filter patterns

### Notifications (LOW)
- [ ] Implement invitation email delivery
- [ ] Workflow notification emails

### Manager Data Hygiene (LOW)
- [ ] Prevent/clean cycles and invalid references
- [ ] Add validation in APIs when setting `managerId`

---

## Future / Backlog

These are nice-to-have features for later consideration:

- SSO/Entra ID integration
- Advanced reporting/analytics (staffing/utilization/work-location)
- Hoteling check-in (mobile) and floorplan visualization
- Admin configuration portal (system settings, integrations, branding)
- AI/OCR on documents (Azure AI Search + skillset)

---

## Quick Reference: What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Work Location Templates | Complete | Apply, clone, edit all working |
| Resumes | Complete | Versions, approvals, export, share |
| Resume Attachments | Not Started | Needs Azure Blob implementation |
| Staffing Requests | Complete | Full approval workflow |
| Staffing Timeline | Basic | Simple bars, not interactive Gantt |
| WBS Management | Mostly Complete | Pagination fixed, bulk ops need refinement |
| Profile Photos | Stubbed | Endpoint exists, no file storage |
| Authorization | Complete | All controllers protected |
| Automated Tests | None | Manual testing only |

---

*Last updated: 2025-12-09*
