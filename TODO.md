# myScheduling - Todo List

## Current Status

### Quick Start Commands

```bash
# Start Backend API (port 5000)
cd /workspaces/myScheduling/backend/src/MyScheduling.Api
dotnet run --urls "http://0.0.0.0:5000"

# Start Frontend (port 5173) - in another terminal
cd /workspaces/myScheduling/frontend
npm run dev -- --host 0.0.0.0
```

---

## Active Priority Tasks

### 3. Authentication (HIGH PRIORITY) 🔴
- [x] Implement real authentication API endpoint (replace mock auth) ✅ **COMPLETED 2025-11-19**
  - Created `AuthController` with `/api/auth/login` and `/api/auth/logout` endpoints
  - Login validates user email against database
  - Returns user profile with tenant information and roles
  - Password validation simplified for development (accepts any password)
- [x] Removed all mock authentication code ✅ **COMPLETED 2025-11-19**
  - Replaced mock tenants list in LoginPage with real API call to `/api/tenants`
  - Removed mock user creation in authStore
  - Created `authService.ts` for authentication API calls
  - Updated `authStore.ts` to use real API authentication
- [ ] Add JWT token generation and validation
- [ ] Add authentication middleware to protect API endpoints
- [ ] Add password hashing (bcrypt) and verification
- [ ] Implement proper role-based access control (RBAC)


### 10. User Management Enhancements (HIGH PRIORITY) 🔴
**Goal**: Implement two-tiered administration with enhanced user management and role hierarchy

**Current Phase**: Phase 3 - User Lifecycle & Advanced Features

#### Phase 2: Role Management & Permissions ✅ **COMPLETED 2025-11-20**
- [x] Created separate Admin Portal (not embedded in main app) ✅ **COMPLETED 2025-11-19**
  - Created AdminLayout component with purple branding
  - Separate routing for `/admin` path
  - WorkspaceSelectorPage redirects admins to admin portal
  - Removed Admin nav item from main DashboardLayout
- [x] Define comprehensive role permission matrix ✅ **COMPLETED 2025-11-20**
  - Created ROLES_PERMISSIONS.md with detailed permission matrix
  - Documented 12 roles across system and tenant levels
  - Defined CRUD permissions for all features
  - Included role assignment rules and valid combinations
- [x] Create role management API endpoints ✅ **COMPLETED 2025-11-20**
  - POST `/api/tenant-memberships` - Add user to tenant with roles
  - PUT `/api/tenant-memberships/{id}/roles` - Update user roles
  - PUT `/api/tenant-memberships/{id}/status` - Update membership status
  - DELETE `/api/tenant-memberships/{id}` - Remove user from tenant
  - GET `/api/tenant-memberships/roles` - Get available roles with descriptions
  - Created TenantMembershipsController with full CRUD operations
- [x] Add inline role editing in AdminPage ✅ **COMPLETED 2025-11-20**
  - Edit button on each tenant membership row
  - Multi-select RoleSelector component with descriptions
  - Save/Cancel buttons for inline editing
  - Role validation (must have at least one role)
  - Toast notifications for success/error feedback
- [x] Implement Tenant Admin Panel view ✅ **COMPLETED 2025-11-20**
  - Scope selector: "System Admin (All Tenants)" vs "Tenant Admin"
  - Filter users by current workspace tenant
  - Only visible to System Admins
  - Maintains context when switching views
- [x] Add role templates/presets ✅ **COMPLETED 2025-11-20**
  - Created RoleTemplates component with 9 preset templates
  - Templates: Employee, View Only, Team Lead, Project Manager, Resource Manager, Office Manager, Department Manager, Executive, Tenant Admin
  - Visual template cards with icons and descriptions
  - Integrated into inline role editing workflow
  - "or customize" divider for manual role selection

#### Phase 3: User Lifecycle & Advanced Features (IN PROGRESS)
- [x] User invitation flow ✅ **COMPLETED 2025-11-20**
  - Created UserInvitation entity with token-based invitations
  - UserInvitationsController with full CRUD endpoints
  - InviteUserModal component with role selection
  - PendingInvitations component for managing invitations
  - 7-day expiration with resend/cancel functionality
  - Role templates for quick invitation setup
  - TODO: Email sending implementation
