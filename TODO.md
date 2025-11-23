# myScheduling - Todo List

## Current Status: Production Ready Core Features ✅

### Quick Start Commands

```bash
# Start Backend API (port 5000)
cd /workspaces/myScheduling/backend/src/MyScheduling.Api
dotnet run

# Start Frontend (port 5173) - in another terminal
cd /workspaces/myScheduling/frontend
npm run dev -- --host 0.0.0.0

# Note: Frontend Vite proxy forwards /api requests to http://localhost:5000
```

---

## 🎯 Active Development Priorities

### 1. Resume Management System 🟡 IN PROGRESS
**Current Focus**: Testing and polish for resume creation/editing workflow

#### Completed ✅
- [x] Resume entity model (ResumeProfile, ResumeSection, ResumeEntry, ResumeVersion)
- [x] Resume approval workflow entities
- [x] Backend API (ResumesController) with full CRUD
- [x] Frontend service layer (resumeService.ts) - **Fixed API client integration**
- [x] Basic resume builder UI
- [x] Skills and certifications tracking

#### In Progress 🔨
- [ ] Test end-to-end resume creation flow
- [ ] Verify resume editing and updates
- [ ] Test resume section management
- [ ] Validate resume approval workflow
- [ ] Test resume document generation

#### Pending Features
- [ ] Resume document export (PDF generation)
- [ ] LinkedIn profile import
- [ ] Resume templates and themes
- [ ] Resume sharing and permissions

---

### 2. Work Location Templates System 🟡 IN PROGRESS
**Current Focus**: Template application and calendar refresh issues

#### Completed ✅
- [x] WorkLocationTemplate entity and relationships
- [x] Template CRUD operations (create, read, update, delete)
- [x] Template application endpoint
- [x] Frontend template UI components
- [x] Template types (Day, Week, Custom)

#### Recently Fixed ✅
- [x] **Navigation property serialization** - Added [JsonIgnore] to prevent circular references
- [x] **Dashboard date range bug** - Added proper date range calculation based on calendar view
- [x] **Cache invalidation** - Fixed React Query cache sync after template application
- [x] **409 Conflict handling** - Added fallback to UPDATE when CREATE fails

#### Current Issues 🐛
- [ ] Template application doesn't immediately update calendar display
- [ ] Manual work location updates may conflict with template-created data
- [ ] Need comprehensive testing of:
  - Applying templates to single week
  - Applying templates across multiple weeks
  - Overwriting existing preferences with templates
  - Calendar refresh after template operations

---

## ✅ Completed Major Features

### Core Infrastructure
- ✅ .NET 8 API with PostgreSQL database
- ✅ React + TypeScript frontend with Vite
- ✅ Tailwind CSS styling
- ✅ Multi-tenant architecture with complete isolation
- ✅ Role-based access control (12 roles)
- ✅ Comprehensive authorization (22+ secured endpoints)

### Work Location Management
- ✅ 6 work location types (Remote, Remote Plus, Client Site, Office No Reservation, Office With Reservation, PTO)
- ✅ Interactive 2-week Monday-Friday calendar
- ✅ Color-coded visual indicators with icons
- ✅ Statistics dashboard
- ✅ Company holidays system (2025-2026 Federal Holidays pre-loaded)
- ✅ Dashboard date range calculation (aligns with visible calendar dates)

### WBS & Project Management
- ✅ Complete WBS workflow (Draft → Pending → Approved/Rejected → Suspended → Closed)
- ✅ Approval system with assigned approvers
- ✅ Bulk operations (submit, approve, reject, close)
- ✅ Change history and audit trail
- ✅ Advanced filtering and search

### User Management
- ✅ User invitations with role templates
- ✅ User deactivation/reactivation
- ✅ Tenant membership management
- ✅ Role assignment and permissions
- ✅ Admin portal (separate from main workspace)

### Security & Authorization
- ✅ Cross-tenant protection
- ✅ Row-level security
- ✅ Role-based access control (RBAC)
- ✅ Manager override capabilities
- ✅ System admin bypass
- ✅ Security audit logging
- ✅ Rate limiting and CORS configuration

---

## 📋 Backlog & Future Enhancements

### Phase 5: Assignments & Staffing Workflows
- [ ] Enhanced assignment approval workflows
- [ ] Capacity planning tools
- [ ] Utilization forecasting
- [ ] Resource conflict detection

### Phase 6: Hoteling Check-in System
- [ ] Real-time desk availability
- [ ] Mobile check-in/check-out
- [ ] Floor plan visualization
- [ ] Space usage analytics

### Phase 7: Reporting & Analytics
- [ ] Custom report builder
- [ ] Staffing utilization reports
- [ ] Work location analytics
- [ ] Export capabilities (PDF, Excel)

