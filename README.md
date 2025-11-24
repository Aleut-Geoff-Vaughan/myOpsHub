# myScheduling - Enterprise Staffing & Work Location Management Platform

A comprehensive web application for managing project staffing, resource allocation, work location preferences, and office hoteling with advanced security and workflow approvals.

## 🎯 Project Overview

myScheduling is an enterprise solution providing:
- **Work Location Management**: Daily tracking with 6 location types (Remote, Remote Plus, Client Site, Office, Office + Reservation, PTO)
- **Work Location Templates**: Save and apply schedule patterns across weeks
- **Staffing Management**: Project assignments with approval workflows
- **WBS Workflow System**: Complete approval workflow for Work Breakdown Structure management
- **Resource Forecasting**: Utilization and capacity tracking
- **Office Hoteling**: Desk and room booking with check-in tracking
- **Resume Management**: Database-driven employee profiles with skills and certifications
- **Company Holidays**: Federal holidays tracking with admin configuration
- **Multi-Tenant Architecture**: Complete tenant isolation with role-based security

## ✨ Key Features

### Dashboard & Work Location ✅
- **Interactive 2-Week Calendar**: Monday-Friday work location planning
- **6 Location Types**: Remote, Remote Plus, Client Site, Office (No Reservation), Office (With Reservation), PTO
- **Visual Calendar**: Color-coded with icons (🏠 Remote, 🏢 Client, 🏛️ Office, 🌴 PTO)
- **Statistics Dashboard**: Track remote days, office days, client sites, and unset days
- **Work Location Templates**: Save common schedule patterns for quick reuse
- **Template Types**: Day, Week (5-day), or Custom multi-day templates
- **Multi-Week Application**: Apply templates across multiple weeks at once

### WBS (Work Breakdown Structure) Management ✅
- **Complete Workflow**: Draft → Pending Approval → Approved/Rejected → Suspended → Closed
- **Approval System**: Assigned approvers with override capabilities
- **Bulk Operations**: Submit, approve, reject, or close multiple WBS elements at once
- **Change History**: Full audit trail of all WBS changes
- **Advanced Filtering**: Filter by project, type, status, and search across fields

### Security & Authorization ✅
- **Role-Based Access Control (RBAC)**: 12 application roles with granular permissions
- **22+ Secured Endpoints**: Comprehensive authorization across controllers
- **Cross-Tenant Protection**: Users cannot access data outside their tenant
- **Ownership Verification**: Users can only modify their own data (unless manager)
- **Security Audit Logging**: All authorization failures logged for compliance
- **System Admin Bypass**: Special permissions for system administrators

### User Management ✅
- **User Invitations**: Token-based invitations with role templates
- **Role Management**: Inline role editing with 9 preset templates
- **Tenant Memberships**: Multi-role assignments per tenant
- **User Lifecycle**: Activation, deactivation, reactivation workflows
- **Admin Portal**: Separate interface for system administrators

## 🏗️ Tech Stack

### Backend
- **.NET 8 Web API** - RESTful services
- **Entity Framework Core 8** - ORM with code-first migrations
- **PostgreSQL 14+** - Relational database (Azure hosted)
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 18 + TypeScript** - Type-safe UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management

### Deployment Target
- **Development**: Azure Commercial
- **Production**: Azure Government
- **Authentication**: Entra ID GCC High (planned)

## 🚀 Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 18+ and npm
- PostgreSQL 14+

### Backend Setup
```bash
# Navigate to API directory
cd backend/src/MyScheduling.Api

# Apply database migrations
dotnet ef database update

# Start the API (runs on port 5000)
dotnet run
```

API available at: `http://localhost:5000`
Swagger UI: `http://localhost:5000/swagger`

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start dev server (runs on port 5173)
npm run dev -- --host 0.0.0.0
```

Frontend available at: `http://localhost:5173`

### Test Accounts
- **Admin**: `admin@test.com`
- **Test User**: `test@test.com` (has Person record with full test data)

## 📊 Database

**Connection**: Azure PostgreSQL
**Host**: myscheduling.postgres.database.azure.com
**Database**: myscheduling
**User**: aleutstaffing

### Core Entities

**Identity & Tenancy**
- Tenant - Multi-tenant isolation
- User - User accounts (linked to Entra ID)
- TenantMembership - User membership with roles (JSONB array)

**People & Resumes**
- Person - Employee/contractor records
- ResumeProfile, ResumeSection, ResumeEntry - Structured resumes
- ResumeVersion, ResumeApproval - Version control and approvals
- Skill, Certification - Skills and certifications tracking

**Projects & WBS**
- Project - Programs and projects
- WbsElement - Work Breakdown Structure with workflow
- WbsChangeHistory - Complete audit trail

**Staffing**
- ProjectRole - Open seats/roles on projects
- Assignment - Person assigned to role/WBS with approvals
- AssignmentHistory - Audit trail

