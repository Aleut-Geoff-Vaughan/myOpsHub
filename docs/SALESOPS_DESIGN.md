# mySalesOps - Design Document

## Overview

mySalesOps is a US Federal Government Opportunity Management module integrated into myScheduling. It provides comprehensive sales pipeline tracking, opportunity management, 8(a) bidding entity tracking, and sales forecasting capabilities designed specifically for federal contracting.

**Module Name:** mySalesOps
**Database:** PostgreSQL (shared with myScheduling)
**New Role:** BusinessDeveloper (BD) - required for mySalesOps access

---

## Key Design Decisions

| Decision | Answer |
|----------|--------|
| Database | PostgreSQL (single database with myScheduling) |
| New Role | `BusinessDeveloper` - grants mySalesOps access |
| Opportunity to Project | Manual conversion (no auto-conversion) |
| SAM.gov/GovWin API | Future/Phase 2 |
| Power BI Integration | Placeholder for future |
| 8(a) Entity Tracking | Required for initial launch |
| Schema Flexibility | Admin-configurable custom fields |

---

## Architecture

### Module Integration

mySalesOps integrates with the existing myScheduling architecture:

```
┌────────────────────────────────────────────────────────────────────┐
│                        myScheduling Platform                        │
├──────────────┬──────────────┬───────────────┬─────────────────────┤
│   myWork     │  myForecast  │  myFacilities │     mySalesOps      │
│ (Staffing)   │ (Budgeting)  │  (Hoteling)   │  (Opportunities)    │
├──────────────┴──────────────┴───────────────┴─────────────────────┤
│                     Shared Services Layer                          │
│  - Authentication (JWT)    - File Storage (Azure Blob)            │
│  - Multi-tenant Context    - Email Notifications                  │
│  - User Management         - Audit Logging                        │
├───────────────────────────────────────────────────────────────────┤
│                     PostgreSQL Database                            │
│  - Existing tables (Users, Tenants, Projects, etc.)               │
│  - New SalesOps tables (Opportunities, Accounts, etc.)            │
└───────────────────────────────────────────────────────────────────┘
```

### Custom Fields System

To support Salesforce-like flexibility (100+ configurable fields), mySalesOps implements a custom fields system:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOM FIELD ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SalesCustomFieldDefinition (per tenant)                        │
│  ├── Id, TenantId                                               │
│  ├── EntityType (Opportunity, Account, Contact, etc.)           │
│  ├── FieldName, DisplayLabel                                    │
│  ├── FieldType (Text, Number, Date, Picklist, Lookup, etc.)    │
│  ├── PicklistOptions (JSON for dropdowns)                       │
│  ├── IsRequired, IsSearchable, IsVisibleInList                  │
│  ├── Section (for form grouping)                                │
│  ├── SortOrder                                                  │
│  └── IsActive                                                   │
│                                                                  │
│  SalesCustomFieldValue (per record)                             │
│  ├── Id, TenantId                                               │
│  ├── FieldDefinitionId (FK)                                     │
│  ├── EntityType, EntityId                                       │
│  ├── TextValue, NumberValue, DateValue, BoolValue               │
│  └── PicklistValue                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Admin-Configurable Picklist System

To support tenant-specific picklist values (like Salesforce), mySalesOps implements a configurable picklist system:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PICKLIST ADMIN ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SalesPicklistDefinition (per tenant)                           │
│  ├── Id, TenantId                                               │
│  ├── PicklistName (unique key: "AcquisitionType", "Portfolio")  │
│  ├── DisplayLabel ("Acquisition Type", "Portfolio")             │
│  ├── Description                                                │
│  ├── IsSystemPicklist (false = can delete, true = locked)       │
│  ├── AllowMultiple (for multi-select picklists)                 │
│  └── IsActive                                                   │
│                                                                  │
│  SalesPicklistValue (per picklist)                              │
│  ├── Id, TenantId                                               │
│  ├── PicklistDefinitionId (FK)                                  │
│  ├── Value (stored value: "8(a)")                               │
│  ├── Label (display: "8(a) Set-Aside")                          │
│  ├── SortOrder                                                  │
│  ├── IsDefault (pre-selected in new records)                    │
│  ├── IsActive (inactive = hidden but keeps history)             │
│  └── Color (optional: for visual indicators)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Backend Entity: SalesPicklistDefinition