- [x] User deactivation/reactivation ✅ **COMPLETED 2025-11-20**
  - Added IsActive, DeactivatedAt, DeactivatedByUserId to User entity
  - Soft delete pattern with audit trail
  - Deactivate endpoint with cascading tenant membership deactivation
  - Reactivate endpoint (memberships require manual reactivation)
  - Prevention of system admin deactivation
  - AdminPage UI with deactivate/reactivate buttons
  - Status badges showing deactivation state
- [ ] User profile management
  - Users can update their own profile
  - Profile photo upload
  - Skills and certifications management
- [ ] User activity tracking
  - Track login history
  - Track user actions (audit trail)
  - Last active timestamp display

### 11. Reports Page (NEW)
- [ ] Create Reports page component (currently just placeholder text)
  - Staffing utilization reports
  - Project status reports
  - Hoteling usage reports
  - Export capabilities (PDF, Excel)

### 12. Backend Enhancements
- [ ] Add audit trail user context in DbContext SaveChangesAsync
  - Capture current user ID
  - Auto-populate CreatedBy/UpdatedBy fields
- [ ] Add data validation and business rules
- [ ] Add comprehensive error handling
- [ ] Add logging throughout the API
- [ ] Implement filtering, sorting, pagination on all list endpoints

### 13. Documentation (Optional)
- [] Update README.md with current implementation status
- [] Update START-HERE.md (fix database user mismatch, remove Azure AD references)
- [] Remove exposed passwords from SECURITY-FIXES.md and DATABASE-MIGRATION-SUCCESS.md
- [] Update SIMPLE-SETUP.md (remove references to non-existent setup scripts)

---

## Technical Debt & Future Enhancements

### Security
- [ ] Implement row-level security for multi-tenancy
- [ ] Add HTTPS/SSL configuration for production

### Testing
- [ ] Add unit tests for backend services (DEFERRED)
- [ ] Add integration tests for API endpoints (DEFERRED)
- [ ] Add frontend component tests (DEFERRED)
- [ ] Add end-to-end tests

### Performance
- [ ] Optimize N+1 query issues

### UI/UX
- [ ] Add keyboard shortcuts
- [ ] Implement dark mode

### NEW FEATURES
- [ ] Add Master Data Management for Projects / WBS.   This should have attributes of owners for workflows eventually.    I also want easy way to Validity dates + WBS types (billable / Billable / B&P / OH / G&A)
- [ ] Add Master Data Management for Facilities.  Make it role based too.
- [ ] Create a framework for non-hardcoded validation of main transaction objects.   I would want to have the ability to do Sudo Code and its stored dynamically without hardcoding

### Features
- [ ] Email notifications for assignments, bookings
- [ ] Calendar integration (Outlook, Google Calendar)
- [ ] Advanced search and filtering
- [ ] Bulk operations (bulk assign, bulk book)
- [ ] Export data to various formats
- [ ] Reporting and analytics dashboard
- [ ] File attachments for people, projects
- [ ] Comments and collaboration features

---

## Architecture Overview

### Backend (.NET 8)
- **MyScheduling.Api** - REST API controllers with rate limiting and caching
- **MyScheduling.Core** - Domain entities, interfaces, and pagination helpers
- **MyScheduling.Infrastructure** - EF Core, repositories, data access with optimized indexes

### Frontend (React + TypeScript)
- **Vite** - Build tool
- **React Router** - Navigation
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling

### Database
- **PostgreSQL** on Azure (myscheduling.postgres.database.azure.com)
- Database: `myscheduling`
- User: `aleutstaffing`

---

## Completed Tasks

