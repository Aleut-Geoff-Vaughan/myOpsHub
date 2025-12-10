# myFacilities Portal - Comprehensive Design Document

## Overview

myFacilities is an enterprise-level facilities management portal within the myScheduling platform. It unifies hoteling, facilities management, lease tracking, field personnel management, and FSO security operations into a single cohesive portal.

**Portal Access URL:** `/facilities`

---

## Implementation Status Summary

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 - Basic Facilities | COMPLETE | Space CRUD, seed data, basic booking |
| Phase 2 - Admin Enhancement | COMPLETE | Bulk import/export, floors/zones, booking enhancements |
| Phase 3 - myFacilities Portal Core | COMPLETE | Portal layout, dashboard, API controllers, admin migration |
| Phase 4 - Feature Pages | COMPLETE | All 16 feature pages implemented |
| Phase 5 - Advanced Features | PENDING | MS Teams integration, real-time analytics |

---

## Phase 1: Basic Facilities COMPLETE

### Completed Items
1. Fixed FacilitiesPage padding issue (added `p-6` class)
2. Created SpaceModal component for Add/Edit Space operations
3. Wired Add Space button to modal functionality
4. Added Edit/Delete functionality for spaces
5. Created seed data script (SeedFacilitiesData.cs)
6. Seeded test spaces for all 8 existing offices (200 spaces total)

### Test Data Created
Each office received 25 spaces:
- 10 Hot Desks (HD-001 through HD-010)
- 5 Private Offices (PO-001 through PO-005)
- 3 Conference Rooms (CR-001 through CR-003)
- 2 Huddle Rooms (HR-001, HR-002)
- 2 Phone Booths (PB-001, PB-002)
- 1 Training Room (TR-001)
- 1 Break Room (BR-001)
- 5 Parking Spots (PS-001 through PS-005)

---

## Phase 2: Admin Enhancement COMPLETE

### Backend
1. Created Floor, Zone, SpaceAssignment, BookingRule entities in Hoteling.cs
2. Added EF Core migrations for facilities entities
3. Created FacilitiesAdminController with CRUD endpoints
4. Added bulk import/export endpoints (Excel format via ClosedXML)
5. Enhanced Booking entity with tracking fields (`BookedByUserId`, `BookedAt`, `IsPermanent`)
6. Enhanced CheckInEvent entity for daily check-ins on multi-day bookings
7. Created CreateBookingRequest DTO for proper model binding
8. Fixed UTC DateTime handling for PostgreSQL compatibility

### Frontend - Admin Portal
1. Created AdminFacilitiesPage (`/admin/facilities`) with tabs (Overview, Import/Export, Floors, Zones)
2. Created AdminOfficeDetailPage (`/admin/facilities/offices/:officeId`)
3. Created AdminSpaceDetailPage (`/admin/facilities/spaces/:spaceId`)
4. Created SpaceModal component for space CRUD operations
5. Enhanced BookingModal component with self/on-behalf booking and permanent booking support
6. Added Excel template downloads for all entity types
7. Added validation and error reporting for imports

---

## Phase 3: myFacilities Portal Core COMPLETE

### Migration from Admin Portal COMPLETE

The following pages have been migrated from the Admin portal into the myFacilities portal:

| Original Location | New Location | Status |
|-------------------|--------------|--------|
| `/admin/offices` (AdminOfficesPage) | `/facilities/admin/offices` | COMPLETE |
| `/admin/facilities` (AdminFacilitiesPage) | `/facilities/admin` | COMPLETE |
| `/admin/facilities/office/:id` | `/facilities/admin/offices/:id` | COMPLETE |
| `/admin/facilities/space/:id` | `/facilities/admin/spaces/:id` | COMPLETE |

