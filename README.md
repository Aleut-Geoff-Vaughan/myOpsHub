# myScheduling - Enterprise Staffing & Work Location Management Platform

A comprehensive web application for managing project staffing, resource allocation, work location preferences, and office hoteling with advanced security and workflow approvals.

## 🎯 Project Overview

This system provides a complete enterprise solution for:
- **Work Location Management**: Track where employees work each day (Remote, Office, Client Site, PTO)
- **Staffing Management**: Assign people to projects and WBS elements with approval workflows
- **WBS Workflow System**: Complete approval workflow for Work Breakdown Structure management
- **Resource Forecasting**: Track utilization and capacity across the organization
- **Office Hoteling**: Book desks, rooms, and conference rooms with check-in tracking
- **Resume Management**: Database-driven employee profiles with skills and certifications
- **Company Holidays**: Federal holidays tracking with admin configuration
- **Multi-Tenant Architecture**: Complete tenant isolation with role-based security
- **Audit Trail**: Complete history of all staffing decisions and assignments

## ✨ Key Features

### Dashboard & Work Location
- **Interactive Calendar View**: Monday-Friday work location planning
- **6 Location Types**: Remote, Remote Plus, Client Site, Office (No Reservation), Office (With Reservation), PTO
- **Visual Indicators**: Color-coded calendar with icons (🏠 Remote, 🏢 Client, 🏛️ Office, 🌴 PTO)
- **2-Week Planning**: Plan work locations for current and next week
- **Statistics Dashboard**: Track remote days, office days, client sites, and unset days
- **Work Location Templates**: Save common schedule patterns for quick reuse
- **Template Types**: Day, Week (5-day), or Custom multi-day templates
- **Template Sharing**: Share templates with team members
- **Multi-Week Application**: Apply templates across multiple weeks at once

### Delegation of Authority (DOA)
- **Self-Authored Letters**: Create delegation letters for travel or PTO
- **Digital Signatures**: Canvas-based signatures with full audit trail
- **Dual Signature Workflow**: Requires both delegator and designee signatures
- **Authority Scopes**: Financial and Operational authority tracking
- **Activation Periods**: Activate DOA for specific date ranges
- **Status Workflow**: Draft → Pending Signatures → Active → Revoked/Expired
- **Large Text Area**: Flexible letter content with user designation
- **Audit Trail**: IP address, user agent, and timestamp for each signature
- **Calendar Integration**: Links to active DOA letters shown on calendar

### WBS (Work Breakdown Structure) Management
- **Complete Workflow**: Draft → Pending Approval → Approved/Rejected → Suspended → Closed
- **Approval System**: Assigned approvers with override capabilities
- **Bulk Operations**: Submit, approve, reject, or close multiple WBS elements at once
- **Change History**: Full audit trail of all WBS changes
- **Advanced Filtering**: Filter by project, type, status, and search across fields
- **Security**: Role-based access with tenant isolation

### Company Holidays
- **Federal Holidays**: Pre-loaded 2025-2026 US Federal Holidays (11 holidays per year)
- **Holiday Types**: Federal, Company, Religious, Cultural, Regional
- **Admin Management**: Full CRUD API for holiday configuration
- **Multi-Tenant**: Holidays properly isolated by tenant

### Security & Authorization
- **Role-Based Access Control (RBAC)**: 11 application roles with granular permissions
- **22 Secured Endpoints**: Comprehensive authorization across 4 core controllers
- **Cross-Tenant Protection**: Users cannot access data outside their tenant
- **Ownership Verification**: Users can only modify their own data (unless manager)
- **Security Audit Logging**: All authorization failures logged for compliance
- **System Admin Bypass**: Special permissions for system administrators

## 🏗️ Architecture

### Tech Stack

**Backend**
- .NET 8 Web API
- Entity Framework Core 8
- PostgreSQL (via Npgsql)
- Swagger/OpenAPI

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router v6 (routing)
- TanStack Query (data fetching)
- Zustand (state management)

**Deployment**
- Development: Azure Commercial
- Production Target: Azure Government
- Authentication Target: Entra ID GCC High

### Project Structure

```
/myScheduling
  /backend
    /src
      /MyScheduling.Api              # Web API endpoints & controllers
      /MyScheduling.Core             # Domain entities & enums
      /MyScheduling.Infrastructure   # Data layer, DbContext, migrations
  /frontend
    /src
      /components                    # Reusable UI components
      /pages                         # Page components
      /stores                        # Zustand state stores
      /hooks                         # React Query hooks
      /services                      # API client services
      /types                         # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- PostgreSQL 14+

### Quick Start

**Backend Setup**
```bash
# Navigate to backend API directory
cd backend/src/MyScheduling.Api

