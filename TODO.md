# TODO - myScheduling

Focused, current backlog. Historical notes are in `docs/archive/`.

---

## Critical / Blocking Issues

### 1. Azure Blob Storage Implementation (COMPLETE)
**Status:** Fully implemented and configured

**What's working:**
- [AzureBlobStorageService.cs](backend/src/MyScheduling.Infrastructure/Services/AzureBlobStorageService.cs) - Full Azure Blob implementation
- [LocalFileStorageService.cs](backend/src/MyScheduling.Infrastructure/Services/LocalFileStorageService.cs) - Local dev fallback
- [FilesController.cs](backend/src/MyScheduling.Api/Controllers/FilesController.cs) - REST API with upload, list, download, delete
- [IFileStorageService.cs](backend/src/MyScheduling.Core/Interfaces/IFileStorageService.cs) - Interface with versioning, search, SAS URLs
- [StoredFile.cs](backend/src/MyScheduling.Core/Entities/StoredFile.cs) - Entity with access logs, versioning
- Frontend: `fileStorageService.ts`, `useFileStorage.ts` hooks

**Configuration:**
- Environment variable: `AZURE_STORAGE_CONNECTION_STRING` (set in Azure App Service)
- Container: `myscheduling-files`
- Provider selection: `FileStorage:Provider` in appsettings.json ("AzureBlob" | "Local")

**Remaining optional work:**
- [ ] Profile photo endpoint still uses old stubbed approach - could be updated to use `IFileStorageService`

---

## Security & Tech Debt (HIGH PRIORITY)

### 2. Security Fixes (COMPLETE)
**Status:** All identified issues resolved

| Issue | File | Fix |
|-------|------|-----|
| [x] Hardcoded JWT fallback | `Program.cs:36` | Removed fallback, throws if not configured |
| [x] XSS via `dangerouslySetInnerHTML` | `InviteUserModal.tsx:207` | Added DOMPurify sanitization |
| [x] XSS in RichTextEditor | `RichTextEditor.tsx:142` | Sanitized HTML content |
| [x] XSS in ResumeSharePage | `ResumeSharePage.tsx:184` | Sanitized before `innerHTML` |
| [x] Missing file upload validation | `AzureBlobStorageService.cs` | Added extension whitelist/blocklist + MIME validation |

### 3. Code Cleanup (COMPLETE)
**Status:** Placeholder files removed

**Deleted files:**
- [x] `backend/src/MyScheduling.Core/Class1.cs` - Empty placeholder (deleted)
- [x] `backend/src/MyScheduling.Infrastructure/Class1.cs` - Empty placeholder (deleted)
- [x] `backend/src/MyScheduling.Api/WeatherForecast.cs` - Template code (deleted)
- [x] `backend/src/MyScheduling.Api/Controllers/WeatherForecastController.cs` - Template controller (deleted)

**TODO comments to resolve:**
- [ ] `UsersController.cs:594` - Implement proper password verification
- [ ] `UsersController.cs:676` - Implement file deletion from storage
- [ ] `ResumeTemplatesController.cs:317` - Implement template preview
- [ ] `AdminPage.tsx:667` - Save settings to API
- [ ] `ResumeDetailPage.tsx:99,117` - Get current user from auth context

### 4. Auth Hardening (MEDIUM)
**Status:** Pending evaluation for production readiness

**Items:**
- [ ] Rotate JWT secrets per environment
- [ ] Consider refresh tokens
- [ ] Evaluate SSO/MFA (Entra ID) before production
- [ ] Ensure all identity is token-based (no header overrides)

---

## Enhanced Logging System (COMPLETE)

### Backend (Serilog)
**Status:** Implemented

- [x] Added NuGet packages to `MyScheduling.Api.csproj`:
  - `Serilog.AspNetCore`, `Serilog.Sinks.Console`, `Serilog.Sinks.File`
  - `Serilog.Enrichers.Environment`, `Serilog.Enrichers.Thread`

- [x] Created [Middleware/CorrelationIdMiddleware.cs](backend/src/MyScheduling.Api/Middleware/CorrelationIdMiddleware.cs)
- [x] Created [Middleware/RequestLoggingMiddleware.cs](backend/src/MyScheduling.Api/Middleware/RequestLoggingMiddleware.cs)
- [x] Created [Services/LoggingConfigurationService.cs](backend/src/MyScheduling.Api/Services/LoggingConfigurationService.cs)
- [x] Created [Controllers/LoggingController.cs](backend/src/MyScheduling.Api/Controllers/LoggingController.cs) (admin runtime toggle)
- [x] Updated `Program.cs` with Serilog configuration
- [x] Updated `appsettings.json` with Serilog section