**Migration Completed:**
1. Created `frontend/src/pages/facilities/` directory structure
2. Created `OfficeManagementPage.tsx` - Office CRUD with address autocomplete, teal color scheme
3. Created `FacilitiesAdminPage.tsx` - Full admin page with 5 tabs (Overview, Spaces, Import/Export, Floors, Zones)
4. Updated `FacilitiesLayout.tsx` sidebar with Administration section links
5. Updated `App.tsx` with routes for all migrated pages
6. Reuses existing detail pages: `AdminOfficeDetailPage`, `AdminSpaceDetailPage`

**Files Created:**
- `frontend/src/pages/facilities/OfficeManagementPage.tsx` (~500 lines)
- `frontend/src/pages/facilities/FacilitiesAdminPage.tsx` (~900 lines)

**Key Changes:**
- All blue colors (`blue-600`, `blue-700`, etc.) replaced with teal (`teal-600`, `teal-700`, etc.)
- All internal links updated to use `/facilities/admin/...` paths
- React Query hooks for data fetching
- Toast notifications for user feedback
- Modal forms for CRUD operations

### Backend - COMPLETE

#### New Entities Created (`backend/src/MyScheduling.Core/Entities/Facilities.cs`)

##### Lease Management
- **Lease** - Full lease tracking with landlord info, costs, terms, compliance
- **LeaseOptionYear** - Option year tracking with exercise workflow
- **LeaseAmendment** - Amendments and modifications to leases
- **LeaseAttachment** - Document storage via IFileStorageService

##### Office Information
- **OfficeTravelGuide** - Comprehensive travel/visitor information
- **OfficePoc** - Points of contact by role
- **FacilityAnnouncement** - Office-specific or global announcements
- **AnnouncementAcknowledgment** - Track user acknowledgments

##### Field Personnel & FSO
- **ClientSiteDetail** - Extended client site information
- **FieldAssignment** - Employee assignments to client sites
- **EmployeeClearance** - Security clearance tracking
- **ForeignTravelRecord** - Pre/post travel workflow
- **ScifAccessLog** - SCIF entry/exit logging

##### Check-In & Presence
- **FacilityCheckIn** - General facility check-in (Web, Mobile, QR, NFC, Badge)

##### Configuration
- **FacilityAttributeDefinition** - Custom tenant attributes
- **FacilityUsageDaily** - Aggregated usage statistics

#### Backend Controllers Created

##### FacilitiesPortalController (`/api/facilities-portal`)
**File:** `backend/src/MyScheduling.Api/Controllers/FacilitiesPortalController.cs`

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/dashboard` | GET | Facility.Read | Dashboard summary statistics |
| `/announcements` | GET | Facility.Read | List announcements |
| `/announcements` | POST | Facility.Manage | Create announcement |
| `/announcements/{id}/acknowledge` | POST | Facility.Read | Acknowledge announcement |
| `/offices` | GET | Facility.Read | Office directory |
| `/offices/{id}` | GET | Facility.Read | Office detail with travel guide |
| `/offices/{officeId}/travel-guide` | GET | Facility.Read | Get travel guide |
| `/offices/{officeId}/travel-guide` | PUT | Facility.Manage | Upsert travel guide |
| `/offices/{officeId}/pocs` | GET | Facility.Read | Get POCs |
| `/offices/{officeId}/pocs` | POST | Facility.Manage | Add/update POC |
| `/check-in` | POST | Facility.Read | Quick check-in |
| `/check-out/{checkInId}` | POST | Facility.Read | Check out |
| `/my-check-ins` | GET | Facility.Read | User's check-ins |
| `/offices/{officeId}/whos-here` | GET | Facility.Read | Who's in office |

##### LeasesController (`/api/leases`)
**File:** `backend/src/MyScheduling.Api/Controllers/LeasesController.cs`

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/` | GET | Lease.Read | List leases |
| `/{id}` | GET | Lease.Read | Get lease |
| `/` | POST | Lease.Create | Create lease |
| `/{id}` | PUT | Lease.Update | Update lease |
| `/{id}` | DELETE | Lease.Delete | Delete lease |
| `/{leaseId}/options` | POST | Lease.Update | Add option year |
| `/{leaseId}/options/{optionId}/exercise` | POST | Lease.Update | Exercise option |
| `/{leaseId}/amendments` | POST | Lease.Update | Add amendment |
| `/{leaseId}/attachments` | POST | Lease.Update | Upload attachment |
| `/{leaseId}/attachments/{id}/download` | GET | Lease.Read | Download attachment |
| `/{leaseId}/attachments/{id}` | DELETE | Lease.Update | Delete attachment |
| `/calendar` | GET | Lease.Read | Lease calendar events |

