# Enterprise Facilities Management - Design Document

## Overview

This document outlines the design for transforming the current Facilities page and Admin Offices functionality into a comprehensive enterprise-level Facilities Management system.

---

## Phase 1 Status: ✅ COMPLETE

### Completed Items
1. ✅ Fixed FacilitiesPage padding issue (added `p-6` class)
2. ✅ Created SpaceModal component for Add/Edit Space operations
3. ✅ Wired Add Space button to modal functionality
4. ✅ Added Edit/Delete functionality for spaces
5. ✅ Created seed data script (SeedFacilitiesData.cs)
6. ✅ Seeded test spaces for all 8 existing offices (200 spaces total)

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

## Phase 2 Status: ✅ COMPLETE

### Completed Items

#### Backend
1. ✅ Created Floor, Zone, SpaceAssignment, BookingRule entities in Hoteling.cs
2. ✅ Added EF Core migrations for facilities entities
3. ✅ Created FacilitiesAdminController with CRUD endpoints
4. ✅ Added bulk import/export endpoints (Excel format via ClosedXML)
5. ✅ Enhanced Booking entity with tracking fields:
   - `BookedByUserId` - Who made the booking (may differ from user it's for)
   - `BookedAt` - When the booking was created
   - `IsPermanent` - Flag for indefinite/permanent bookings
6. ✅ Enhanced CheckInEvent entity for daily check-ins on multi-day bookings
7. ✅ Created CreateBookingRequest DTO for proper model binding
8. ✅ Fixed UTC DateTime handling for PostgreSQL compatibility

#### Frontend - Admin Portal
1. ✅ Created AdminFacilitiesPage (`/admin/facilities`) with tabs:
   - Overview tab - Dashboard with office/space statistics
   - Import/Export tab - Bulk Excel operations
   - Floors tab - Floor management
   - Zones tab - Zone management
2. ✅ Created AdminOfficeDetailPage (`/admin/facilities/offices/:officeId`)
   - Office details display
   - Space management (list, add, edit, delete)
   - Booking overview for the office
3. ✅ Created AdminSpaceDetailPage (`/admin/facilities/spaces/:spaceId`)
   - Space details display
   - Current and upcoming bookings table with "Booked For" column
   - Past bookings table with "Booked For" column
   - Edit booking functionality (restricted to isPermanent and dates only)
   - Add booking functionality (full form with on-behalf-of booking support)
4. ✅ Created SpaceModal component for space CRUD operations
5. ✅ Enhanced BookingModal component:
   - Self-booking toggle (defaults to logged-in user)
   - On-behalf-of booking when toggle is enabled
   - Permanent/indefinite booking support
   - Create mode: Full form with all fields editable
   - Edit mode: Read-only display for space/user/status, only isPermanent and dates editable
   - Pre-populated office/space when opened from space detail page
6. ✅ Added Excel template downloads for all entity types
7. ✅ Added validation and error reporting for imports

#### Navigation
1. ✅ Added Admin Layout with Facilities link
2. ✅ Added Manager Layout structure
3. ✅ Created proper routing for facilities admin pages

---

## Current State

### Existing Entities (Fully Implemented)

#### Core Entities
- **Office**: Tenant-scoped locations with address, timezone, status, client site flag, coordinates
- **Space**: Bookable units with type, capacity, equipment, features, daily cost, booking rules
- **Floor**: Organizes spaces by floor level with floor plan URL support
- **Zone**: Groups spaces within floors with color coding
- **Booking**: Reservations with user tracking, permanent booking support, bookedBy/bookedAt fields
- **SpaceAssignment**: Long-term/permanent desk assignments
- **BookingRule**: Configurable booking policies (duration, advance booking, time restrictions)
- **FacilityPermission**: Role-based and user-specific access control
- **SpaceMaintenanceLog**: Maintenance tracking with status workflow
- **CheckInEvent**: Daily check-in tracking for multi-day bookings

#### Enums
```csharp
// Space Types
Desk, HotDesk, Office, Cubicle, Room, ConferenceRoom,
HuddleRoom, PhoneBooth, TrainingRoom, BreakRoom, ParkingSpot

// Space Availability
Shared, Assigned, Reservable, Restricted

// Space Assignment Types
Permanent, LongTerm, Temporary, Visitor

// Booking Status
Reserved, CheckedIn, Completed, Cancelled, NoShow

// Check-in Status
CheckedIn, CheckedOut, NoShow, AutoCheckout
```

---

## Questions for Clarification

### Business Rules

1. **Booking Conflicts**:
   - For shared spaces (hot desks), can multiple people book the same desk on the same day if times don't overlap?
   - For conference rooms, what's the minimum gap between bookings?

2. **Permanent Assignments**:
   - When a space is permanently assigned, should it still show on the booking calendar as "unavailable" or be hidden entirely?
   - Can permanently assigned spaces be released for booking when the assignee is on PTO/travel?

3. **Approval Workflow**:
   - Who should approve booking requests? Space manager? Office manager? Both?
   - Should there be an auto-approval option based on user role?

4. **Cancellation Policy**:
   - What's the minimum notice for cancellation without penalty?
   - Should no-shows affect future booking privileges?

### Scope Questions

5. **Floor Plans**:
   - Do you want interactive floor plans where users can click on a space to book?
   - Or is a simple list/grid view sufficient for Phase 1?

6. **Parking**:
   - Should parking spots have their own special rules (e.g., one per person per day)?
   - Do you need electric vehicle charger tracking?

7. **Equipment Tracking**:
   - For conference rooms, do you want to track equipment (monitors, whiteboards, video conferencing)?
   - Should equipment be bookable independently (e.g., book a projector)?

8. **Notifications**:
   - What notifications should be sent? (Booking confirmation, reminder, cancellation, etc.)
   - Email only, or also in-app notifications?

### Phase 3 - MS Teams Integration

9. **Teams Rooms**:
   - Is this for reading room availability from Teams, booking through Teams, or both?
   - Do you have MS Teams Rooms already deployed?

10. **Calendar Sync**:
    - Should bookings create Outlook calendar events automatically?
    - Two-way sync (calendar -> booking) or one-way (booking -> calendar)?

---

## Future Features (Backlog)

### Authorization & Access Control
- **Authorization Group Restrictions for Booking Spaces**
  - Allow spaces to be restricted to specific authorization groups
  - Groups could be based on department, role, project, or custom criteria
  - UI for admins to configure which groups can book which spaces
  - Booking validation to enforce group membership

### Media & Visual Enhancements
- **Office/Space Pictures (Azure Blob Storage)**
  - Upload photos of offices and spaces
  - Multiple images per space (gallery view)
  - Azure Blob Storage integration for scalable image hosting
  - Thumbnail generation for list views
  - Floor plan images with clickable hotspots

### Management & Workflows
- **Default Office Manager and Approval Group**
  - Add `DefaultManagerUserId` to Office entity
  - Add `ApprovalGroupId` to Office entity for booking approvals
  - Automatic routing of booking requests to appropriate approvers
  - Configurable approval chains (single approver vs. group consensus)

### Reporting & Communications
- **Booking Reports & Email Notifications**
  - Weekly utilization reports by office/space type
  - Daily booking summary emails for managers
  - Automated reminders for upcoming bookings
  - No-show notifications and tracking
  - Configurable report scheduling (daily/weekly/monthly)
  - Export reports to PDF/Excel

---

## Implementation Phases

### Phase 1 ✅ COMPLETE
1. ✅ Fix FacilitiesPage padding issue
2. ✅ Fix Add Space button functionality
3. ✅ Create basic Space CRUD modal
4. ✅ Create seed data for testing (200 spaces across 8 offices)

### Phase 2 ✅ COMPLETE
1. ✅ Create new backend entities (Floor, Zone, SpaceAssignment, BookingRule)
2. ✅ Add ClosedXML NuGet package for Excel operations
3. ✅ Create bulk import/export endpoints
4. ✅ Build AdminFacilitiesPage with tabbed interface
5. ✅ Implement Excel template downloads
6. ✅ Create AdminOfficeDetailPage and AdminSpaceDetailPage
7. ✅ Enhance BookingModal with self/on-behalf booking and permanent booking support
8. ✅ Add "Booked For" display in booking tables
9. ✅ Restrict edit mode to only allow isPermanent and date changes

### Phase 3 - Enhanced Booking Management (Planned)
1. Transform FacilitiesPage into enterprise booking dashboard
2. Calendar views (day/week/month)
3. Utilization reports and analytics
4. Approval workflows for booking requests
5. Authorization group restrictions for spaces
6. Default office manager and approval group configuration

### Phase 4 - Media & Reporting (Planned)
1. Office/space image upload (Azure Blob Storage)
2. Weekly/daily booking reports
3. Email notifications for bookings
4. Floor plan visualization

### Phase 5 - MS Teams Integration (Planned)
1. MS Teams Rooms integration
2. Outlook calendar sync
3. Room display integration

---

## Bulk Import/Export Specification

### Excel Format Standards
- File format: `.xlsx` (Excel 2007+)
- First row: Column headers (must match exactly)
- Data starts row 2
- Maximum 10,000 rows per import
- Required fields marked with * in headers

### Offices Import Template
| Name* | Address | Address2 | City | StateCode | CountryCode | Timezone | Status | IsClientSite |
|-------|---------|----------|------|-----------|-------------|----------|--------|--------------|
| Example Office | 123 Main St | Suite 100 | Denver | CO | US | America/Denver | Active | false |

### Spaces Import Template
| OfficeName* | Name* | Type* | Capacity | RequiresApproval | IsActive | Equipment | Features | DailyCost | MaxBookingDays |
|-------------|-------|-------|----------|------------------|----------|-----------|----------|-----------|----------------|
| National HQ | HD-001 | HotDesk | 1 | false | true | Monitor,Keyboard | Window | 25.00 | 30 |

### Floors Import Template
| OfficeName* | Name* | Level* | SquareFootage | IsActive |
|-------------|-------|--------|---------------|----------|
| National HQ | 1st Floor | 1 | 15000 | true |

### Zones Import Template
| OfficeName* | FloorName* | Name* | Description | Color | IsActive |
|-------------|------------|-------|-------------|-------|----------|
| National HQ | 1st Floor | East Wing | Engineering area | #4F46E5 | true |

### Space Assignments Import Template
| OfficeName* | SpaceName* | UserEmail* | StartDate* | EndDate | Type* | Notes |
|-------------|------------|------------|------------|---------|-------|-------|
| National HQ | PO-001 | john@example.com | 2025-01-01 | | Permanent | CEO office |

---

## Test Data Summary

### Seeded Offices (8 total)
1. Albuquerque, NM
2. Paducah, KY
3. Colorado Springs, CO
4. Oak Ridge, TN
5. Clear SFS
6. Arlington, VA
7. National Headquarters
8. Anchorage, AK

### Seeded Spaces (200 total - 25 per office)
- Hot Desks: 80 (10 per office)
- Private Offices: 40 (5 per office)
- Conference Rooms: 24 (3 per office)
- Huddle Rooms: 16 (2 per office)
- Phone Booths: 16 (2 per office)
- Training Rooms: 8 (1 per office)
- Break Rooms: 8 (1 per office)
- Parking Spots: 40 (5 per office)

---

## Technical Notes

### DateTime Handling
All DateTime values must be in UTC when stored in PostgreSQL. The API converts incoming DateTime values:
```csharp
var utcDateTime = request.DateTime.Kind == DateTimeKind.Unspecified
    ? DateTime.SpecifyKind(request.DateTime, DateTimeKind.Utc)
    : request.DateTime.ToUniversalTime();
```

### Navigation Properties
Booking entity includes navigation properties for related data:
- `User` - The user the booking is for
- `Space` - The booked space (with nested `Office`)
- `BookedBy` - The user who created the booking

### API Endpoints

#### FacilitiesAdminController
- `GET /api/facilitiesadmin/offices` - List all offices
- `GET /api/facilitiesadmin/offices/{id}` - Get office details
- `GET /api/facilitiesadmin/offices/{id}/spaces` - Get spaces for an office
- `GET /api/facilitiesadmin/spaces/{id}` - Get space details
- `POST /api/facilitiesadmin/spaces` - Create space
- `PUT /api/facilitiesadmin/spaces/{id}` - Update space
- `DELETE /api/facilitiesadmin/spaces/{id}` - Delete space
- `GET /api/facilitiesadmin/export/{entityType}` - Export to Excel
- `POST /api/facilitiesadmin/import/{entityType}` - Import from Excel
- `GET /api/facilitiesadmin/template/{entityType}` - Download template

#### BookingsController
- `GET /api/bookings` - List bookings (with filters)
- `GET /api/bookings/{id}` - Get booking details
- `POST /api/bookings` - Create booking (uses CreateBookingRequest DTO)
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Delete/cancel booking