**Hoteling & Work Location**
- Office, Space - Physical locations and bookable spaces
- Booking - Space reservations with check-in tracking
- WorkLocationPreference - Daily work location tracking
- WorkLocationTemplate, WorkLocationTemplateItem - Schedule templates
- CompanyHoliday - Federal and company holidays

## 🔐 Security & Roles

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

### Security Features
- ✅ Cross-tenant isolation enforced at data layer
- ✅ Row-level authorization checks on all mutations
- ✅ Ownership verification (users manage their own data)
- ✅ Manager override capabilities
- ✅ System admin bypass for administrative tasks
- ✅ Comprehensive security audit logging
- ✅ UTC DateTime handling for PostgreSQL compatibility

## 📈 Development Status

### ✅ Completed Features
- Complete work location management with templates
- WBS workflow system with approvals
- User management with invitations and roles
- Security hardening (22+ secured endpoints)
- Dashboard with 2-week calendar view
- Company holidays system
- Multi-tenant architecture

### 🔄 In Progress
- **Resume Management**: Testing resume creation/editing workflow
- **Work Location Templates**: Comprehensive testing of template application

### 📋 Planned Features
- Phase 5: Enhanced assignments & staffing workflows
- Phase 6: Hoteling check-in system with mobile support
- Phase 7: Reporting & analytics dashboard
- Phase 8: Entra ID authentication integration
- Phase 9: File upload to Azure/SharePoint
- Phase 10: Admin configuration portal

## 🧪 Test Data

The database is seeded with comprehensive test data:
- 2 tenants (Aleut Federal, Partner Organization)
- 100 employees (50 per tenant)
- 10 projects per tenant
- 20-30 WBS elements per tenant
- Work location preferences for test user
- Federal holidays for 2025-2026
- Assignments, bookings, and office spaces

## 📝 API Endpoints

### Authentication
```
POST /api/auth/login    # User login
POST /api/auth/logout   # User logout
```

### Dashboard
```
GET /api/dashboard?userId={guid}&startDate={date}&endDate={date}
    Returns: {person, preferences, assignments, bookings, stats}
```

### Work Location
```
GET    /api/worklocationpreferences    # Get preferences (with filters)
POST   /api/worklocationpreferences    # Create preference
PUT    /api/worklocationpreferences/{id}    # Update preference
DELETE /api/worklocationpreferences/{id}    # Delete preference
POST   /api/worklocationpreferences/bulk    # Bulk create/update
```

### Work Location Templates
```
GET    /api/worklocationtemplates    # List templates
POST   /api/worklocationtemplates    # Create template
PUT    /api/worklocationtemplates/{id}    # Update template
DELETE /api/worklocationtemplates/{id}    # Delete template
POST   /api/worklocationtemplates/{id}/apply    # Apply template to dates
```

### WBS Management
```
GET  /api/wbs                # List WBS elements
POST /api/wbs                # Create WBS
PUT  /api/wbs/{id}           # Update WBS
POST /api/wbs/{id}/submit    # Submit for approval
POST /api/wbs/{id}/approve   # Approve WBS
POST /api/wbs/{id}/reject    # Reject WBS
POST /api/wbs/bulk-submit    # Bulk submit
POST /api/wbs/bulk-approve   # Bulk approve
POST /api/wbs/bulk-reject    # Bulk reject
```

### Resumes
```
GET    /api/resumes              # List resumes
POST   /api/resumes              # Create resume
GET    /api/resumes/{id}         # Get resume
PUT    /api/resumes/{id}         # Update resume
DELETE /api/resumes/{id}         # Delete resume
POST   /api/resumes/{id}/sections    # Add section
GET    /api/resumes/{id}/versions    # Get versions
```

See [Swagger UI](http://localhost:5000/swagger) for complete API documentation.

## 🔧 Configuration

**Backend** (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=myscheduling;Username=postgres;Password=***"
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
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

## 🌐 Deploying to Azure Static Web Apps

1. Set a GitHub Actions secret named `VITE_API_URL` to your deployed API root (for example `https://<api-hostname>/api`). The Static Web Apps workflow consumes this at build time so the bundled frontend calls the correct API instead of `/api` on the static host.
2. In your API hosting environment (App Service/Container), set `ConnectionStrings__DefaultConnection` with the production password and `ASPNETCORE_ENVIRONMENT=Production` so the health check can reach the database.
3. CORS allows local dev plus `https://proud-ocean-0c7274110.3.azurestaticapps.net` and the future `https://myscheduling.aleutfederal.com` domains; add any new hostnames to `backend/src/MyScheduling.Api/appsettings.json` if you change domains.
4. Verify after deploy:
   - Frontend build uses the correct base URL: `echo $VITE_API_URL`
   - API health: `curl -i https://<api-hostname>/api/health`

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and ensure build succeeds
4. Update [TODO.md](TODO.md) with work session notes
5. Submit a pull request

## 📄 License

Copyright © 2025 Aleut Federal. All rights reserved.

## 🆘 Support

For issues or questions, contact the development team or create an issue in this repository.

---

**Last Updated**: November 23, 2025
**Version**: 1.0.0-beta
**Status**: Active Development