### 1. Verify Database Seeding ✅ **COMPLETED**
- [x] Confirm 100 people in database (50 per tenant)
- [x] Verify all related records created successfully
- [x] Test API endpoints return seeded data
- ✅ Database seeder with comprehensive test data
  - 2 tenants (Aleut Federal, Partner Organization)
  - 100 employees total (50 per tenant)
  - Projects, WBS elements, project roles
  - Assignments (60-80 per tenant)
  - Offices, spaces (desks and conference rooms)
  - Bookings (past 14 days and next 14 days)

### 2. Frontend API Integration ✅ **COMPLETED 2025-11-19**
- [x] **People Page** - Connected to `/api/people` endpoint ✅
- [x] **Projects Page** - Connected to `/api/projects` endpoint ✅
- [x] **Staffing Page** - Connected to `/api/assignments` endpoint ✅
- [x] **Hoteling Page** - Connected to `/api/bookings` and `/api/spaces` endpoints ✅
- [x] **Admin Page** - Connected to `/api/tenants` and `/api/users` endpoints ✅
- [x] Fixed JSON serialization circular reference errors in API
- [x] Created service layer for all entities (projectsService, assignmentsService, bookingsService, tenantsService)
- [x] Created React Query hooks for all entities (useProjects, useAssignments, useBookings, useTenants, useUsers)
- [x] Updated TypeScript types for Space, Office, and SpaceType enum

### 4. People Page Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Add onClick handler to '+ Add Person' button ✅
  - Created PersonModal component with full CRUD form
  - Integrated with POST `/api/people` endpoint
  - Added validation and error handling
- [x] Replace console.log with navigation for person row clicks ✅
  - Table rows now open PersonModal in edit mode
  - Modal shows all person details and allows editing

### 5. Projects Page Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Add onClick handler to '+ New Project' button ✅
  - Created ProjectModal component with full CRUD form
  - Integrated with POST `/api/projects` endpoint
  - Added date validation and tenant selection
- [x] Replace console.log with navigation for project row clicks ✅
  - Table rows now open ProjectModal in edit mode
  - Modal shows all project details and allows editing

### 6. Staffing Page Enhancements ✅ **PARTIALLY COMPLETED 2025-11-19**
- [x] Add onClick handler to '+ New Assignment' button ✅
  - Created AssignmentModal component with full CRUD form
  - Integrated with POST `/api/assignments` endpoint
  - Added person/tenant dropdowns and allocation validation
- [x] Replace console.log with navigation for assignment row clicks ✅
  - Table rows now open AssignmentModal in edit mode
- [x] Implement **Requests** tab functionality ✅ **COMPLETED 2025-11-19**
  - Shows table of pending and draft assignments
  - Added Approve/Reject action buttons
  - Clicking rows opens assignment modal for details

### 7. Hoteling Page Enhancements ✅ **PARTIALLY COMPLETED 2025-11-19**
- [x] Add onClick handler to '+ New Booking' button ✅
  - Created BookingModal component with full CRUD form
  - Integrated with POST `/api/bookings` endpoint
  - Added office/space selection with cascading dropdowns
  - Added date/time pickers for booking duration
- [x] Replace console.log placeholders with navigation/actions ✅
  - Table rows now open BookingModal in edit mode
  - Quick action cards open modal for new bookings
- [x] Add onClick handler to 'Export Schedule' button ✅ **COMPLETED 2025-11-19**
  - Implemented CSV export functionality
  - Downloads filtered bookings for selected date
  - Includes all booking details (ID, person, space, times, status)

### 6. Staffing Page Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Implement **Capacity View** tab content ✅
  - Created capacity summary cards (Under/Optimal/Over allocated)
  - Built person utilization view grouping assignments by person
  - Visual capacity bars showing total allocation percentage
  - Color-coded indicators (green/blue/red) for allocation levels
  - Clickable assignment details for editing
  - Displays up to 10 people with active assignments

### 7. Hoteling Page Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Add onClick handler to 'View Floor Plan' button ✅
  - Created interactive floor plan modal
  - Visual grid layout showing all spaces
  - Color-coded availability (green=available, red=booked, gray=unavailable)
  - Space type icons (desk, conference room)
  - Click-to-book functionality for available spaces
  - Real-time booking status
  - Space statistics summary