### Phase 8: Entra ID Authentication
- [ ] Azure AD integration
- [ ] Single Sign-On (SSO)
- [ ] GCC High compatibility
- [ ] Multi-factor authentication (MFA)

### Phase 9: File Upload to Azure/SharePoint
- [ ] Azure Blob Storage integration
- [ ] SharePoint document library integration
- [ ] File versioning and permissions
- [ ] Document templates

### Phase 10: Admin Configuration Portal
- [ ] System settings management
- [ ] Email notification configuration
- [ ] Integration management (Microsoft 365, Slack)
- [ ] Custom branding and themes

---

## 🐛 Known Issues & Technical Debt

### High Priority
- [ ] Template application calendar refresh (testing in progress)
- [ ] Resume workflow end-to-end testing
- [ ] Password hashing implementation (currently accepts any password)
- [ ] JWT token-based authentication

### Medium Priority
- [ ] N+1 query optimization
- [ ] Comprehensive error handling
- [ ] Enhanced logging throughout API
- [ ] Unit and integration tests

### Low Priority
- [ ] Dark mode implementation
- [ ] Keyboard shortcuts
- [ ] Advanced search across all entities
- [ ] Email notification system

---

## 📝 Recent Work Sessions

### Session 2025-11-23 (Morning) - Fresh Start & Documentation Cleanup ✅
**Goal**: Clean slate for productive day ahead

#### Completed
- [x] Killed and restarted all services (backend + frontend)
- [x] Cleaned up TODO.md with current status
- [x] Updated README.md with latest feature list
- [x] Organized backlog and priorities

---

### Session 2025-11-21 (Late Afternoon) - Template & Dashboard Fixes ✅
**Achievement**: Fixed multiple critical bugs in work location system

#### Issues Resolved
1. **Navigation Property Serialization** ✅
   - Added [JsonIgnore] to WorkLocationTemplateItem navigation properties
   - Fixed circular reference issues in JSON serialization

2. **Dashboard Date Range Bug** ✅
   - Added useMemo to calculate proper date range based on selectedView
   - Dashboard query now includes all visible dates on calendar
   - Fixed issue where template-applied dates weren't in query results

3. **Cache Invalidation After Template Application** ✅
   - Changed from exact queryKey match to predicate-based matching
   - Added explicit refetchQueries calls
   - Made modal await refetch before closing
   - Set staleTime to 0 for immediate staleness detection

4. **409 Conflict Error Handling** ✅
   - Added fallback mechanism in WorkLocationSelector
   - When CREATE fails with 409, fetch existing preference and UPDATE instead
   - Uses proper API client (not raw fetch) for consistency
   - Waits for dashboard refetch after successful update

#### Files Modified
- `backend/src/MyScheduling.Core/Entities/WorkLocationTemplateItem.cs`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/hooks/useTemplates.ts`
- `frontend/src/hooks/useWorkLocation.ts`
- `frontend/src/components/TemplateApplyModal.tsx`
- `frontend/src/components/WorkLocationSelector.tsx`
- `frontend/src/hooks/useDashboard.ts`

---

### Session 2025-11-21 (Afternoon) - Resume Service Fix ✅
**Achievement**: Fixed resume API connection issues

#### Problem
- Resume service using hardcoded `https://localhost:5001` base URL
- Frontend getting ERR_CONNECTION_REFUSED errors
- Inconsistent with rest of application's API client pattern

#### Solution
- Replaced axios with api client from api-client.ts
- Removed hardcoded API_BASE_URL constant
- Updated all 30+ resume API calls to use proper client
- Ensured consistent authentication headers (X-User-Id)

#### Files Modified
- `frontend/src/services/resumeService.ts` (complete rewrite)

---

## 🏗️ Architecture Overview

### Backend Stack
- **.NET 8 Web API** - RESTful services
- **Entity Framework Core 8** - ORM with PostgreSQL
- **PostgreSQL 14+** - Relational database
- **Swagger/OpenAPI** - API documentation

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management

### Database
- **Host**: myscheduling.postgres.database.azure.com
- **Database**: myscheduling
- **User**: aleutstaffing
- **Connection**: Azure PostgreSQL (Development)
- **Target**: Azure Government (Production)

---

## 📊 Test Data Available

- **2 Tenants**: Aleut Federal, Partner Organization
- **100 Employees**: 50 per tenant with full profiles
- **Admin Account**: admin@test.com
- **Test User**: test@test.com (linked to Person record)
- **10 Projects** per tenant with WBS elements
- **Assignments and Bookings** for realistic testing
- **Federal Holidays**: 2025-2026 pre-loaded
- **Office Spaces**: Desks, conference rooms, parking

---

Last Updated: 2025-11-23
Status: Active Development
Version: 1.0.0-beta
