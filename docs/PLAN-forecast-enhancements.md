# Forecast Enhancement Plan

## Overview

This plan covers four major enhancements to the forecasting system:

1. **Fiscal Year / Calendar Year Toggle** - Display forecasts in fiscal or calendar year view
2. **Month Overwrite with Working Days** - Bulk fill months based on working days minus holidays/PTO
3. **Non-Labor Cost Forecasting** - Add travel, meals, and other non-labor costs to forecasts and budgets
4. **Employee Loaded Cost Rates** - Effective-dated cost rates with Finance Lead role management

---

## 1. Fiscal Year / Calendar Year Toggle

### Requirements
- Toggle between fiscal year (FY) and calendar year (CY) views
- Header should display the year context (e.g., "FY2025" or "CY2025")
- Fiscal year configuration on existing tenant settings page (`/admin/tenant-settings`)
- Default: October start month (federal)

### Backend Changes

#### A. Tenant Configuration Extension
**File:** `backend/src/MyScheduling.Core/Entities/Tenant.cs`

Add fiscal year configuration to existing TenantConfiguration:
```csharp
public class TenantConfiguration
{
    // Existing fields...

    // Fiscal Year Settings
    public int FiscalYearStartMonth { get; set; } = 10; // October (federal default)
    public string FiscalYearPrefix { get; set; } = "FY"; // Display prefix
}
```

#### B. Update Tenant Settings Endpoint
**File:** `backend/src/MyScheduling.Api/Controllers/TenantsController.cs`

Ensure fiscal year config is included in existing tenant settings GET/PUT endpoints.

### Frontend Changes

#### A. Update Tenant Settings Page
**File:** `frontend/src/pages/TenantSettingsPage.tsx`

Add fiscal year configuration fields to existing settings form:
- Fiscal Year Start Month (dropdown: Jan-Dec)
- Fiscal Year Prefix (text input, default "FY")

#### B. Update Forecast Grid Page
**File:** `frontend/src/pages/ProjectForecastGridPage.tsx`

- Add `yearMode` state: `'fiscal' | 'calendar'`
- Add toggle button in toolbar (styled toggle switch)
- Update `generateMonthRange` to respect fiscal year ordering
- Update column headers to show proper year context
- Year selector shows "FY2025" or "2025" based on mode

#### C. Update Forecast Service
**File:** `frontend/src/services/forecastService.ts`

- Update `generateMonthRange()` to support fiscal year mode
- Accept `fiscalYearStartMonth` parameter

### UI Mockup
```
[FY ● CY]  Year: [FY2025 ▼]  Quarter: [All ▼]

Headers (Fiscal FY2025, Oct start): Oct'24 | Nov'24 | Dec'24 | Jan'25 | Feb'25 | ... | Sep'25
Headers (Calendar 2025): Jan'25 | Feb'25 | Mar'25 | Apr'25 | ... | Dec'25
```

---

## 2. Month Overwrite with Working Days

### Requirements
- Quick-fill a month with calculated working days
- Working days = Business days - Holidays - Default PTO estimate
- Holiday management already exists at `/admin/holidays` - integrate with that
- Configurable default PTO estimate (e.g., 1.5 days/month average)

### Backend Changes

#### A. New Entity for Working Days Config
**File:** `backend/src/MyScheduling.Core/Entities/Calendar.cs` (new file)

```csharp
public class WorkingDaysConfiguration : TenantEntity
{
    public decimal DefaultPtoDaysPerMonth { get; set; } = 1.5m; // Average PTO estimate
    public decimal StandardHoursPerDay { get; set; } = 8.0m;
    public bool ExcludeSaturdays { get; set; } = true;
    public bool ExcludeSundays { get; set; } = true;
}
```

#### B. Working Days Calculator Service
**File:** `backend/src/MyScheduling.Infrastructure/Services/WorkingDaysService.cs`

```csharp
public interface IWorkingDaysService
{
    Task<int> GetBusinessDaysInMonth(Guid tenantId, int year, int month);
    Task<int> GetHolidayCountInMonth(Guid tenantId, int year, int month);
    Task<decimal> GetDefaultForecastHours(Guid tenantId, int year, int month);
    Task<WorkingDaysBreakdown> GetWorkingDaysBreakdown(Guid tenantId, int year, int month);
}

public class WorkingDaysBreakdown
{
    public int BusinessDays { get; set; }
    public int Holidays { get; set; }
    public decimal PtoEstimate { get; set; }
    public decimal WorkingDays { get; set; }
    public decimal StandardHoursPerDay { get; set; }
    public decimal TotalHours { get; set; }
    public List<string> HolidayNames { get; set; }
}
```