```csharp
public class SalesPicklistDefinition : TenantEntity
{
    public string PicklistName { get; set; } = string.Empty;  // "AcquisitionType"
    public string DisplayLabel { get; set; } = string.Empty;  // "Acquisition Type"
    public string? Description { get; set; }
    public bool IsSystemPicklist { get; set; }  // Cannot be deleted
    public bool AllowMultiple { get; set; }     // Multi-select enabled
    public bool IsActive { get; set; } = true;

    public virtual ICollection<SalesPicklistValue> Values { get; set; } = new List<SalesPicklistValue>();
}

public class SalesPicklistValue : TenantEntity
{
    public Guid PicklistDefinitionId { get; set; }
    public string Value { get; set; } = string.Empty;    // Stored in DB
    public string Label { get; set; } = string.Empty;    // Displayed to user
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Color { get; set; }  // Hex color for badges

    public virtual SalesPicklistDefinition PicklistDefinition { get; set; } = null!;
}
```

#### API Endpoints

```
GET    /api/salesops/picklists                      # List all picklist definitions
GET    /api/salesops/picklists/:name                # Get single by name with values
GET    /api/salesops/picklists/:name/values         # Get values only (for dropdowns)
POST   /api/salesops/picklists                      # Create new picklist (TenantAdmin)
PUT    /api/salesops/picklists/:id                  # Update picklist definition
DELETE /api/salesops/picklists/:id                  # Delete (if not system)

POST   /api/salesops/picklists/:id/values           # Add value
PUT    /api/salesops/picklists/:id/values/:valueId  # Update value
PUT    /api/salesops/picklists/:id/values/reorder   # Reorder values
DELETE /api/salesops/picklists/:id/values/:valueId  # Deactivate value
```

#### Frontend: Picklist Admin Page

**Location:** `SalesOpsSettingsPage.tsx` → "Picklists" section (or separate `SalesOpsPicklistsPage.tsx`)

**Features:**
1. **List View**
   - Table showing all picklist definitions
   - Columns: Name, Display Label, # Values, System?, Active?
   - Click to expand/manage values

2. **Value Management**
   - Inline editing of values (label, sort order, color, active)
   - Drag-and-drop reordering
   - Add new value button
   - Deactivate (not delete) to preserve history
   - Set default value

3. **Picklist Usage**
   - Show which fields use this picklist
   - Warning before deactivating values in use

#### System Picklists (Seeded on Tenant Creation)

| Picklist Name | Display Label | Initial Values |
|---------------|--------------|----------------|
| `AcquisitionType` | Acquisition Type | 8(a), Small Business, HubZone SB, etc. |
| `ContractType` | Contract Type | FFP, T&M, Cost-Reimbursable, etc. |
| `OpportunityStatus` | Opportunity Status | Initial Prospect/Forecast, etc. |
| `Portfolio` | Portfolio | Defense, National Security, Civilian, etc. |

*Note: Stages are managed separately via `SalesOpsStagesPage` since they have special probability and closed flags.*

#### Frontend Hook: usePicklist

```typescript
// hooks/useSalesOps.ts addition
export function usePicklistValues(picklistName: string) {
  return useQuery({
    queryKey: ['salesops', 'picklists', picklistName, 'values'],
    queryFn: () => salesOpsService.getPicklistValues(picklistName),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Usage in form
const { data: acquisitionTypes } = usePicklistValues('AcquisitionType');

<select name="acquisitionType" value={formData.acquisitionType}>
  <option value="">-- Select --</option>
  {acquisitionTypes?.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   SalesAccount  │────<│ SalesOpportunity│>────│  BiddingEntity  │
│  (Government    │     │  (Main Entity)  │     │ (8(a) Tracking) │
│   Agencies)     │     └────────┬────────┘     └─────────────────┘
└────────┬────────┘              │
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
┌────────v────────┐  ┌──v──────────┐  ┌──v────────────┐
│  SalesContact   │  │ SalesStage  │  │ContractVehicle│
│(Key Personnel)  │  │ (Pipeline)  │  │ (GWAC/IDIQ)   │
└─────────────────┘  └─────────────┘  └───────────────┘

Supporting Entities:
┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│OpportunityTeamMember│  │OpportunityContactRole│  │ OpportunityNote  │
└─────────────────────┘  └─────────────────────┘  └──────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│ OpportunityCapability│  │   LossReason       │  │FieldHistory      │
└─────────────────────┘  └─────────────────────┘  └──────────────────┘

Custom Fields:
┌───────────────────────────┐  ┌────────────────────────┐
│SalesCustomFieldDefinition │──│ SalesCustomFieldValue  │
└───────────────────────────┘  └────────────────────────┘

Forecasting:
┌─────────────────────┐  ┌─────────────────────┐
│ SalesForecastGroup  │──│ SalesForecastTarget │
└─────────────────────┘  └─────────────────────┘
```

