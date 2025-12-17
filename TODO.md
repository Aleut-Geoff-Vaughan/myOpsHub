# TODO - myScheduling

Focused, current backlog. Completed items are documented in `CLAUDE.md` under "Recent Completions".

---

## High Priority

### Auth Hardening
- [ ] Rotate JWT secrets per environment
- [ ] Evaluate SSO/MFA (Entra ID) before production

### Backend Error Improvements
- [ ] Replace generic "An error occurred" messages with structured error responses
- [ ] Add error detail logging before returning 500 responses (40+ controllers)

---

## Medium Priority

### Testing
- [ ] Add more E2E tests (user workflows, staffing flows)
- [ ] Increase backend test coverage to 50%+
- [ ] Increase frontend test coverage to 50%+

### Logging Gaps
- [ ] Create consistent exception logging pattern across all controllers
- [ ] Log exception chain (inner exceptions) not just top-level message
- [ ] Add component/action context to all frontend error logs (45+ services)

### Database Operation Logging
- [ ] Log connection pool exhaustion warnings
- [ ] Log constraint violation details with entity info
- [ ] Add performance logging for queries exceeding threshold (e.g., >500ms)
- [ ] Log transaction deadlock details

### Frontend Error Context
- [ ] Add user action context (what they were doing when error occurred)
- [ ] Add current route/component to error logs

---

## Low Priority

### Performance
- [ ] Review N+1 query hot spots
- [ ] Add DB indexes for frequent filter patterns

### Notifications
- [ ] Implement invitation email delivery
- [ ] Workflow notification emails

### Profile Photos
- [ ] Update profile photo endpoint to use `IFileStorageService`

---

## Future / Backlog

- SSO/Entra ID integration
- Advanced reporting/analytics
- Hoteling check-in (mobile) and floorplan visualization
- Admin configuration portal
- AI/OCR on documents

### Kubernetes & Multi-Environment

> **Full design document:** [docs/KUBERNETES_MIGRATION_PLAN.md](docs/KUBERNETES_MIGRATION_PLAN.md)

**Phase 1 - Database Environment Separation**
- [ ] Create `docker-compose.yml` for local PostgreSQL
- [ ] Create `scripts/refresh-dev-from-prod.ps1`
- [ ] Create `appsettings.Test.json`
- [ ] Test Docker PostgreSQL + prod refresh

**Phase 2 - GitHub Branch Strategy & CI/CD**
- [ ] Create `develop` branch from `main`
- [ ] Configure branch protection rules
- [ ] Create GitHub environments (test, production)
- [ ] Create Azure Key Vault and migrate secrets
- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/deploy-test.yml`
- [ ] Create `.github/workflows/deploy-prod.yml`

**Phase 3 - Azure Container Apps Migration**
- [ ] Create `backend/Dockerfile`
- [ ] Create Azure Container Registry
- [ ] Run `scripts/azure-setup.ps1` for test
- [ ] Deploy to test Container App
- [ ] Run `scripts/azure-setup.ps1` for prod
- [ ] Deploy to prod Container App
- [ ] Switch DNS and decommission App Service

---

## Quick Reference: Feature Status

| Feature | Status |
|---------|--------|
| Work Location Templates | Complete |
| Resumes | Complete |
| Resume Attachments | Complete (Azure Blob + local fallback) |
| Staffing Requests | Complete (full approval workflow) |
| Staffing Timeline | Basic (simple bars, not interactive Gantt) |
| WBS Management | Mostly Complete |
| Profile Photos | Stubbed |
| Authorization | Complete |
| Automated Tests | 224 tests (69 backend + 155 frontend) + E2E |
| Help System | Complete |
| Enhanced Logging | Complete (see CLAUDE.md) |
| File Storage | Complete (Azure Blob) |
| Security Fixes | Complete |

---

*Last updated: 2025-12-15*