#### C. New API Endpoints
**File:** `backend/src/MyScheduling.Api/Controllers/CalendarController.cs` (new)

```csharp
[ApiController]
[Route("api/calendar")]
[Authorize]
public class CalendarController : AuthorizedControllerBase
{
    [HttpGet("working-days/{year}/{month}")]
    public Task<WorkingDaysBreakdownDto> GetWorkingDays(int year, int month)

    [HttpGet("working-days-config")]
    public Task<WorkingDaysConfigurationDto> GetWorkingDaysConfig()

    [HttpPut("working-days-config")]
    [RequiresPermission(Resource = "TenantSettings", Action = PermissionAction.Update)]
    public Task<WorkingDaysConfigurationDto> UpdateWorkingDaysConfig(UpdateWorkingDaysConfigDto dto)
}
```

### Frontend Changes

#### A. Update Forecast Grid
**File:** `frontend/src/pages/ProjectForecastGridPage.tsx`

- Add dropdown on month column headers
- Options:
  - "Fill All Rows: X hrs" (with tooltip showing breakdown)
  - "Fill Selected Rows: X hrs"
  - "Clear All"
- Tooltip shows: "21 business days - 1 holiday (MLK Day) - 1.5 PTO = 18.5 days × 8 hrs = 148 hrs"

#### B. New Calendar Service
**File:** `frontend/src/services/calendarService.ts` (new)

```typescript
export interface WorkingDaysBreakdown {
  businessDays: number;
  holidays: number;
  ptoEstimate: number;
  workingDays: number;
  standardHoursPerDay: number;
  totalHours: number;
  holidayNames: string[];
}

export const calendarService = {
  getWorkingDays: (year: number, month: number) => Promise<WorkingDaysBreakdown>,
  getWorkingDaysConfig: () => Promise<WorkingDaysConfiguration>,
  updateWorkingDaysConfig: (dto: UpdateWorkingDaysConfigDto) => Promise<WorkingDaysConfiguration>
};
```

#### C. Update Forecast Settings Page
**File:** `frontend/src/pages/ForecastSettingsPage.tsx` (new at `/forecast/settings`)

- Working days configuration:
  - Default PTO days per month
  - Standard hours per day
  - Exclude Saturdays (checkbox)
  - Exclude Sundays (checkbox)
- Preview calculator showing sample month breakdown

### UI Mockup
```
Column Header: [Jan'25 ▼]
Dropdown Menu:
┌────────────────────────────────────┐
│ Fill All Rows: 148 hrs             │
│ Fill Selected Rows: 148 hrs        │
│ ─────────────────────────────────  │
│ Clear All                          │
└────────────────────────────────────┘

Tooltip on hover:
┌─────────────────────────────────────────┐
│ January 2025 Working Days               │
│ ─────────────────────────────────────── │
│ Business Days:     23                   │
│ Holidays:          -1 (New Year's Day)  │
│ PTO Estimate:      -1.5                 │
│ ─────────────────────────────────────── │
│ Working Days:      20.5                 │
│ × 8 hrs/day                             │
│ = 164 hours                             │
└─────────────────────────────────────────┘
```

---

## 3. Non-Labor Cost Forecasting

### Requirements
- Track non-labor costs by category
- Display below labor costs in forecast grid
- Include in budget management
- Configuration page at `/forecast/settings`

### Categories (Configurable)
Default categories:
- **Travel** - Airfare, lodging, ground transportation, mileage
- **Meals** - Per diem, client meals, team meals
- **Equipment** - Hardware, software licenses, tools
- **Supplies** - Office supplies, materials
- **Subcontracts** - Outsourced work, consultants
- **Training** - Courses, certifications, conferences
- **Communications** - Phone, internet, subscriptions
- **Facilities** - Rent, utilities (if project-specific)
- **Other** - Miscellaneous costs

### Backend Changes

#### A. New Entities
**File:** `backend/src/MyScheduling.Core/Entities/NonLaborCosts.cs` (new file)