### Frontend (Logging Service)
- [x] Created [services/loggingService.ts](frontend/src/services/loggingService.ts) - Toggleable logging with correlation IDs
- [x] Created [hooks/useLogging.ts](frontend/src/hooks/useLogging.ts) - React integration
- [x] Updated [lib/api-client.ts](frontend/src/lib/api-client.ts) - Added `X-Correlation-Id` header + request timing logs

### Usage
- **Backend runtime toggle:** `POST /api/logging/verbose/enable` and `POST /api/logging/verbose/disable`
- **Frontend console:** `window.__mySchedulingLogger.enableVerbose()` / `disableVerbose()`
- **Correlation IDs:** Automatically generated and passed between frontend and backend

---

## Help System (COMPLETE)

### Backend
**Status:** Implemented

- [x] Created [Entities/HelpArticle.cs](backend/src/MyScheduling.Core/Entities/HelpArticle.cs) - ContextKey, Title, JiraUrl, VideoUrl, ModuleName
- [x] Updated [MySchedulingDbContext.cs](backend/src/MyScheduling.Infrastructure/Data/MySchedulingDbContext.cs) - Added HelpArticle DbSet
- [ ] Create EF migration for help_articles table (run `dotnet ef migrations add AddHelpArticles`)
- [x] Created [Controllers/HelpArticlesController.cs](backend/src/MyScheduling.Api/Controllers/HelpArticlesController.cs) - CRUD + search
- [ ] Add HelpArticle permissions to `SeedRolePermissions.cs` (optional - uses Settings permissions)

### Frontend
- [x] Created [types/help.ts](frontend/src/types/help.ts)
- [x] Created [services/helpService.ts](frontend/src/services/helpService.ts)
- [x] Created [hooks/useHelp.ts](frontend/src/hooks/useHelp.ts)
- [x] Created [contexts/HelpContext.tsx](frontend/src/contexts/HelpContext.tsx) - Context-sensitive help provider
- [x] Created [config/helpContextKeys.ts](frontend/src/config/helpContextKeys.ts) - Route-to-context mapping
- [x] Created [components/help/HelpButton.tsx](frontend/src/components/help/HelpButton.tsx)
- [x] Created [components/help/HelpPanel.tsx](frontend/src/components/help/HelpPanel.tsx)
- [x] Created [components/help/HelpArticleCard.tsx](frontend/src/components/help/HelpArticleCard.tsx)
- [x] Created [pages/AdminHelpArticlesPage.tsx](frontend/src/pages/AdminHelpArticlesPage.tsx) - Admin management UI with CRUD
- [x] Updated [App.tsx](frontend/src/App.tsx) - Added HelpProvider wrapper and HelpPanel
- [x] Updated [GlobalTopBar.tsx](frontend/src/components/navigation/GlobalTopBar.tsx) - Added HelpButton to header
- [x] Updated [config/modules.ts](frontend/src/config/modules.ts) - Added admin nav item

---

## Automated Testing (MOSTLY COMPLETE)

### Backend Test Projects
**Status:** Implemented - 37 tests passing

- [x] Created [backend/tests/MyScheduling.Core.Tests/](backend/tests/MyScheduling.Core.Tests/) project
- [x] Created [backend/tests/MyScheduling.Infrastructure.Tests/](backend/tests/MyScheduling.Infrastructure.Tests/) project
- [x] Created [backend/tests/MyScheduling.Api.Tests/](backend/tests/MyScheduling.Api.Tests/) project
- [ ] Create `backend/tests/MyScheduling.Integration.Tests/` project (optional)

### Backend Tests (xUnit)
- [x] AuthController tests - Login, password validation, lockout, JWT (24 tests)
- [x] WorkingDaysService tests - Business day calculations (13 tests)
- [ ] RequiresPermissionAttribute tests
- [ ] Authentication integration tests
- [ ] Multi-tenant isolation tests

### Frontend Testing Setup (Vitest)
**Status:** Implemented - 18 tests passing

- [x] Installed: `@testing-library/react`, `vitest`, `jsdom`, `msw`
- [x] Created [vitest.config.ts](frontend/vitest.config.ts)
- [x] Created [test/setup.ts](frontend/src/test/setup.ts), [test/mocks/handlers.ts](frontend/src/test/mocks/handlers.ts), [test/utils.tsx](frontend/src/test/utils.tsx)
- [x] Added test scripts to `package.json`