##### FieldPersonnelController (`/api/field-personnel`)
**File:** `backend/src/MyScheduling.Api/Controllers/FieldPersonnelController.cs`

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/assignments` | GET | FieldAssignment.Read | List assignments |
| `/assignments/{id}` | GET | FieldAssignment.Read | Get assignment |
| `/assignments` | POST | FieldAssignment.Create | Create assignment |
| `/assignments/{id}` | PUT | FieldAssignment.Update | Update assignment |
| `/assignments/{id}/approve` | POST | FieldAssignment.Manage | Approve assignment |
| `/assignments/{id}/verify-clearance` | POST | FieldAssignment.Manage | Verify clearance |
| `/client-sites` | GET | ClientSite.Read | List client sites |
| `/client-sites/{officeId}` | PUT | ClientSite.Manage | Upsert client site |
| `/clearances` | GET | Clearance.Read | List clearances |
| `/clearances` | POST | Clearance.Manage | Upsert clearance |
| `/foreign-travel` | GET | ForeignTravel.Read | List travel records |
| `/foreign-travel` | POST | ForeignTravel.Create | Submit travel request |
| `/foreign-travel/{id}/approve` | POST | ForeignTravel.Manage | Approve travel |
| `/foreign-travel/{id}/briefing` | POST | ForeignTravel.Manage | Record briefing |
| `/foreign-travel/{id}/debrief` | POST | ForeignTravel.Manage | Record debriefing |
| `/scif-access` | GET | ScifAccess.Read | List SCIF logs |
| `/scif-access` | POST | ScifAccess.Create | Log SCIF access |
| `/scif-access/{id}/exit` | POST | ScifAccess.Update | Record exit |

### Frontend - COMPLETE

#### Portal Layout (`frontend/src/components/layout/FacilitiesLayout.tsx`)
- Teal color scheme (#0d9488 primary)
- Sidebar navigation with collapsible groups
- Role-based menu filtering
- Portal switching in user dropdown (myScheduling, Manager, myForecast, Admin)
- Search modal integration (Ctrl+K)

**Navigation Groups:**
1. **Overview** - Dashboard, Quick Check-In, Who's Here
2. **Offices** - Directory, Travel Guides, Announcements
3. **Lease Management** - Leases, Option Years (managers only)
4. **Field Personnel** - Assignments, Client Sites (managers only)
5. **Security / FSO** - Clearances, Foreign Travel, SCIF Access (managers only)
6. **Reports** - Usage Analytics (managers only)
7. **Administration** - Settings (admins only)

#### API Service (`frontend/src/services/facilitiesPortalService.ts`)
Complete TypeScript service with all types/enums and API methods for:
- Dashboard
- Announcements
- Office Directory & Travel Guides
- Check-In/Out & Who's Here
- Leases & Option Years
- Field Assignments & Client Sites
- Clearances & Foreign Travel

#### Dashboard Page (`frontend/src/pages/FacilitiesDashboardPage.tsx`)
- Stat cards: Offices, Spaces, Active Leases, Field Assignments
- Quick action buttons: Check-In, Who's Here, Directory, Travel Guides
- Recent announcements with type/priority badges
- Maintenance request alerts

#### Routes (`frontend/src/App.tsx`)
```tsx
/facilities                 -> FacilitiesDashboardPage
/facilities/check-in        -> Quick Check-In (Coming Soon)
/facilities/whos-here       -> Who's Here (Coming Soon)
/facilities/offices         -> Office Directory (Coming Soon)
/facilities/offices/:id     -> Office Detail (Coming Soon)
/facilities/travel-guides   -> Travel Guides (Coming Soon)
/facilities/announcements   -> Announcements (Coming Soon)
/facilities/leases          -> Lease Management (Coming Soon)
/facilities/leases/:id      -> Lease Detail (Coming Soon)
/facilities/option-years    -> Option Years Calendar (Coming Soon)
/facilities/field-assignments -> Field Assignments (Coming Soon)
/facilities/client-sites    -> Client Sites (Coming Soon)
/facilities/clearances      -> Clearances (Coming Soon)
/facilities/foreign-travel  -> Foreign Travel (Coming Soon)
/facilities/scif-access     -> SCIF Access Logs (Coming Soon)
/facilities/analytics       -> Usage Analytics (Coming Soon)
/facilities/settings        -> Facilities Settings (Coming Soon)
```

---

## Phase 4: Feature Pages COMPLETE

### All Pages Implemented

#### 4.1 Office Directory Page `/facilities/offices` COMPLETE
**File:** `frontend/src/pages/facilities/OfficeDirectoryPage.tsx`

**Features Implemented:**
- Grid and list view toggle
- Search by name, city, state, address
- Filter by type (Company/Client Site) and state
- Office cards with gradient headers, status badges
- Quick action buttons (View, Check-In, Who's Here)
- Responsive design

#### 4.2 Quick Check-In Page `/facilities/check-in` COMPLETE
**File:** `frontend/src/pages/facilities/CheckInPage.tsx`

**Features Implemented:**
- Office selection dropdown
- Current check-in status display
- Location capture (GPS)
- Notes field
- Check-out functionality
- Recent check-ins history

#### 4.3 Who's Here Page `/facilities/whos-here` COMPLETE
**File:** `frontend/src/pages/facilities/WhosHerePage.tsx`

**Features Implemented:**
- Office selection dropdown
- Real-time people list (30-second refresh)
- Person search by name/email
- Check-in duration display
- Link to check-in page

#### 4.4 Announcements Page `/facilities/announcements` COMPLETE
**File:** `frontend/src/pages/facilities/AnnouncementsPage.tsx`

**Features Implemented:**
- Filter by type (General, Maintenance, Safety, Policy, Event, Emergency)
- Filter by priority (Low, Normal, High, Urgent)
- Urgent announcements highlighted at top
- Create announcement modal (for managers)
- Acknowledgment button for required announcements
- Type and priority badges

#### 4.5 Travel Guides Page `/facilities/travel-guides` COMPLETE
**File:** `frontend/src/pages/facilities/TravelGuidesPage.tsx`

**Features Implemented:**
- Side-by-side office list and guide display
- Search offices
- Rich sections: Directions, Parking, Building Access, Lodging, Emergency Info
- Print-friendly layout
- Last updated timestamp

#### 4.6 Office Detail Page `/facilities/offices/:officeId` COMPLETE
**File:** `frontend/src/pages/facilities/OfficeDetailPage.tsx`

**Features Implemented:**
- Office info header with address and status
- Tabbed interface (Overview, Travel Guide, Spaces, Announcements)
- Quick actions (Book a space, Check-in, Report issue)
- Points of contact display
- Integration with travel guide data

#### 4.7 Lease Management Page `/facilities/leases` COMPLETE
**File:** `frontend/src/pages/facilities/LeaseManagementPage.tsx`

**Features Implemented:**
- List all leases with status filtering
- Key metrics display (monthly cost, SF, expiration)
- Status badges (Active, Expiring, Draft, Terminated)
- Sortable columns
- Search by office/landlord
- Quick view and edit actions

#### 4.8 Lease Detail Page `/facilities/leases/:leaseId` COMPLETE
**File:** `frontend/src/pages/facilities/LeaseDetailPage.tsx`

**Features Implemented:**
- Header with office name, lease number, status
- Tabbed interface (Overview, Costs, Option Years, Amendments, Attachments)
- Option year exercise workflow
- Amendment history
- Document attachment management

#### 4.9 Option Years Calendar `/facilities/option-years` COMPLETE
**File:** `frontend/src/pages/facilities/OptionYearsCalendarPage.tsx`

**Features Implemented:**
- Calendar view of key lease dates
- Event types with color coding
- Click to view lease details
- Legend for event types
- Month/year navigation

#### 4.10 Field Assignments Page `/facilities/field-assignments` COMPLETE
**File:** `frontend/src/pages/facilities/FieldAssignmentsPage.tsx`

**Features Implemented:**
- List of field personnel assignments
- Filter by status (Active, Pending, Completed)
- Summary cards with counts
- Approval workflow actions
- Assignment detail modal

#### 4.11 Client Sites Page `/facilities/client-sites` COMPLETE
**File:** `frontend/src/pages/facilities/ClientSitesPage.tsx`

**Features Implemented:**
- Grid of client sites with security levels
- Filter by clearance level
- SCIF indicator badges
- Site detail modal with contacts and procedures
- Personnel count display

#### 4.12 Clearances Page `/facilities/clearances` COMPLETE
**File:** `frontend/src/pages/facilities/ClearancesPage.tsx`

**Features Implemented:**
- List employee clearances
- Filter by level (Secret, TS, TS/SCI)
- Expiration tracking with alerts
- SCIF access badges
- Status color coding

#### 4.13 Foreign Travel Page `/facilities/foreign-travel` COMPLETE
**File:** `frontend/src/pages/facilities/ForeignTravelPage.tsx`

**Features Implemented:**
- List travel requests by status
- Approval workflow with briefing/debriefing
- Request form for employees
- FSO dashboard for pending approvals
- Travel history with detail modal

#### 4.14 SCIF Access Logs `/facilities/scif-access` COMPLETE
**File:** `frontend/src/pages/facilities/ScifAccessPage.tsx`

**Features Implemented:**
- Placeholder page for SCIF access logging
- Summary cards for entries/exits/visitors
- Filter by date and facility
- Access type legend
- Info card about upcoming features

#### 4.15 Usage Analytics Page `/facilities/analytics` COMPLETE
**File:** `frontend/src/pages/facilities/UsageAnalyticsPage.tsx`

**Features Implemented:**
- Date range selector
- Office utilization charts
- Space type breakdown
- Weekly trend visualization
- Key metrics cards

#### 4.16 Facilities Settings Page `/facilities/settings` COMPLETE
**File:** `frontend/src/pages/facilities/FacilitiesSettingsPage.tsx`

**Features Implemented:**
- Tabbed interface (General, Booking Rules, Notifications, Integrations, Attributes)
- General settings (check-in window, auto-release, business hours)
- Feature toggles (require check-in, GPS verification)
- Booking rules management
- Notification preferences table
- Integration cards (Teams, Outlook, Badge System, Slack)
- Custom attribute definitions

---

## Data Model Reference

### Enums

```csharp
// Lease Management
enum LeaseStatus { Draft, Active, Expiring, InRenewal, Terminated, Expired, Superseded }
enum OptionYearStatus { Available, Exercised, Declined, Expired, Negotiating }
enum AmendmentType { RentAdjustment, SpaceExpansion, SpaceReduction, TermExtension, TermReduction, CostAdjustment, Other }
enum LeaseAttachmentType { LeaseDocument, Amendment, FloorPlan, InsuranceCertificate, Estoppel, Correspondence, Invoice, Photo, Other }