```csharp
public enum NonLaborCostCategory
{
    Travel = 0,
    Meals = 1,
    Equipment = 2,
    Supplies = 3,
    Subcontracts = 4,
    Training = 5,
    Communications = 6,
    Facilities = 7,
    Other = 99
}

public class NonLaborCostType : TenantEntity
{
    public string Name { get; set; }
    public string Code { get; set; }
    public NonLaborCostCategory Category { get; set; }
    public string Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class NonLaborForecast : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; }

    public Guid? WbsElementId { get; set; }
    public WbsElement WbsElement { get; set; }

    public Guid NonLaborCostTypeId { get; set; }
    public NonLaborCostType NonLaborCostType { get; set; }

    public Guid? ForecastVersionId { get; set; }
    public ForecastVersion ForecastVersion { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public decimal ForecastedAmount { get; set; }
    public string Notes { get; set; }

    // Workflow (same as labor forecasts)
    public ForecastStatus Status { get; set; } = ForecastStatus.Draft;
    public Guid? SubmittedByUserId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class NonLaborBudgetLine : TenantEntity
{
    public Guid ProjectBudgetId { get; set; }
    public ProjectBudget ProjectBudget { get; set; }

    public Guid NonLaborCostTypeId { get; set; }
    public NonLaborCostType NonLaborCostType { get; set; }

    public Guid? WbsElementId { get; set; }
    public WbsElement WbsElement { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public decimal BudgetedAmount { get; set; }
}

public class ActualNonLaborCost : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; }

    public Guid NonLaborCostTypeId { get; set; }
    public NonLaborCostType NonLaborCostType { get; set; }

    public Guid? WbsElementId { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public decimal ActualAmount { get; set; }
    public ActualHoursSource Source { get; set; }
}
```

#### B. New Controller
**File:** `backend/src/MyScheduling.Api/Controllers/NonLaborCostsController.cs` (new)

```csharp
[ApiController]
[Route("api/non-labor-costs")]
[Authorize]
public class NonLaborCostsController : AuthorizedControllerBase
{
    // Cost Types (Admin)
    [HttpGet("types")]
    public Task<IEnumerable<NonLaborCostTypeDto>> GetCostTypes()

    [HttpPost("types")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Create)]
    public Task<NonLaborCostTypeDto> CreateCostType(CreateNonLaborCostTypeDto dto)

    [HttpPut("types/{id}")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Update)]
    public Task<NonLaborCostTypeDto> UpdateCostType(Guid id, UpdateNonLaborCostTypeDto dto)

    [HttpDelete("types/{id}")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Delete)]
    public Task DeleteCostType(Guid id)

    // Forecasts
    [HttpGet("forecasts")]
    public Task<IEnumerable<NonLaborForecastDto>> GetForecasts(Guid projectId, int? year)

    [HttpPost("forecasts")]
    public Task<NonLaborForecastDto> CreateForecast(CreateNonLaborForecastDto dto)

    [HttpPost("forecasts/bulk")]
    public Task<IEnumerable<NonLaborForecastDto>> CreateBulkForecasts(BulkCreateNonLaborForecastsDto dto)

    [HttpPut("forecasts/{id}")]
    public Task<NonLaborForecastDto> UpdateForecast(Guid id, UpdateNonLaborForecastDto dto)

    [HttpDelete("forecasts/{id}")]
    public Task DeleteForecast(Guid id)

    // Budget Lines
    [HttpGet("budget-lines")]
    public Task<IEnumerable<NonLaborBudgetLineDto>> GetBudgetLines(Guid projectBudgetId)

    [HttpPost("budget-lines")]
    public Task<NonLaborBudgetLineDto> CreateBudgetLine(CreateNonLaborBudgetLineDto dto)

    [HttpPut("budget-lines/{id}")]
    public Task<NonLaborBudgetLineDto> UpdateBudgetLine(Guid id, UpdateNonLaborBudgetLineDto dto)

    [HttpDelete("budget-lines/{id}")]
    public Task DeleteBudgetLine(Guid id)
}
```

### Frontend Changes

#### A. New Service
**File:** `frontend/src/services/nonLaborCostsService.ts` (new)