### Core Entities

#### SalesOpportunity

The main entity with ~50 hardcoded fields covering:

| Section | Fields |
|---------|--------|
| Identity | OpportunityNumber (auto), Name, Description |
| Relationships | AccountId, BiddingEntityId, PrimaryContactId, OwnerId |
| Classification | StageId, Type, GrowthType, AcquisitionType, ContractType |
| Financials | Amount, TotalContractValue, ProbabilityPercent, WeightedAmount, TargetGrossMarginPercent |
| Key Dates | CloseDate, CloseFY, CloseQtr, RFI/RFP/Proposal dates, ProjectStartDate |
| Contract Details | SolicitationNumber, PrimaryNaicsCode, IsDirectAward, ProposalId |
| Win/Loss | Result, LossReasonId, CustomerFeedback, WinningCompetitor |

#### BiddingEntity (8(a) Tracking)

Critical for federal contracting with SBA certifications:

```csharp
public class BiddingEntity : TenantEntity
{
    public string Name { get; set; }
    public string? LegalName { get; set; }
    public BiddingEntityRole Role { get; set; }  // Prime, Sub

    // SBA 8(a) Tracking
    public DateTime? SbaEntryDate { get; set; }
    public DateTime? SbaExpirationDate { get; set; }
    public bool IsSbaActive { get; }  // Computed
    public int? DaysUntilSbaExpiration { get; }  // Computed

    // Certifications
    public bool IsSmallBusiness { get; set; }
    public bool Is8a { get; set; }
    public bool IsSDVOSB { get; set; }
    public bool IsWOSB { get; set; }
    public bool IsHUBZone { get; set; }

    // Registration
    public string? DunsNumber { get; set; }
    public string? CageCode { get; set; }
    public string? UeiNumber { get; set; }
}
```

#### SalesAccount (Government Agencies)

Hierarchical structure for federal organizations:

```csharp
public class SalesAccount : TenantEntity
{
    public string Name { get; set; }
    public AccountType Type { get; set; }  // Federal, State, Local, International
    public Guid? ParentAccountId { get; set; }  // Hierarchy
    public string? Website { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
```

#### SalesStage (Admin-Configurable Pipeline)

```csharp
public class SalesStage : TenantEntity
{
    public string Name { get; set; }
    public int SortOrder { get; set; }
    public int DefaultProbability { get; set; }  // e.g., Qualified = 25%
    public string? Color { get; set; }  // For kanban board
    public bool IsActive { get; set; }
    public bool IsWonStage { get; set; }
    public bool IsLostStage { get; set; }
}
```

Default Stages: Lead → Qualified → Active Capture → Proposal → Proposal Submitted → Negotiation → Closed

### Enums & Picklist Values

The following enums are admin-configurable per tenant via the Picklist Admin page. Default values are shown below:

#### Acquisition Type
```csharp
// Default picklist values (admin-configurable)
"8(a)"
"Small Business"
"HubZone SB"
"SDVOSB"
"WOSB"
"EDWOSB"
"Minority Business Enterprise"
"Small Disadvantage Business"
"Indian Economic Enterprise (IEE)"
"Unrestricted"
"TBD"
```

#### Contract Type
```csharp
// Default picklist values (admin-configurable)
"Firm Fixed Price (FFP)"
"Time & Material (T&M)"
"Cost-Reimbursable"
"Cost Plus Fee"
"Cost Plus Fixed Fee (CPFF)"
"Labor Hours"
"Single Award IDIQ/SATOC"
"Multi Award IDIQ/MATOC"
"Hybrid"
"Other Transaction Agreements (OTAs)"
"TBD"
```

#### Opportunity Status
```csharp
// Default picklist values (admin-configurable)
// Note: This is separate from Stage - tracks the solicitation lifecycle status
"Initial Prospect/Forecast"
"Initial Capture Planning"
"Market Research/Sources Sought"
"(Submitted) Market Research/Sources Sought"
"Pre-Solicitation Notice Issued"
"Draft RFP Issued (or in full Capture)"
"Final RFP Issued"
"Rough Order of Magnitude (ROM)"
"Best and Final Offer"
"(Submitted) Best and Final Offer"
"Proposal Submitted"
"Indefinite Hold"
```

#### Portfolio
```csharp
// Default picklist values (admin-configurable)
"Defense"
"National Security"
"Civilian"
"Safety & Citizen Services"
```