// Security
enum SecurityClearanceLevel { None, PublicTrust, Secret, TopSecret, TopSecretSci }
enum ClearanceStatus { Active, Suspended, Revoked, Expired, InProcess, Pending, Interim }

// Field Personnel
enum FieldAssignmentStatus { Pending, Active, OnHold, Completed, Terminated, Cancelled }

// Travel
enum TravelPurpose { Personal, Business, Conference, Training, Family, Medical, Military, Other }
enum ForeignTravelStatus { Pending, Approved, Denied, Completed, Cancelled }

// Check-In
enum CheckInMethod { Web, Mobile, Kiosk, QrCode, NfcTap, BadgeSwipe, Manual }

// Announcements
enum AnnouncementType { General, Maintenance, Emergency, Policy, Event, Holiday, SecurityAlert }
enum AnnouncementPriority { Low, Normal, High, Urgent }

// POC Roles
enum OfficePocRole { FacilitiesManager, OfficeManager, SecurityOfficer, ItSupport, HrRepresentative, SafetyOfficer, BuildingMaintenance, Reception, Fso, Issm, Other }

// SCIF
enum ScifAccessType { Regular, Escorted, Maintenance, Inspection, Emergency }
```

### Key Entity Relationships

```
Office (1) --> (many) Lease
Lease (1) --> (many) LeaseOptionYear
Lease (1) --> (many) LeaseAmendment
Lease (1) --> (many) LeaseAttachment