```typescript
export interface NonLaborCostType {
  id: string;
  name: string;
  code?: string;
  category: NonLaborCostCategory;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface NonLaborForecast {
  id: string;
  projectId: string;
  wbsElementId?: string;
  nonLaborCostTypeId: string;
  nonLaborCostType: NonLaborCostType;
  forecastVersionId?: string;
  year: number;
  month: number;
  forecastedAmount: number;
  notes?: string;
  status: ForecastStatus;
}

export const nonLaborCostsService = {
  // Cost Types
  getCostTypes: () => Promise<NonLaborCostType[]>,
  createCostType: (dto: CreateNonLaborCostTypeDto) => Promise<NonLaborCostType>,
  updateCostType: (id: string, dto: UpdateNonLaborCostTypeDto) => Promise<NonLaborCostType>,
  deleteCostType: (id: string) => Promise<void>,

  // Forecasts
  getForecasts: (projectId: string, year?: number) => Promise<NonLaborForecast[]>,
  createForecast: (dto: CreateNonLaborForecastDto) => Promise<NonLaborForecast>,
  createBulkForecasts: (dto: BulkCreateNonLaborForecastsDto) => Promise<NonLaborForecast[]>,
  updateForecast: (id: string, dto: UpdateNonLaborForecastDto) => Promise<NonLaborForecast>,
  deleteForecast: (id: string) => Promise<void>,

  // Budget Lines
  getBudgetLines: (projectBudgetId: string) => Promise<NonLaborBudgetLine[]>,
  createBudgetLine: (dto: CreateNonLaborBudgetLineDto) => Promise<NonLaborBudgetLine>,
  updateBudgetLine: (id: string, dto: UpdateNonLaborBudgetLineDto) => Promise<NonLaborBudgetLine>,
  deleteBudgetLine: (id: string) => Promise<void>
};
```

#### B. Update Forecast Grid Page
**File:** `frontend/src/pages/ProjectForecastGridPage.tsx`

- Add collapsible "Non-Labor Costs" section below labor forecasts
- Similar grid structure: rows = cost types, columns = months
- "Add Cost Type Row" button to add new cost type to project
- Inline editing for amounts
- Status indicators same as labor forecasts
- Totals row for non-labor costs
- Grand total combining labor costs + non-labor costs

#### C. Forecast Settings Page
**File:** `frontend/src/pages/ForecastSettingsPage.tsx` (new at `/forecast/settings`)

- Non-Labor Cost Types management:
  - List of active cost types
  - Add/Edit/Deactivate cost types
  - Drag to reorder
  - Default category assignment
- Working days configuration (from Feature 2)

#### D. Update Budget Pages
**Files:** `frontend/src/pages/ProjectBudgetPage.tsx`, `frontend/src/pages/ProjectBudgetEditPage.tsx`

- Add non-labor budget section below labor budget
- Same grid pattern: rows = cost types, columns = months
- Include in totals calculations

### UI Mockup
```
=== Labor Forecasts ===
[Existing WBS-grouped grid...]
Labor Total: $125,000

=== Non-Labor Costs ===  [+ Add Row]  [▼ Collapse]
┌─────────────────┬────────────┬────────────┬────────────┬────────────┐
│ Cost Type       │ Oct'24     │ Nov'24     │ Dec'24     │ Total      │
├─────────────────┼────────────┼────────────┼────────────┼────────────┤
│ Travel          │ $5,000     │ $3,000     │ $4,500     │ $12,500    │
│ Meals           │ $800       │ $600       │ $750       │ $2,150     │
│ Equipment       │ $0         │ $2,500     │ $0         │ $2,500     │
│ Training        │ $1,200     │ $0         │ $0         │ $1,200     │
├─────────────────┼────────────┼────────────┼────────────┼────────────┤
│ Non-Labor Total │ $7,000     │ $6,100     │ $5,250     │ $18,350    │
└─────────────────┴────────────┴────────────┴────────────┴────────────┘

═══════════════════════════════════════════════════════════════════════
GRAND TOTAL                                              $143,350
═══════════════════════════════════════════════════════════════════════
```

---

## 4. Employee Loaded Cost Rates (LCR)

### Requirements
- Store a single **Loaded Cost Rate (LCR)** per employee with effective dates
- Support forecasting raises via future effective dates
- New **FinanceLead** role with CRUD access (along with TenantAdmin/SysAdmin)
- Bulk upload via CSV and Excel (XLSX)
- Single user and enterprise-wide update options
- Use rate effective at forecast month when calculating costs

### Backend Changes

#### A. New Entities
**File:** `backend/src/MyScheduling.Core/Entities/CostRates.cs` (new file)