#### Stage (with Default Probabilities)
```csharp
// Admin-managed via SalesOpsStagesPage - includes probability percentages
"Pre-Identified"       // 1%
"Identified"           // 10%
"Qualified"            // 25%
"Pending"              // 30%
"Active Capture"       // 40%
"Proposal"             // 75%
"Proposal Submitted"   // 90%
"Negotiation"          // 95%
"Closed Won"           // 100% (IsWonStage = true)
"Closed Lost"          // 0% (IsLostStage = true)
"No-Bid"               // 0% (IsLostStage = true)
"Cancelled"            // 0% (IsLostStage = true)
"Archived"             // 0%
"On Hold"              // 0%
```

#### Other Enums (Hardcoded)
```csharp
public enum OpportunityType { NewBusiness, Recompete, TaskOrder, Modification }
public enum GrowthType { NewBusiness, Expansion, Renewal }
public enum OpportunityResult { Won, Lost, NoBid, Cancelled }
public enum RfiStatus { NotStarted, InProgress, Submitted, Accepted, Rejected }
public enum BidDecision { Pending, Bid, NoBid }
public enum AccountType { Federal, State, Local, International, Commercial }
```

---

## Permission Model

### New Role: BusinessDeveloper

```csharp
public enum AppRole
{
    // Existing roles...
    Employee, ViewOnly, TeamLead, ProjectManager, ResourceManager,
    OfficeManager, TenantAdmin, Executive, OverrideApprover,
    SysAdmin, Support, Auditor,

    // NEW
    BusinessDeveloper  // Required for mySalesOps access
}
```

### Permission Matrix

| Resource | BusinessDeveloper | TenantAdmin |
|----------|------------------|-------------|
| SalesOpportunity | CRUD, Export | Full + Approve |
| SalesAccount | CRUD | Full |
| SalesContact | CRUD | Full |
| ContractVehicle | Read | CRUD |
| BiddingEntity | Read | CRUD |
| SalesForecast | Read, Update | Full |
| SalesCustomField | - | Manage |
| SalesSettings | - | Manage |

---

## Frontend Structure

### Module Configuration

```typescript
export const salesModule: ModuleConfig = {
  id: 'salesops',
  name: 'mySalesOps',
  shortName: 'Sales',
  icon: 'currency-dollar',
  basePath: '/salesops',
  color: moduleColors.salesops,
  sections: [
    {
      id: 'dashboard',
      name: '',
      items: [
        { id: 'dashboard', name: 'Dashboard', path: '/salesops', icon: 'chart-pie' },
      ],
    },
    {
      id: 'pipeline',
      name: 'Pipeline',
      items: [
        { id: 'board', name: 'Pipeline Board', path: '/salesops/pipeline', icon: 'view-columns' },
        { id: 'list', name: 'All Opportunities', path: '/salesops/opportunities', icon: 'rectangle-stack' },
        { id: 'calendar', name: 'Calendar', path: '/salesops/calendar', icon: 'calendar' },
      ],
    },
    {
      id: 'accounts',
      name: 'Accounts',
      items: [
        { id: 'accounts', name: 'Accounts', path: '/salesops/accounts', icon: 'building-library' },
        { id: 'contacts', name: 'Contacts', path: '/salesops/contacts', icon: 'users' },
      ],
    },
    {
      id: 'contracts',
      name: 'Contracts',
      items: [
        { id: 'vehicles', name: 'Contract Vehicles', path: '/salesops/vehicles', icon: 'document-text' },
      ],
    },
    {
      id: 'forecast',
      name: 'Forecasting',
      items: [
        { id: 'forecast', name: 'Sales Forecast', path: '/salesops/forecast', icon: 'presentation-chart-line' },
        { id: 'reports', name: 'Reports', path: '/salesops/reports', icon: 'chart-bar' },
      ],
    },
    {
      id: 'admin',
      name: 'Administration',
      roles: [AppRole.TenantAdmin, AppRole.SysAdmin],
      items: [
        { id: 'settings', name: 'Sales Settings', path: '/salesops/settings', icon: 'cog-6-tooth' },
        { id: 'stages', name: 'Pipeline Stages', path: '/salesops/stages', icon: 'view-columns' },
        { id: 'picklists', name: 'Picklists', path: '/salesops/picklists', icon: 'list-bullet' },
        { id: 'entities', name: 'Bidding Entities', path: '/salesops/entities', icon: 'building-office-2' },
        { id: 'fields', name: 'Custom Fields', path: '/salesops/fields', icon: 'adjustments-horizontal' },
      ],
    },
  ],
};
```

### Pages