### Frontend Tests
- [x] authStore tests (18 tests)
- [ ] LoginPage tests
- [ ] Button, Modal component tests
- [ ] useFiscalYear, useWorkingDays hook tests

### E2E Testing (Playwright)
- [ ] Setup Playwright
- [ ] Create `e2e/auth.spec.ts` - Login/logout flows
- [ ] Create `e2e/projects.spec.ts` - CRUD operations

### CI/CD Integration
- [x] Updated [.github/workflows/azure-backend-deploy.yml](.github/workflows/azure-backend-deploy.yml) - Added test job
- [x] Updated [.github/workflows/azure-static-web-apps-proud-ocean-0c7274110.yml](.github/workflows/azure-static-web-apps-proud-ocean-0c7274110.yml) - Added test job
- [ ] Configure Codecov (optional)

**Current Coverage:** 55 tests total (37 backend + 18 frontend)
**Coverage Targets:** 30% (Month 1) → 50% (Month 2) → 60% (Month 3) → 70%+ (Month 6)

---

## Kubernetes & Multi-Environment (FUTURE)

### Docker Configuration
- [ ] Create `backend/Dockerfile` - Multi-stage build
- [ ] Create `backend/.dockerignore`
- [ ] Test containerized build locally

### Multi-Environment Databases
- [ ] Add SQLite support to `Program.cs` for local dev
- [ ] Create `appsettings.Test.json`
- [ ] Create `appsettings.Production.json`
- [ ] Add `Microsoft.EntityFrameworkCore.Sqlite` package

### Azure Resources (Manual)
- [ ] Create Azure Container Registry (ACR)
- [ ] Create test PostgreSQL database
- [ ] Configure Azure Key Vault
- [ ] Add GitHub secrets: AZURE_CREDENTIALS, ACR_USERNAME, ACR_PASSWORD

### Kubernetes Manifests
- [ ] Create `k8s/base/` - Deployment, Service, ConfigMap, Secrets, Ingress, HPA
- [ ] Create `k8s/overlays/dev/`, `test/`, `prod/` - Kustomize overlays
- [ ] Create `k8s/argo-rollouts/` - Canary deployment config

### Cost Considerations
| Setup | Monthly Cost |
|-------|--------------|
| Current (App Service) | ~$25 |
| Azure Container Apps | ~$50 |
| AKS (full) | ~$119 |

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

### Authorization Coverage (COMPLETE)
All controllers now have full `[RequiresPermission]` coverage.

---

## WBS Improvements

> See [CODE_REVIEW_2025-11-20.md](docs/archive/CODE_REVIEW_2025-11-20.md) for full analysis

### Already Fixed:
- [x] Pagination integration in WbsPage
- [x] Full [RequiresPermission] coverage on all 16 endpoints

### Still Pending (HIGH):
- [ ] Transaction support in bulk operations
- [ ] N+1 query optimization
- [ ] Move PaginatedResponse to Core layer
- [ ] Add database indexes for WBS queries
- [ ] Date range validation

### Still Pending (MEDIUM):
- [ ] Add pagination UI controls
- [ ] Add bulk selection UI
- [ ] Build dedicated WBS Approval Queue page

---

## Operational / Quality

### Observability (MEDIUM)
- [ ] Add structured logging/metrics/traces (see Enhanced Logging section)
- [ ] Better error handling and user-friendly error messages

### Performance (LOW)
- [ ] Review N+1 query hot spots
- [ ] Add DB indexes for frequent filter patterns

### Notifications (LOW)
- [ ] Implement invitation email delivery
- [ ] Workflow notification emails

---

## Future / Backlog

- SSO/Entra ID integration
- Advanced reporting/analytics
- Hoteling check-in (mobile) and floorplan visualization
- Admin configuration portal
- AI/OCR on documents

---

## Quick Reference: What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Work Location Templates | Complete | Apply, clone, edit all working |
| Resumes | Complete | Versions, approvals, export, share |
| Resume Attachments | Complete | Azure Blob + local fallback |
| Staffing Requests | Complete | Full approval workflow |
| Staffing Timeline | Basic | Simple bars, not interactive Gantt |
| WBS Management | Mostly Complete | Pagination fixed, bulk ops need refinement |
| Profile Photos | Stubbed | Could use IFileStorageService |
| Authorization | Complete | All controllers protected |
| Automated Tests | Implemented | 55 tests (37 backend + 18 frontend), CI/CD integrated |
| Help System | Complete | Backend + frontend + admin page, context-sensitive help panel |
| Enhanced Logging | Complete | Serilog backend + frontend service with correlation IDs |

---

*Last updated: 2025-12-11*