```csharp
public class EmployeeCostRate : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; }

    public DateOnly EffectiveDate { get; set; }
    public DateOnly? EndDate { get; set; } // Null = current/future

    // Single loaded rate - calculated externally
    public decimal LoadedCostRate { get; set; } // Hourly rate, fully burdened

    // Metadata
    public string Notes { get; set; }
    public CostRateSource Source { get; set; }
    public Guid? ImportBatchId { get; set; } // For tracking bulk imports
}

public enum CostRateSource
{
    ManualEntry = 0,
    CsvImport = 1,
    ExcelImport = 2,
    BulkAdjustment = 3
}

public class CostRateImportBatch : TenantEntity
{
    public string FileName { get; set; }
    public string FileType { get; set; } // "csv" or "xlsx"
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public CostRateImportStatus Status { get; set; }
    public string ErrorDetails { get; set; } // JSON array of errors
    public DateTime? CompletedAt { get; set; }
}

public enum CostRateImportStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    CompletedWithErrors = 3,
    Failed = 4
}
```

#### B. New Role: FinanceLead
**File:** `backend/src/MyScheduling.Core/Enums/AppRole.cs`

```csharp
public enum AppRole
{
    // Existing roles...
    Employee = 0,
    ViewOnly = 1,
    TeamLead = 2,
    ProjectManager = 3,
    ResourceManager = 4,
    OfficeManager = 5,
    TenantAdmin = 6,
    Executive = 7,
    OverrideApprover = 8,
    ResumeViewer = 9,
    SystemAdmin = 10,
    Support = 11,
    Auditor = 12,

    FinanceLead = 13, // New role for cost rate management
}
```

#### C. Role Permission Templates
Add default permissions for FinanceLead in seeder:

```csharp
// FinanceLead can manage cost rates
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "EmployeeCostRate", Action = PermissionAction.Create },
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "EmployeeCostRate", Action = PermissionAction.Read },
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "EmployeeCostRate", Action = PermissionAction.Update },
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "EmployeeCostRate", Action = PermissionAction.Delete },
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "EmployeeCostRate", Action = PermissionAction.Import },
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "EmployeeCostRate", Action = PermissionAction.Export },

// FinanceLead can read forecasts and users
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "Forecast", Action = PermissionAction.Read },
new RolePermissionTemplate { Role = AppRole.FinanceLead, Resource = "User", Action = PermissionAction.Read },
```

#### D. New Controller
**File:** `backend/src/MyScheduling.Api/Controllers/CostRatesController.cs` (new)

```csharp
[ApiController]
[Route("api/cost-rates")]
[Authorize]
public class CostRatesController : AuthorizedControllerBase
{
    // Get all rates (paginated)
    [HttpGet]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public Task<PagedResult<EmployeeCostRateDto>> GetAllRates(
        int page = 1,
        int pageSize = 50,
        string? search = null,
        DateOnly? effectiveAsOf = null)

    // Get rates for a specific user
    [HttpGet("user/{userId}")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public Task<IEnumerable<EmployeeCostRateDto>> GetUserRates(Guid userId)

    // Get effective rate for user at specific date
    [HttpGet("user/{userId}/effective")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public Task<EmployeeCostRateDto?> GetEffectiveRate(Guid userId, [FromQuery] DateOnly? asOfDate = null)

    // Get effective rates for multiple users (for forecast calculations)
    [HttpPost("effective-bulk")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public Task<Dictionary<Guid, decimal>> GetEffectiveRatesBulk(BulkEffectiveRatesRequestDto dto)

    // Create rate
    [HttpPost]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Create)]
    public Task<EmployeeCostRateDto> CreateRate(CreateEmployeeCostRateDto dto)

    // Update rate
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Update)]
    public Task<EmployeeCostRateDto> UpdateRate(Guid id, UpdateEmployeeCostRateDto dto)

    // Delete rate
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Delete)]
    public Task DeleteRate(Guid id)

    // Import preview (validate without committing)
    [HttpPost("import/preview")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Import)]
    public Task<CostRateImportPreviewDto> PreviewImport(IFormFile file)

    // Commit import
    [HttpPost("import/commit")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Import)]
    public Task<CostRateImportResultDto> CommitImport(IFormFile file)

    // Download import template (CSV or XLSX)
    [HttpGet("import/template")]
    public Task<FileResult> DownloadTemplate([FromQuery] string format = "csv")

    // Export current rates
    [HttpGet("export")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Export)]
    public Task<FileResult> ExportRates([FromQuery] string format = "csv", [FromQuery] DateOnly? effectiveAsOf = null)

    // Bulk percentage adjustment
    [HttpPost("bulk-adjust")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Update)]
    public Task<BulkAdjustResultDto> BulkAdjustRates(BulkAdjustRatesDto dto)

    // Get import history
    [HttpGet("import/history")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public Task<IEnumerable<CostRateImportBatchDto>> GetImportHistory()
}
```