| Page | Purpose |
|------|---------|
| SalesOpsDashboardPage | KPIs, pipeline chart, SBA expiration alerts |
| SalesOpsPipelinePage | Kanban board view by stage |
| SalesOpsOpportunitiesPage | Table list with advanced filters |
| SalesOpsOpportunityDetailPage | Full detail view (Salesforce-style layout) |
| SalesOpsOpportunityFormPage | Create/edit with dynamic custom fields |
| SalesOpsAccountsPage | Account list |
| SalesOpsAccountFormPage | Account create/edit |
| SalesOpsContactsPage | Contact list |
| SalesOpsContactFormPage | Contact create/edit |
| SalesOpsVehiclesPage | Contract vehicles |
| SalesOpsVehicleFormPage | Vehicle create/edit |
| SalesOpsForecastPage | Forecast grid by FY/Qtr |
| SalesOpsReportsPage | Analytics + Power BI placeholder |
| SalesOpsSettingsPage | Settings hub page |
| SalesOpsStagesPage | Pipeline stage management (existing) |
| SalesOpsPicklistsPage | Admin picklist configuration (NEW) |
| SalesOpsEntitiesPage | 8(a) bidding entity management |
| SalesOpsCustomFieldsPage | Admin custom field configuration |

---

## API Endpoints

### Opportunities

```
GET    /api/salesops/opportunities           # List with filters
GET    /api/salesops/opportunities/:id       # Get single
POST   /api/salesops/opportunities           # Create
PUT    /api/salesops/opportunities/:id       # Update
DELETE /api/salesops/opportunities/:id       # Soft delete
GET    /api/salesops/opportunities/export    # Excel export
```

### Accounts & Contacts

```
GET    /api/salesops/accounts
POST   /api/salesops/accounts
PUT    /api/salesops/accounts/:id
DELETE /api/salesops/accounts/:id

GET    /api/salesops/contacts
POST   /api/salesops/contacts
PUT    /api/salesops/contacts/:id
DELETE /api/salesops/contacts/:id
GET    /api/salesops/contacts/by-account/:accountId
```

### Bidding Entities

```
GET    /api/salesops/bidding-entities
POST   /api/salesops/bidding-entities
PUT    /api/salesops/bidding-entities/:id
DELETE /api/salesops/bidding-entities/:id
GET    /api/salesops/bidding-entities/expiring  # SBA alerts
```

### Configuration

```
GET    /api/salesops/stages
POST   /api/salesops/stages
PUT    /api/salesops/stages/:id
PUT    /api/salesops/stages/reorder

GET    /api/salesops/loss-reasons
POST   /api/salesops/loss-reasons

GET    /api/salesops/contract-vehicles
POST   /api/salesops/contract-vehicles
```

### Picklists (Admin-Configurable)

```
GET    /api/salesops/picklists                      # List all definitions
GET    /api/salesops/picklists/:name                # Get by name with values
GET    /api/salesops/picklists/:name/values         # Get active values only
POST   /api/salesops/picklists                      # Create definition
PUT    /api/salesops/picklists/:id                  # Update definition
DELETE /api/salesops/picklists/:id                  # Delete (non-system only)

POST   /api/salesops/picklists/:id/values           # Add value
PUT    /api/salesops/picklists/:id/values/:valueId  # Update value
PUT    /api/salesops/picklists/:id/values/reorder   # Reorder values
DELETE /api/salesops/picklists/:id/values/:valueId  # Deactivate value
```

### Custom Fields

```
GET    /api/salesops/custom-fields/definitions
POST   /api/salesops/custom-fields/definitions
PUT    /api/salesops/custom-fields/definitions/:id
DELETE /api/salesops/custom-fields/definitions/:id

GET    /api/salesops/custom-fields/values/:entityType/:entityId
PUT    /api/salesops/custom-fields/values/:entityType/:entityId
```

### Forecasting

```
GET    /api/salesops/forecast/summary
GET    /api/salesops/forecast/by-group
GET    /api/salesops/forecast/targets
PUT    /api/salesops/forecast/targets
```

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETED

**Backend:**
- [x] Create entity files in `SalesOps.cs`
- [x] Add DbSets to `MySchedulingDbContext.cs`
- [x] Create EF migration
- [x] Add `BusinessDeveloper` role to `AppRole` enum
- [x] Create base controllers with CRUD:
  - `SalesOpportunitiesController.cs`
  - `SalesAccountsController.cs`
  - `SalesContactsController.cs`
  - `BiddingEntitiesController.cs`
  - `SalesStagesController.cs`
  - `ContractVehiclesController.cs`
  - `LossReasonsController.cs`