# Apply database migrations
dotnet ef database update

# Start the API (runs on port 5107)
dotnet run
```

API will be available at: `http://localhost:5107`
Swagger UI: `http://localhost:5107/swagger`

**Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the dev server (runs on port 5173)
npm run dev -- --host 0.0.0.0
```

Frontend will be available at: `http://localhost:5173`

**Test Accounts**
- Admin: `admin@test.com`
- User: `test@test.com` (has Person record with full test data)

## 📊 Database Schema

### Core Entities

**Identity & Tenancy**
- `Tenant` - Multi-tenant isolation
- `User` - User accounts (linked to Entra ID)
- `TenantMembership` - User membership in tenants with roles (JSONB array)
- `RoleAssignment` - Deprecated, replaced by TenantMembership.Roles

**People & Resume**
- `Person` - Employee/contractor records
- `ResumeProfile`, `ResumeSection`, `ResumeEntry` - Structured resumes
- `ResumeVersion`, `ResumeDocument`, `ResumeApproval` - Version control and approvals
- `Skill`, `PersonSkill` - Skills tracking with proficiency levels
- `Certification`, `PersonCertification` - Certifications with expiry

**Projects & WBS**
- `Project` - Programs and projects
- `WbsElement` - Work Breakdown Structure with workflow (Draft/Approved/Closed)
- `WbsChangeHistory` - Complete audit trail of WBS changes

**Staffing**
- `ProjectRole` - Open seats/roles on projects
- `Assignment` - Person assigned to role/WBS with approvals
- `AssignmentHistory` - Audit trail

**Hoteling & Work Location**
- `Office`, `Space` - Physical locations and bookable spaces
- `Booking` - Space reservations with check-in tracking
- `CheckInEvent` - Check-in/check-out events
- `WorkLocationPreference` - Daily work location tracking
- `CompanyHoliday` - Federal and company holidays
- `FacilityPermission`, `SpaceMaintenanceLog` - Facilities management

**File Storage**
- `StoredFile` - File metadata with Azure Blob/SharePoint storage
- `FileAccessLog` - File access audit trail
- `SharePointConfiguration` - SharePoint integration settings

**Validation Framework**
- `ValidationRule` - Dynamic validation rules with expression engine

## 🔐 Security & Authorization

### Application Roles
1. **Employee** - Basic user access
2. **ViewOnly** - Read-only access across tenant
3. **TeamLead** - Team management capabilities
4. **ProjectManager** - Project and WBS management
5. **ResourceManager** - Resource allocation and assignments
6. **OfficeManager** - Office and space management
7. **TenantAdmin** - Full tenant administration
8. **Executive** - Executive reporting access
9. **OverrideApprover** - Can override approval workflows
10. **SystemAdmin** - System-wide administration
11. **Support** - Support team access
12. **Auditor** - Audit and compliance access

### Secured Controllers (22 Endpoints)

**WbsController** (9 endpoints)
- Authorization: ProjectManager, ResourceManager, OverrideApprover, TenantAdmin
- Submit for approval, Approve, Reject, Suspend, Close workflows
- Bulk operations with individual validation

**WorkLocationPreferencesController** (4 endpoints)
- Authorization: Employees (own data), Managers (all data)
- CRUD operations for work location preferences

**AssignmentsController** (5 endpoints)
- Authorization: TeamLead, ProjectManager, ResourceManager, TenantAdmin
- Create, update, delete, approve assignments
- Overlap detection and validation

**BookingsController** (4 endpoints)
- Authorization: Employees (own bookings), OfficeManager (all bookings)
- Space booking with availability checking

### Security Features
- ✅ Cross-tenant isolation enforced at data layer
- ✅ Row-level authorization checks on all mutations
- ✅ Ownership verification (users manage their own data)
- ✅ Manager override capabilities
- ✅ System admin bypass for administrative tasks
- ✅ Comprehensive security audit logging
- ✅ UTC DateTime handling for PostgreSQL compatibility

## 🎨 Frontend Features

### Completed Pages
- ✅ **Dashboard** - Work location calendar with 2-week view
- ✅ **WBS Management** - Full WBS workflow with advanced filtering
- ✅ **People Directory** - Employee listing and management
- ✅ **Resume Builder** - Comprehensive resume creation and management
- ✅ **Resume Detail** - View and edit structured resumes

### UI Components
- Advanced filtering and search
- Skeleton loaders for better UX
- Error boundaries for resilience
- Responsive design (mobile-ready)
- Color-coded status indicators
- Toast notifications for user feedback

## 📈 Development Progress