#### E. Cost Rate Service
**File:** `backend/src/MyScheduling.Infrastructure/Services/CostRateService.cs`

```csharp
public interface ICostRateService
{
    Task<decimal?> GetEffectiveRate(Guid tenantId, Guid userId, DateOnly asOfDate);
    Task<Dictionary<Guid, decimal>> GetEffectiveRates(Guid tenantId, IEnumerable<Guid> userIds, DateOnly asOfDate);
    Task<CostRateImportPreviewDto> PreviewImport(Guid tenantId, Stream fileStream, string fileName);
    Task<CostRateImportResultDto> CommitImport(Guid tenantId, Guid userId, Stream fileStream, string fileName);
    Task<int> BulkAdjust(Guid tenantId, Guid userId, BulkAdjustRatesDto dto);
}
```

### Frontend Changes

#### A. New Cost Rates Service
**File:** `frontend/src/services/costRatesService.ts` (new)

```typescript
export interface EmployeeCostRate {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  effectiveDate: string;
  endDate?: string;
  loadedCostRate: number;
  notes?: string;
  source: CostRateSource;
  importBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostRateImportPreview {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  errors: ImportError[];
  preview: EmployeeCostRate[];
}

export const costRatesService = {
  // CRUD
  getAllRates: (params: GetRatesParams) => Promise<PagedResult<EmployeeCostRate>>,
  getUserRates: (userId: string) => Promise<EmployeeCostRate[]>,
  getEffectiveRate: (userId: string, asOfDate?: string) => Promise<EmployeeCostRate | null>,
  createRate: (dto: CreateCostRateDto) => Promise<EmployeeCostRate>,
  updateRate: (id: string, dto: UpdateCostRateDto) => Promise<EmployeeCostRate>,
  deleteRate: (id: string) => Promise<void>,

  // Import/Export
  previewImport: (file: File) => Promise<CostRateImportPreview>,
  commitImport: (file: File) => Promise<CostRateImportResult>,
  downloadTemplate: (format: 'csv' | 'xlsx') => Promise<Blob>,
  exportRates: (format: 'csv' | 'xlsx', effectiveAsOf?: string) => Promise<Blob>,

  // Bulk operations
  bulkAdjust: (dto: BulkAdjustDto) => Promise<BulkAdjustResult>,

  // History
  getImportHistory: () => Promise<CostRateImportBatch[]>
};
```

#### B. Cost Rates Management Page
**File:** `frontend/src/pages/CostRatesPage.tsx` (new at `/admin/cost-rates`)

- Table view of all employees with current rates
- Columns: Employee Name, Email, Effective Date, LCR ($/hr), Source, Actions
- Filter by: effective date range
- Search by employee name/email
- "Add Rate" button opens modal
- "Import" button for bulk upload
- "Export" dropdown (CSV/Excel)
- Row actions: Edit, Delete, View History

#### C. Cost Rate Import Modal
**File:** `frontend/src/components/CostRateImportModal.tsx` (new)

- File upload (drag-and-drop) accepting .csv and .xlsx
- Preview table showing parsed data
- Error highlighting for invalid rows
- "Download Template" links for CSV and Excel
- Confirm/Cancel buttons

#### D. User Profile Cost Rates Tab
**File:** Update user detail page to show cost rate history

- Tab visible only to FinanceLead/TenantAdmin/SysAdmin
- Timeline view of rate history
- "Add Future Rate" button for scheduling raises
- Current effective rate highlighted

#### E. Navigation Update
**File:** `frontend/src/components/Navigation.tsx`

- Add "Cost Rates" under Admin section
- Visible only to FinanceLead, TenantAdmin, SysAdmin roles

### Import Template Format

**CSV Format:**
```csv
employee_email,effective_date,loaded_cost_rate,notes
john.doe@company.com,2025-01-01,82.50,Annual rate
jane.smith@company.com,2025-01-01,95.00,Senior level
jane.smith@company.com,2025-07-01,98.50,Mid-year adjustment
```

**Excel Format:** Same columns, first row is header