### 8. Dashboard Page Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Implement onClick handler for 'Request Assignment' button ✅
  - Opens AssignmentModal for creating new assignment request
- [x] Implement onClick handler for 'Book Desk' button ✅
  - Opens BookingModal for creating new desk/room booking
- [x] Implement onClick handler for 'Update Resume' button ✅
  - Created resume upload modal with file picker
  - Accepts PDF, DOC, DOCX formats
  - Shows file preview with name and size
  - Optional notes field
  - Upload button with validation

### 9. Admin Page Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Implement Add Tenant/User modal forms ✅
  - Created full tenant creation form (name, code, status)
  - Created full user creation form (tenant, name, email, Azure AD ID)
  - Integrated with POST endpoints via React Query mutations
  - Form validation and error handling
  - Auto-refresh lists after creation
- [x] Replace console.log with navigation for tenant/user rows ✅
  - Created detail modal showing full tenant/user information
  - Displays all fields including ID, timestamps, status
  - Clean read-only view of entity details
- [x] Implement Settings form handlers ✅
  - System settings toggles (email notifications, 2FA, self-registration, maintenance mode)
  - Security settings inputs (session timeout, password length, failed login attempts)
  - Save button with handler (console log for now, ready for API integration)
  - All settings stored in React state
- [x] Add onClick handlers to integration Configure/Manage buttons ✅
  - Microsoft 365 configuration handler (placeholder alert)
  - Slack integration handler (placeholder alert)
  - API management handler (placeholder alert)
  - Ready for future modal implementations

### 10. Security Enhancements ✅ **COMPLETED 2025-11-19**
- [x] Implement rate limiting ✅
  - Added AspNetCoreRateLimit package
  - Configured IP-based rate limiting (100 req/min general, 10 req/min for auth)
  - Rate limit middleware integrated into pipeline
- [x] Add CORS configuration for production ✅
  - Environment-specific CORS policy
  - Development: Allow all origins
  - Production: Restrict to configured origins

### 11. Performance Optimizations ✅ **COMPLETED 2025-11-19**
- [x] Implement caching ✅
  - Added in-memory caching services
  - Response caching middleware configured
  - Ready for Redis upgrade if needed
- [x] Add database indexes for common queries ✅
  - Comprehensive indexes already configured in DbContext
  - Indexes on tenant queries, email lookups, status filters
  - Composite indexes for common query patterns
- [x] Implement pagination helper classes ✅
  - Created PagedResult<T> generic class
  - Created PaginationParams with max page size enforcement
  - Ready for integration into controllers

### 12. UI/UX Improvements ✅ **COMPLETED 2025-11-19**
- [x] Add loading states throughout the app ✅
  - TanStack Query provides isLoading states
  - Loading indicators in all data-fetching components
- [x] Implement error boundaries ✅
  - ErrorBoundary component wrapping entire app
  - Catches and displays React errors gracefully
- [x] Add toast notifications for success/error messages ✅
  - Integrated react-hot-toast library
  - Configured with custom styling
  - Added to login flow as example
- [x] Improve mobile responsiveness ✅
  - All UI components use responsive Tailwind classes
  - Dashboard layout has mobile-friendly sidebar toggle
  - Tables and cards responsive across breakpoints

### 10. User Management Enhancements - Phase 1 ✅ **COMPLETED 2025-11-19**
- [x] Update User entity with additional fields ✅
  - Added PhoneNumber (string, optional)
  - Added JobTitle (string, optional)
  - Added Department (string, optional)
  - Added LastLoginAt (DateTime?, nullable)
  - Added ProfilePhotoUrl (string, optional)
- [x] Create database migration for new User fields ✅
  - Migration `AddUserProfileFields` created and applied successfully
- [x] Add TenantAdmin role to AppRole enum ✅
  - Added comprehensive two-tiered role hierarchy
  - Tenant-Level: Employee, ViewOnly, TeamLead, ProjectManager, ResourceManager, OfficeManager, TenantAdmin, Executive, OverrideApprover
  - System-Level: SystemAdmin, Support, Auditor