### ✅ Phase 1: Foundation (COMPLETED)
- [x] .NET 8 API with PostgreSQL
- [x] Complete entity model (all domains)
- [x] EF Core migrations
- [x] React + TypeScript frontend
- [x] Tailwind CSS styling
- [x] Login page and dashboard
- [x] Protected routes with role-based navigation

### ✅ Phase 2: WBS & Work Location (COMPLETED)
- [x] WBS entity with workflow states
- [x] WBS approval system with assigned approvers
- [x] WBS bulk operations (submit, approve, reject, close)
- [x] Work location preferences (6 types)
- [x] Dashboard calendar (Monday-Friday, 2-week view)
- [x] Company holidays system with Federal holidays
- [x] Complete authorization for WBS workflows

### ✅ Phase 3: Security Hardening (COMPLETED)
- [x] Role-based access control (RBAC) implementation
- [x] Cross-tenant protection across all controllers
- [x] 22 endpoints secured with authorization
- [x] Security audit logging
- [x] Ownership verification for personal data
- [x] Manager override capabilities
- [x] DateTime UTC handling for PostgreSQL

### 🔄 Phase 4: Resume Management (IN PROGRESS)
- [x] Resume entity model
- [x] Resume builder UI
- [x] Skills and certifications
- [ ] Resume approval workflow
- [ ] Resume document generation
- [ ] LinkedIn import

### 📋 Upcoming Phases
- Phase 5: Assignments & Staffing Workflows
- Phase 6: Hoteling Check-in System
- Phase 7: Reporting & Analytics
- Phase 8: Entra ID Authentication
- Phase 9: File Upload to Azure/SharePoint
- Phase 10: Admin Configuration Portal

## 🔧 API Endpoints

### Authentication & Users
```
GET  /api/users                      # List users
POST /api/users                      # Create user
GET  /api/users/{id}                 # Get user
PUT  /api/users/{id}                 # Update user
```

### WBS Management
```
GET  /api/wbs                        # List WBS elements
POST /api/wbs                        # Create WBS
PUT  /api/wbs/{id}                   # Update WBS
POST /api/wbs/{id}/submit            # Submit for approval
POST /api/wbs/{id}/approve           # Approve WBS
POST /api/wbs/{id}/reject            # Reject WBS
POST /api/wbs/{id}/suspend           # Suspend WBS
POST /api/wbs/{id}/close             # Close WBS
POST /api/wbs/bulk-submit            # Bulk submit
POST /api/wbs/bulk-approve           # Bulk approve
POST /api/wbs/bulk-reject            # Bulk reject
```

### Work Location & Holidays
```
GET  /api/worklocationpreferences    # Get preferences
POST /api/worklocationpreferences    # Create preference
PUT  /api/worklocationpreferences/{id} # Update preference
DELETE /api/worklocationpreferences/{id} # Delete preference
GET  /api/holidays                   # List holidays (filter by year, type)
POST /api/holidays                   # Create holiday (TenantAdmin only)
PUT  /api/holidays/{id}              # Update holiday (TenantAdmin only)
DELETE /api/holidays/{id}            # Delete holiday (TenantAdmin only)
```

### Dashboard
```
GET  /api/dashboard?userId={guid}    # Get dashboard data
  Returns: {person, preferences, assignments, bookings, stats}
```

### Assignments & Bookings
```
GET  /api/assignments                # List assignments
POST /api/assignments                # Create assignment
POST /api/assignments/{id}/approve   # Approve assignment
GET  /api/bookings                   # List bookings
POST /api/bookings                   # Create booking
PUT  /api/bookings/{id}              # Update booking
```

## 📝 Environment Configuration

**Backend** (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=myscheduling;Username=postgres;Password=MehCPd08tF1mATnXLEWJR8HT"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

**Frontend** (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5107',
        changeOrigin: true,
      },
    },
  },
})
```

## 🧪 Testing

### Test Data
The database seeder creates comprehensive test data:
- 2 tenants (Aleut Federal, Partner Organization)
- Admin user (`admin@test.com`)
- Test user (`test@test.com`) with full Person record
- 50 employees per tenant
- 10 projects per tenant
- 20-30 WBS elements per tenant
- Work location preferences for test user
- Federal holidays for 2025-2026
- Assignments, bookings, and office spaces

### Running Tests
```bash
# Backend
cd backend
dotnet test

# Frontend
cd frontend
npm run test
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and ensure build succeeds
4. Update TODO.md with work session notes
5. Submit a pull request

## 📄 License

Copyright © 2025 Aleut Federal. All rights reserved.

## 🆘 Support

For issues or questions, contact the development team or create an issue in this repository.

---

**Last Updated**: November 21, 2025
**Version**: 1.0.0-beta
**Status**: Active Development