### UI Mockup - Cost Rates Management
```
Cost Rates                              [Import ▼] [Export ▼] [+ Add Rate]

Search: [_______________________]  Effective As Of: [01/01/2025]

┌──────────────────────┬─────────────────────┬─────────────┬──────────────┬─────────────┬─────────┐
│ Employee             │ Email               │ Effective   │ Rate ($/hr)  │ Source      │ Actions │
├──────────────────────┼─────────────────────┼─────────────┼──────────────┼─────────────┼─────────┤
│ John Doe             │ john.doe@co.com     │ 01/01/2025  │ $82.50       │ Import      │ ✎ 🗑   │
│ Jane Smith           │ jane.smith@co.com   │ 01/01/2025  │ $95.00       │ Manual      │ ✎ 🗑   │
│   └─ Future Rate     │                     │ 07/01/2025  │ $98.50       │ Manual      │ ✎ 🗑   │
│ Bob Wilson           │ bob.wilson@co.com   │ 01/01/2025  │ $72.00       │ Import      │ ✎ 🗑   │
└──────────────────────┴─────────────────────┴─────────────┴──────────────┴─────────────┴─────────┘

Showing 1-20 of 150 employees                                    [< 1 2 3 4 5 ... 8 >]
```

### Bulk Adjustment Modal
```
Bulk Rate Adjustment

Adjustment Type: [● Percentage  ○ Fixed Amount]

Percentage: [____5___] %

Effective Date: [07/01/2025]

Notes: [Annual cost of living adjustment_______]

This will create new rate entries for 150 employees
effective 07/01/2025 with a 5% increase.

[Cancel]  [Preview Changes]  [Apply]
```

---

## Database Migrations Required

### Migration 1: Working Days Configuration
```sql
CREATE TABLE working_days_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
    default_pto_days_per_month DECIMAL(4,2) DEFAULT 1.5,
    standard_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
    exclude_saturdays BOOLEAN DEFAULT TRUE,
    exclude_sundays BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT
);
```

### Migration 2: Non-Labor Costs
```sql
CREATE TABLE non_labor_cost_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    category INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT
);

CREATE TABLE non_labor_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    wbs_element_id UUID REFERENCES wbs_elements(id),
    non_labor_cost_type_id UUID NOT NULL REFERENCES non_labor_cost_types(id),
    forecast_version_id UUID REFERENCES forecast_versions(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    forecasted_amount DECIMAL(18,2) NOT NULL,
    notes TEXT,
    status INTEGER DEFAULT 0,
    submitted_by_user_id UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT,
    UNIQUE(tenant_id, project_id, non_labor_cost_type_id, year, month, COALESCE(wbs_element_id, '00000000-0000-0000-0000-000000000000'))
);

CREATE TABLE non_labor_budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_budget_id UUID NOT NULL REFERENCES project_budgets(id),
    non_labor_cost_type_id UUID NOT NULL REFERENCES non_labor_cost_types(id),
    wbs_element_id UUID REFERENCES wbs_elements(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    budgeted_amount DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT
);

CREATE TABLE actual_non_labor_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    non_labor_cost_type_id UUID NOT NULL REFERENCES non_labor_cost_types(id),
    wbs_element_id UUID REFERENCES wbs_elements(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    actual_amount DECIMAL(18,2) NOT NULL,
    source INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT
);

CREATE INDEX idx_non_labor_forecasts_project_year ON non_labor_forecasts(project_id, year);
CREATE INDEX idx_non_labor_budget_lines_budget ON non_labor_budget_lines(project_budget_id);
```

### Migration 3: Employee Cost Rates
```sql
CREATE TABLE employee_cost_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    loaded_cost_rate DECIMAL(18,2) NOT NULL,
    notes TEXT,
    source INTEGER DEFAULT 0,
    import_batch_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT,
    CONSTRAINT unique_user_effective_date UNIQUE (tenant_id, user_id, effective_date)
);

CREATE TABLE cost_rate_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    total_records INTEGER NOT NULL,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 0,
    error_details JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_user_id UUID REFERENCES users(id),
    deletion_reason TEXT
);

CREATE INDEX idx_cost_rates_user_effective ON employee_cost_rates(user_id, effective_date DESC);
CREATE INDEX idx_cost_rates_tenant_effective ON employee_cost_rates(tenant_id, effective_date DESC);
CREATE INDEX idx_cost_rates_tenant_user ON employee_cost_rates(tenant_id, user_id);
```