**Frontend:**
- [x] Add `salesops` module to `modules.ts`
- [x] Add routes to `App.tsx`
- [x] Create `salesOpsService.ts` with full TypeScript types
- [x] Create placeholder pages for all routes

### Phase 2: Core Opportunity Management ✅ COMPLETED

- [x] Opportunity list page (`SalesOpsOpportunitiesPage.tsx`) with:
  - Search by name/number
  - Stage, Account, Result filters
  - Sortable columns (name, account, amount, date, probability, stage)
  - Pagination
- [x] Opportunity detail page (`SalesOpsOpportunityDetailPage.tsx`) with:
  - Salesforce-style layout with collapsible sections
  - Key metrics summary cards
  - All field sections: Details, Financial, Key Dates, Contract Details, Win/Loss, Strategy, Lead Source
  - Related entity cards (Account, Owner, Bidding Entity, Contract Vehicle, Contact)
  - Overdue alert banner
- [x] Opportunity form (`SalesOpsOpportunityFormPage.tsx`) with:
  - All core fields organized in sections
  - Create and Edit modes
  - Stage-based probability auto-update
- [x] Pipeline kanban board (`SalesOpsPipelinePage.tsx`) with:
  - Stage columns with color coding
  - Opportunity cards with key info
  - Stage summary (count, value, weighted)
  - Empty state with "Seed default stages" button
- [x] Stage management admin page (`SalesOpsStagesPage.tsx`) with:
  - Inline create/edit forms
  - Up/down reordering
  - Color selection
  - Stage type flags (Won, Lost, Closed)
  - Active/Inactive toggle
- [x] React Query hooks (`useSalesOps.ts`) for all entities

### Phase 3: Related Entities ✅ COMPLETED

- [x] Account management (CRUD) - List, Detail, Form pages
  - `SalesOpsAccountsPage.tsx` - List with search, type filter, parent account display
  - `SalesOpsAccountDetailPage.tsx` - Detail with sections, related contacts/opportunities
  - `SalesOpsAccountFormPage.tsx` - Create/edit with parent account selection
- [x] Contact management (CRUD) - List, Detail, Form pages
  - `SalesOpsContactsPage.tsx` - List with search, account filter, sortable columns
  - `SalesOpsContactDetailPage.tsx` - Detail with contact info, quick actions (email/call/LinkedIn)
  - `SalesOpsContactFormPage.tsx` - Create/edit with account selection
- [x] Contract vehicle management - List, Detail, Form pages
  - `SalesOpsVehiclesPage.tsx` - List with stats, type filter, expiration tracking
  - `SalesOpsVehicleDetailPage.tsx` - Detail with expiration warnings, financial summary
  - `SalesOpsVehicleFormPage.tsx` - Create/edit with all vehicle fields
- [x] React Query hooks for all entities
- [x] Service functions with TypeScript DTOs

### Phase 3.5: Admin-Configurable Picklists (NEW)

**Goal:** Allow tenant admins to configure dropdown values for Opportunity fields.

**Backend Tasks:**
- [ ] Create `SalesPicklistDefinition` entity
- [ ] Create `SalesPicklistValue` entity
- [ ] Add DbSets and EF configuration
- [ ] Create migration
- [ ] Create `SalesPicklistsController.cs` with CRUD endpoints
- [ ] Create seed data for system picklists (AcquisitionType, ContractType, OpportunityStatus, Portfolio)

**Frontend Tasks:**
- [ ] Create `SalesOpsPicklistsPage.tsx` - Admin page for managing picklists
  - List all picklist definitions
  - Click to expand and manage values
  - Add/edit/deactivate values
  - Drag-drop reorder
  - Color picker for badges
- [ ] Add route: `/salesops/settings/picklists`
- [ ] Create `usePicklistValues()` hook
- [ ] Update `SalesOpsOpportunityFormPage.tsx` to use dynamic picklists:
  - Replace hardcoded `ACQUISITION_TYPES` array
  - Replace hardcoded `CONTRACT_TYPES` array
  - Add `opportunityStatus` field
  - Add `portfolio` field
- [ ] Update `SalesOpsOpportunityDetailPage.tsx` to display new fields
- [ ] Update opportunity list filters to use dynamic picklists

