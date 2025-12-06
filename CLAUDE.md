# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

myScheduling is an enterprise staffing and work-location management application with hoteling, WBS workflow, resumes, and multi-tenant RBAC.

## Architecture

- **Backend**: .NET 8 Web API with Entity Framework Core, PostgreSQL database
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router, Zustand
- **Auth**: JWT bearer tokens with bcrypt password hashing, `[RequiresPermission]` attribute-based authorization
- **Database**: Azure PostgreSQL (dev), SQLite supported for local testing

## Project Structure

```
backend/
  src/
    MyScheduling.Api/        # Web API, Controllers, Program.cs
    MyScheduling.Core/       # Domain models, interfaces
    MyScheduling.Infrastructure/  # EF Core, repositories, services
frontend/
  src/
    components/    # Reusable UI components
    pages/         # Route pages
    services/      # API client services
    stores/        # Zustand state stores
    hooks/         # Custom React hooks
    types/         # TypeScript type definitions
docs/archive/      # Historical documentation
scripts/           # Utility and seeding scripts
```

## Common Commands

### Backend (.NET)
```bash
cd backend/src/MyScheduling.Api
dotnet restore                           # Restore packages
dotnet build                             # Build solution
dotnet run --urls http://localhost:5107  # Run API on port 5107
```

### Frontend (React/Vite)
```bash
cd frontend
npm install                              # Install dependencies
npm run dev                              # Start dev server on port 5173
npm run build                            # Production build (includes tsc)
npm run lint                             # ESLint
```

### Full Stack Development
Start backend first, then frontend with proxy:
```bash
# Terminal 1: Backend
cd backend/src/MyScheduling.Api && dotnet run --urls http://localhost:5107

# Terminal 2: Frontend (proxies /api to backend)
cd frontend && VITE_API_PROXY_TARGET=http://localhost:5107 npm run dev
```

## Key Patterns

### Backend
- Controllers use `[RequiresPermission("PermissionName")]` for authorization
- Multi-tenant: JWT claims carry `tenantId`, enforced in service layer
- Services in Infrastructure project, interfaces in Core project
- EF Core with PostgreSQL; migrations in Infrastructure

### Multi-Tenant ID Pattern (IMPORTANT)
When writing controller endpoints that need tenant context:

1. **JWT Claim Name**: The claim is `TenantId` (PascalCase), NOT `tenant_id`
2. **Frontend Header**: Frontend sends `X-Tenant-Id` header via `api-client.ts`
3. **Recommended Pattern**: Check header first, fall back to JWT claims

```csharp
// For controllers inheriting AuthorizedControllerBase, use:
var tenantIds = GetUserTenantIds();  // Returns List<Guid> from "TenantId" claims

// For standalone controllers, implement this helper:
private Guid? GetCurrentTenantId()
{
    // Check X-Tenant-Id header first (set by frontend when workspace selected)
    if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
        Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
    {
        // Verify user has access to this tenant
        var userTenantIds = User.FindAll("TenantId")
            .Select(c => Guid.TryParse(c.Value, out var tid) ? tid : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();
        if (userTenantIds.Contains(parsedHeaderTenantId))
            return parsedHeaderTenantId;
    }
    // Fallback to first TenantId claim
    var tenantIdClaim = User.FindFirst("TenantId")?.Value;
    if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var parsedTenantId))
        return parsedTenantId;
    return null;
}

// Usage in endpoint:
var tenantId = GetCurrentTenantId();
if (!tenantId.HasValue)
    return BadRequest(new { message = "Invalid tenant context" });
```

Reference implementations:
- `AuthorizedControllerBase.cs` - base class with tenant helpers
- `RequiresPermissionAttribute.cs` - shows X-Tenant-Id header handling
- `StaffingReportsController.cs` - example of GetCurrentTenantId() pattern

### Frontend
- API calls via Axios in `services/` directory
- State management with Zustand stores in `stores/`
- Data fetching with TanStack Query (React Query)
- Routing with React Router v7
- Styling with Tailwind CSS utility classes

### Roles
Employee, ViewOnly, TeamLead, ProjectManager, ResourceManager, OfficeManager, TenantAdmin, Executive, OverrideApprover, SysAdmin, Support, Auditor

## Testing

Currently manual testing only:
- Health check: `http://localhost:5107/health`
- Swagger: `http://localhost:5107/swagger`
- Frontend: `http://localhost:5173`

Test account: `admin@admin.com`

## Known Considerations

- Authorization coverage is incomplete on some controllers
- No automated test suites yet (xUnit/Vitest/Playwright planned)
- Profile photo upload is stubbed (needs Azure Blob implementation)
- Review N+1 queries when modifying data access code

## Database

Connection string format:
```
Host=myscheduling.postgres.database.azure.com;Port=5432;Database=myscheduling;Username=...;Password=...;SslMode=Require
```

Set via environment variable: `ConnectionStrings__DefaultConnection`