### Migration 4: Tenant Configuration Update
```sql
-- Add fiscal year config to tenant configuration JSON
-- This is handled via EF Core JSON column updates
```

---

## Implementation Order

### Phase 1: Foundation
1. Add FinanceLead role to AppRole enum
2. Add role permission templates for FinanceLead
3. Add fiscal year fields to TenantConfiguration
4. Create all database migrations
5. Run migrations and verify

### Phase 2: Fiscal Year Toggle
1. Update TenantSettingsPage with fiscal year config
2. Update generateMonthRange for fiscal year support
3. Add FY/CY toggle to ProjectForecastGridPage
4. Update column headers and year display
5. Test with October fiscal year start

### Phase 3: Working Days & Month Fill
1. Implement WorkingDaysConfiguration entity
2. Create CalendarController with working days endpoints
3. Integrate with existing Holiday system
4. Create frontend calendarService
5. Add ForecastSettingsPage at /forecast/settings
6. Add month column dropdown to forecast grid
7. Test fill functionality

### Phase 4: Non-Labor Costs
1. Implement NonLaborCostType entity and seeder
2. Implement NonLaborForecast and related entities
3. Create NonLaborCostsController
4. Create frontend nonLaborCostsService
5. Add cost type configuration to ForecastSettingsPage
6. Add non-labor section to ProjectForecastGridPage
7. Update budget pages with non-labor support
8. Test full workflow

### Phase 5: Employee Cost Rates
1. Implement EmployeeCostRate entity
2. Implement CostRateImportBatch entity
3. Create CostRateService with import/export logic
4. Create CostRatesController
5. Create frontend costRatesService
6. Build CostRatesPage at /admin/cost-rates
7. Build CostRateImportModal
8. Add cost rates tab to user profile
9. Update navigation for FinanceLead role
10. Test import/export with CSV and Excel

### Phase 6: Integration
1. Integrate cost rates into forecast cost calculations
2. Update forecast grid to show labor costs (hours × effective rate)
3. Update reports with combined labor + non-labor costs
4. End-to-end testing
5. Performance optimization

---

## Files to Create/Modify Summary

### New Files (Backend)
- `backend/src/MyScheduling.Core/Entities/Calendar.cs`
- `backend/src/MyScheduling.Core/Entities/NonLaborCosts.cs`
- `backend/src/MyScheduling.Core/Entities/CostRates.cs`
- `backend/src/MyScheduling.Api/Controllers/CalendarController.cs`
- `backend/src/MyScheduling.Api/Controllers/NonLaborCostsController.cs`
- `backend/src/MyScheduling.Api/Controllers/CostRatesController.cs`
- `backend/src/MyScheduling.Infrastructure/Services/WorkingDaysService.cs`
- `backend/src/MyScheduling.Infrastructure/Services/CostRateService.cs`

### Modified Files (Backend)
- `backend/src/MyScheduling.Core/Enums/AppRole.cs` - Add FinanceLead
- `backend/src/MyScheduling.Core/Entities/Tenant.cs` - Add fiscal year config
- `backend/src/MyScheduling.Infrastructure/Data/MySchedulingDbContext.cs` - Add DbSets
- Seeder files for default data

### New Files (Frontend)
- `frontend/src/services/calendarService.ts`
- `frontend/src/services/nonLaborCostsService.ts`
- `frontend/src/services/costRatesService.ts`
- `frontend/src/pages/ForecastSettingsPage.tsx`
- `frontend/src/pages/CostRatesPage.tsx`
- `frontend/src/components/CostRateImportModal.tsx`
- `frontend/src/components/MonthFillDropdown.tsx`
- `frontend/src/components/NonLaborCostsGrid.tsx`

### Modified Files (Frontend)
- `frontend/src/pages/ProjectForecastGridPage.tsx` - Add FY toggle, month fill, non-labor
- `frontend/src/pages/TenantSettingsPage.tsx` - Add fiscal year config
- `frontend/src/pages/ProjectBudgetPage.tsx` - Add non-labor budget
- `frontend/src/pages/ProjectBudgetEditPage.tsx` - Add non-labor budget edit
- `frontend/src/components/Navigation.tsx` - Add Cost Rates menu
- `frontend/src/services/forecastService.ts` - Update generateMonthRange
- `frontend/src/App.tsx` - Add new routes