**API Service Functions:**
```typescript
// salesOpsService.ts additions
getPicklists(): Promise<SalesPicklistDefinition[]>
getPicklistByName(name: string): Promise<SalesPicklistDefinition>
getPicklistValues(name: string): Promise<SalesPicklistValue[]>
createPicklist(data: CreatePicklistDto): Promise<SalesPicklistDefinition>
updatePicklist(id: string, data: UpdatePicklistDto): Promise<SalesPicklistDefinition>
deletePicklist(id: string): Promise<void>
createPicklistValue(picklistId: string, data: CreatePicklistValueDto): Promise<SalesPicklistValue>
updatePicklistValue(picklistId: string, valueId: string, data: UpdatePicklistValueDto): Promise<SalesPicklistValue>
reorderPicklistValues(picklistId: string, valueIds: string[]): Promise<void>
deletePicklistValue(picklistId: string, valueId: string): Promise<void>
```

### Phase 4: 8(a) & Bidding Entities

- [ ] Bidding entity CRUD - List, Detail, Form pages
- [ ] SBA expiration tracking with visual indicators
- [ ] Dashboard alerts for upcoming expirations (90/60/30 days)
- [ ] Certification tracking and badges

### Phase 5: Custom Fields (Detailed Design Below)

**Goal:** Implement Salesforce-like custom field system to support the 100+ fields from the source system.

**Backend Tasks:**
- [ ] Create `SalesCustomFieldDefinition` controller endpoints
- [ ] Create `SalesCustomFieldValue` controller endpoints
- [ ] Add bulk value update endpoint
- [ ] Add field validation logic

**Frontend Tasks:**
- [ ] Custom field definition admin page (`SalesOpsCustomFieldsPage.tsx`)
  - Create/Edit/Delete field definitions
  - Drag-drop reorder within sections
  - Field type selection with preview
  - Picklist option management
- [ ] Dynamic form renderer component (`CustomFieldRenderer.tsx`)
  - Render fields based on definition type
  - Handle all field types (Text, TextArea, Number, Currency, Percent, Date, Checkbox, Picklist, MultiPicklist, Lookup, URL, Email, Phone)
  - Section grouping support
- [ ] Custom field display in detail pages
- [ ] Custom field columns in list views (configurable)
- [ ] Search/filter on custom fields

**Fields to Migrate as Custom Fields (from Salesforce):**

*Note: These fields are NOT in the core entity but should be available as custom fields:*

| Section | Field Name | Field Type | Notes |
|---------|-----------|------------|-------|
| **Deal Qualification** | Client Intent to Buy | Picklist (Red/Yellow/Green) | |
| | Client Intent to Buy Notes | TextArea | |
| | Customer Insight | Picklist (Red/Yellow/Green) | |
| | Customer Insight Notes | TextArea | |
| | Relationships | Picklist (Red/Yellow/Green) | |
| | Relationships Notes | TextArea | |
| | Aleut Track Record/Reputation | Picklist (Red/Yellow/Green) | |
| | Aleut Track Record Notes | TextArea | |
| | Value Proposition | Picklist (Red/Yellow/Green) | |
| | Value Proposition Notes | TextArea | |
| | Competitive Positioning | Picklist (Red/Yellow/Green) | |
| | Competitive Positioning Notes | TextArea | |
| | Solution | Picklist (Red/Yellow/Green) | |
| | Solution Notes | TextArea | |
| | Pricing / Profitability | Picklist (Red/Yellow/Green) | |
| | Pricing / Profitability Notes | TextArea | |
| | Teaming | Picklist (Red/Yellow/Green) | |
| | Teaming Notes | TextArea | |
| | Orals / Site Visit | Picklist (Red/Yellow/Green) | |
| | Orals / Site Visit Notes | TextArea | |
| | Size/Type of Work | Picklist (Red/Yellow/Green) | |
| | Size/Type of Work Notes | TextArea | |
| | Leverages Assets | Picklist (Red/Yellow/Green) | |
| | Leverages Assets Notes | TextArea | |
| | Delivery Skills / Key Personnel | Picklist (Red/Yellow/Green) | |
| | Delivery Skills Notes | TextArea | |
| | Risk | Picklist (Red/Yellow/Green) | |
| | Risk Notes | TextArea | |
| **Proposal Response** | Proposal Manager | Lookup (User) | |
| | Pricing / Estimation | Text | |
| | Proposal Tech Volume | Picklist (Simple/Moderate/Complex) | |
| | Proposal Pricing | Picklist (Simple/Moderate/Complex) | |
| | Proposal Comments | TextArea | |
| | Key Personnel | TextArea | |
| **Opportunity Classification** | Opportunity Status | Picklist | ? What values? |
| | Follow-On Opportunity | Lookup (Opportunity) | |
| | Federal Department | Picklist | ? Same as Account.FederalDepartment? |
| | Portfolio | Picklist | ? What values? |
| **Additional Info** | OppCapabilityCount | Number | Auto-calculated? |
| | Close FTR | Text | ? Fiscal quarter format? |
| | Opportunity Record Type | Picklist | ? What values? |