- [x] Build enhanced user table component ✅
  - Shows: Display Name, Email, Phone, Job Title, Department
  - Shows: Status (System Admin badge, Tenant count), Last Login, Created Date
  - Expandable rows showing tenant memberships with roles
  - Role badges with color-coded display
  - Expand/collapse functionality with animated chevron
- [x] Update UsersController to support filtered queries ✅
  - System-wide query (no tenantId parameter - returns all users)
  - Tenant-specific query (with tenantId parameter - returns users in that tenant)
  - Includes TenantMemberships with related Tenant data
  - Search by name or email
  - Filter to include/exclude inactive memberships
- [x] Update TypeScript types to match backend ✅
  - Added AppRole enum matching backend values
  - Created TenantMembership interface with roles array
  - Updated User interface with new profile fields and tenantMemberships
- [x] Enhanced User Detail Modal ✅
  - Shows all new profile fields (phone, job title, department)
  - Displays System Admin status badge
  - Shows Last Login timestamp
  - Lists all tenant memberships with roles
  - Role badges for each membership
- [x] Created separate Admin Portal ✅
  - Created AdminLayout component with purple branding
  - Separate routing for `/admin` path
  - WorkspaceSelectorPage redirects admins to admin portal
  - Removed Admin nav item from main DashboardLayout

---

## Notes

- Database is fully seeded with test data - ready for development
- Frontend pages now have full CRUD modals integrated
- **Priority Groups 6, 7, 8, and 9 completed** - All remaining UI enhancements done
- **Authentication implementation started** - Real API endpoints created, mock code removed ✅
- API endpoints exist and work - fully integrated with frontend
- All core CRUD operations functional for People, Projects, Assignments, and Bookings
- Capacity view, floor plan, dashboard actions, and admin forms all implemented

---

## Code Review Findings (2025-11-19)

### ✅ Completed Fixes
1. **Removed All Mock Data References**
   - Eliminated mock tenant list in LoginPage (now uses `/api/tenants`)
   - Removed mock authentication in authStore (now uses `/api/auth/login`)
   - Created proper authentication service layer

2. **Fixed Login Screen**
   - Login screen now displays properly
   - Fetches real tenants from database
   - Shows system health status
   - Updated helper text with actual test user examples

3. **Created Authentication Infrastructure**
   - Added `AuthController.cs` with login/logout endpoints
   - Created `authService.ts` for frontend API calls
   - Updated `authStore.ts` to use real authentication
   - Login validates against database users
   - Returns user profile with tenant context

### ⚠️ Known Issues & Recommendations

#### Security (High Priority)
- [ ] **Password Security**: Currently accepts any password for development
  - **Recommendation**: Implement bcrypt password hashing
  - **Action**: Add password field to User entity, hash on creation

- [ ] **JWT Tokens**: No token-based authentication yet
  - **Recommendation**: Implement JWT for stateless authentication
  - **Action**: Add JWT middleware, generate tokens on login

- [ ] **API Protection**: No authentication middleware on endpoints
  - **Recommendation**: Add `[Authorize]` attributes to controllers
  - **Action**: Protect all endpoints except `/api/auth/login` and `/api/health`

#### Data Model Issues
- [ ] **Tenant Code**: Tenant entity missing `Code` property
  - **Current**: Tenants only have `Name` and `Status`
  - **Recommendation**: Add `Code` property for tenant identification
  - **Impact**: Frontend expects `code` field for display

#### Testing Needs
- [ ] **End-to-End Testing Required**
  - Login flow needs verification
  - All CRUD operations need testing
  - Modal forms need validation testing
  - Navigation between pages needs testing

### 📋 Next Steps (Prioritized)
1. **Test login functionality** with real database users
2. **Test all page navigation** and button functionality
3. **Add JWT authentication** and middleware
4. **Implement password hashing** for security
5. **Add comprehensive error handling** throughout app
6. **Implement API endpoint protection** with authorization

---

Last Updated: 2025-11-19