Office (1) --> (0..1) OfficeTravelGuide
Office (1) --> (many) OfficePoc
Office (1) --> (many) FacilityAnnouncement (nullable for all-office announcements)

Office [IsClientSite=true] (1) --> (0..1) ClientSiteDetail
Office (1) --> (many) FieldAssignment
User (1) --> (many) FieldAssignment
User (1) --> (0..1) EmployeeClearance
User (1) --> (many) ForeignTravelRecord
User (1) --> (many) ScifAccessLog

User (1) --> (many) FacilityCheckIn
Office (1) --> (many) FacilityCheckIn
```

---

## API Endpoint Summary

### Facilities Portal (`/api/facilities-portal`)
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /dashboard | Facility.Read |
| GET | /announcements | Facility.Read |
| POST | /announcements | Facility.Manage |
| POST | /announcements/{id}/acknowledge | Facility.Read |
| GET | /offices | Facility.Read |
| GET | /offices/{id} | Facility.Read |
| GET | /offices/{officeId}/travel-guide | Facility.Read |
| PUT | /offices/{officeId}/travel-guide | Facility.Manage |
| GET | /offices/{officeId}/pocs | Facility.Read |
| POST | /offices/{officeId}/pocs | Facility.Manage |
| POST | /check-in | Facility.Read |
| POST | /check-out/{checkInId} | Facility.Read |
| GET | /my-check-ins | Facility.Read |
| GET | /offices/{officeId}/whos-here | Facility.Read |

### Leases (`/api/leases`)
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | / | Lease.Read |
| GET | /{id} | Lease.Read |
| POST | / | Lease.Create |
| PUT | /{id} | Lease.Update |
| DELETE | /{id} | Lease.Delete |
| POST | /{leaseId}/options | Lease.Update |
| POST | /{leaseId}/options/{optionId}/exercise | Lease.Update |
| POST | /{leaseId}/amendments | Lease.Update |
| POST | /{leaseId}/attachments | Lease.Update |
| GET | /{leaseId}/attachments/{id}/download | Lease.Read |
| DELETE | /{leaseId}/attachments/{id} | Lease.Update |
| GET | /calendar | Lease.Read |

### Field Personnel (`/api/field-personnel`)
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /assignments | FieldAssignment.Read |
| GET | /assignments/{id} | FieldAssignment.Read |
| POST | /assignments | FieldAssignment.Create |
| PUT | /assignments/{id} | FieldAssignment.Update |
| POST | /assignments/{id}/approve | FieldAssignment.Manage |
| POST | /assignments/{id}/verify-clearance | FieldAssignment.Manage |
| GET | /client-sites | ClientSite.Read |
| PUT | /client-sites/{officeId} | ClientSite.Manage |
| GET | /clearances | Clearance.Read |
| POST | /clearances | Clearance.Manage |
| GET | /foreign-travel | ForeignTravel.Read |
| POST | /foreign-travel | ForeignTravel.Create |
| POST | /foreign-travel/{id}/approve | ForeignTravel.Manage |
| POST | /foreign-travel/{id}/briefing | ForeignTravel.Manage |
| POST | /foreign-travel/{id}/debrief | ForeignTravel.Manage |
| GET | /scif-access | ScifAccess.Read |
| POST | /scif-access | ScifAccess.Create |
| POST | /scif-access/{id}/exit | ScifAccess.Update |

---

## File Reference

### Backend Files

| File | Description |
|------|-------------|
| `backend/src/MyScheduling.Core/Entities/Facilities.cs` | All facilities entities |
| `backend/src/MyScheduling.Core/Entities/Hoteling.cs` | Booking-related entities |
| `backend/src/MyScheduling.Api/Controllers/FacilitiesPortalController.cs` | Portal API |
| `backend/src/MyScheduling.Api/Controllers/LeasesController.cs` | Lease management API |
| `backend/src/MyScheduling.Api/Controllers/FieldPersonnelController.cs` | Field personnel/FSO API |
| `backend/src/MyScheduling.Api/Controllers/FacilitiesAdminController.cs` | Admin bulk operations |
| `backend/src/MyScheduling.Infrastructure/Data/MySchedulingDbContext.cs` | DbContext with entity configs |

### Frontend Files

| File | Description |
|------|-------------|
| `frontend/src/components/layout/FacilitiesLayout.tsx` | Portal layout with sidebar |
| `frontend/src/services/facilitiesPortalService.ts` | API service and types |
| `frontend/src/pages/FacilitiesDashboardPage.tsx` | Dashboard page |
| `frontend/src/App.tsx` | Route definitions |

---

## Known Issues & Considerations

### Build Fixes Applied
1. Renamed `CheckInRequest` to `FacilityCheckInRequest` (conflict with BookingsController)
2. Renamed `ApprovalRequest` to `FieldApprovalRequest` (conflict with ProjectBudgetsController)
3. Fixed `IFileStorageService` method names (`UploadFileAsync`, `DownloadFileAsync`, `DeleteFileAsync`)
4. Added `StoredFileId` property to `LeaseAttachment` for blob storage reference
5. Added `new` keyword to `GetCurrentUserId()` in controllers to properly hide inherited member

### Technical Notes
- All DateTime values stored in UTC for PostgreSQL compatibility
- Soft delete pattern used (`IsDeleted` flag) with global query filters
- Multi-tenant: All entities inherit from `TenantEntity`
- Permission-based auth via `[RequiresPermission]` attribute

### Future Enhancements (Backlog)
- MS Teams Rooms integration for conference room sync
- Outlook calendar sync for bookings
- Interactive floor plan visualization
- QR code generation for check-in
- Mobile app with NFC support
- Custom attribute configuration UI
- Usage analytics dashboard with charts
- Email notifications for lease deadlines

---

## Development Workflow

### Starting the Application
```bash
# Terminal 1: Backend
cd backend/src/MyScheduling.Api
dotnet run --urls http://localhost:5107

# Terminal 2: Frontend
cd frontend
VITE_API_PROXY_TARGET=http://localhost:5107 npm run dev
```

### Access URLs
- Frontend: http://localhost:5173/facilities
- API Swagger: http://localhost:5107/swagger
- Health Check: http://localhost:5107/health

### Test Account
- Email: `admin@admin.com`

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-09 | 4.0 | Phase 4 COMPLETE - All 16 feature pages implemented |
| 2025-12-09 | 3.0 | Phase 3 - myFacilities Portal core implementation |
| Previous | 2.0 | Phase 2 - Admin enhancements, bulk import/export |
| Previous | 1.0 | Phase 1 - Basic facilities and seed data |