**Clarification Answers:**

1. **Opportunity Status** - ✅ See picklist values above. This is separate from Stage - it tracks the solicitation lifecycle status (e.g., "Draft RFP Issued", "Final RFP Issued") while Stage tracks the sales process stage.

2. **Portfolio** - ✅ Values: Defense, National Security, Civilian, Safety & Citizen Services. This is a field on the Opportunity, not inherited from Account.

3. **Federal Department** - ✅ This is a lookup to Account's FederalDepartment - display only, no separate field on Opportunity.

4. **OppCapabilityCount** - ✅ Auto-calculated from OpportunityCapability relationships (count of related records).

5. **Close FY/Qtr Fields** - ✅ Three fields needed:
   - `CloseFiscalYear` - e.g., "FY2025"
   - `CloseFiscalQuarter` - e.g., "Q1"
   - `CloseFiscalYearQuarter` - e.g., "FY2025Q1" (computed or stored)

6. **Opportunity Record Type** - ✅ Not needed. The multi-tenant solution covers this - each tenant configures their own fields.

### Phase 6: Forecasting & Reports

- [ ] Forecast page (FY/Qtr grid)
- [ ] Dashboard KPIs (pipeline value, win rate, avg deal size, etc.)
- [ ] Basic charts (pipeline by stage, by owner, by close date)
- [ ] Excel export
- [ ] Power BI placeholder frame

### Phase 7: Polish

- [ ] Field history tracking (audit log of changes)
- [ ] Notes/activity feed on opportunity detail
- [ ] Calendar view for close dates
- [ ] Mobile responsiveness review
- [ ] Performance optimization

**Total Estimate: ~3 weeks accelerated**

---

## Files Created/Modified

### Backend - New Files

```
backend/src/MyScheduling.Core/Entities/
└── SalesOps.cs  (All entities in single file)

backend/src/MyScheduling.Api/Controllers/
├── SalesOpportunitiesController.cs
├── SalesAccountsController.cs
├── SalesContactsController.cs
├── BiddingEntitiesController.cs
├── SalesStagesController.cs
├── SalesCustomFieldsController.cs
└── ContractVehiclesController.cs
```

### Backend - Modified Files

```
backend/src/MyScheduling.Infrastructure/Data/MySchedulingDbContext.cs
  - Add DbSets for all new entities
  - Add ConfigureSalesOps() method

backend/src/MyScheduling.Core/Enums/AppRole.cs
  - Add BusinessDeveloper role
```

### Frontend - New Files

```
frontend/src/pages/salesops/
├── SalesOpsDashboardPage.tsx        # Placeholder
├── SalesOpsOpportunitiesPage.tsx    # ✅ List with filters/sorting
├── SalesOpsOpportunityDetailPage.tsx # ✅ SF-style detail view
├── SalesOpsOpportunityFormPage.tsx  # ✅ Create/Edit form
├── SalesOpsPipelinePage.tsx         # ✅ Kanban board
├── SalesOpsAccountsPage.tsx         # Placeholder
├── SalesOpsContactsPage.tsx         # Placeholder
├── SalesOpsVehiclesPage.tsx         # Placeholder
├── SalesOpsCalendarPage.tsx         # Placeholder
├── SalesOpsForecastPage.tsx         # Placeholder
├── SalesOpsReportsPage.tsx          # Placeholder
├── SalesOpsSettingsPage.tsx         # Settings hub
├── SalesOpsStagesPage.tsx           # ✅ Stage management admin
├── SalesOpsEntitiesPage.tsx         # Placeholder
├── SalesOpsCustomFieldsPage.tsx     # Placeholder
└── index.ts                         # ✅ Exports

frontend/src/services/salesOpsService.ts  # ✅ Full API service with types
frontend/src/hooks/useSalesOps.ts         # ✅ React Query hooks
```

### Frontend - Modified Files

```
frontend/src/config/modules.ts
  - ✅ Added salesModule

frontend/src/App.tsx
  - ✅ Added /salesops routes with all page components
```

---

## Future Enhancements

- SAM.gov API integration for opportunity discovery
- GovWin integration for market intelligence
- Power BI embedded dashboards
- Document generation (proposals, pricing)
- Workflow automation (stage transitions, approvals)
- Email integration for contact tracking
- Mobile app support
- AI-powered win probability scoring

---

*Last Updated: 2025-12-16*
