namespace MyScheduling.Core.Entities;

public class Office : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Address2 { get; set; }  // Suite, Floor, Building, etc.
    public string? City { get; set; }
    public string? StateCode { get; set; }  // Two-letter state code (e.g., "VA", "CO")
    public string? CountryCode { get; set; } = "US";  // Two-letter country code (e.g., "US", "CA")
    public string? Timezone { get; set; }
    public OfficeStatus Status { get; set; }
    public bool IsClientSite { get; set; } = false;  // Indicates if this is a client site location
    public string? IconUrl { get; set; }  // Custom icon URL (optional)
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Navigation properties
    public virtual ICollection<Space> Spaces { get; set; } = new List<Space>();
}

public enum OfficeStatus
{
    Active,
    Inactive
}

public class Space : TenantEntity
{
    public Guid OfficeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public SpaceType Type { get; set; }
    public int Capacity { get; set; }
    public string? Metadata { get; set; } // JSON for floor, zone, equipment, etc.

    // Enhanced facilities management fields
    public Guid? ManagerUserId { get; set; }  // Space manager/owner
    public bool RequiresApproval { get; set; } = false;  // Does booking require approval?
    public bool IsActive { get; set; } = true;  // Active/inactive status
    public string? Equipment { get; set; }  // JSON array of equipment
    public string? Features { get; set; }  // JSON array of features
    public decimal? DailyCost { get; set; }  // Cost for financial tracking
    public int? MaxBookingDays { get; set; }  // Maximum booking duration
    public string? BookingRules { get; set; }  // JSON rules for booking restrictions

    // Navigation properties
    public virtual Office Office { get; set; } = null!;
    public virtual User? Manager { get; set; }
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<SpaceMaintenanceLog> MaintenanceLogs { get; set; } = new List<SpaceMaintenanceLog>();
    public virtual ICollection<FacilityPermission> Permissions { get; set; } = new List<FacilityPermission>();
}

public enum SpaceType
{
    Desk,
    HotDesk,            // Shared/unassigned desk
    Office,
    Cubicle,
    Room,
    ConferenceRoom,
    HuddleRoom,
    PhoneBooth,
    TrainingRoom,
    BreakRoom,
    ParkingSpot
}

public class Booking : TenantEntity
{
    public Guid SpaceId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartDatetime { get; set; }
    public DateTime EndDatetime { get; set; }
    public BookingStatus Status { get; set; }

    // Navigation properties
    public virtual Space Space { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual ICollection<CheckInEvent> CheckInEvents { get; set; } = new List<CheckInEvent>();
}

public enum BookingStatus
{
    Reserved,
    CheckedIn,
    Completed,
    Cancelled,
    NoShow
}

public class CheckInEvent : BaseEntity
{
    public Guid BookingId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Method { get; set; } = string.Empty; // web, kiosk, mobile
    public Guid? ProcessedByUserId { get; set; }

    // Navigation properties
    public virtual Booking Booking { get; set; } = null!;
}

// Facility Permissions for role-based access control
public class FacilityPermission : BaseEntity
{
    public Guid? OfficeId { get; set; }  // Null = all offices
    public Guid? SpaceId { get; set; }  // Null = office level
    public Guid? UserId { get; set; }  // Null = role-based
    public AppRole? Role { get; set; }  // Null = user-specific
    public FacilityAccessLevel AccessLevel { get; set; }

    // Navigation properties
    public virtual Office? Office { get; set; }
    public virtual Space? Space { get; set; }
    public virtual User? User { get; set; }
}

public enum FacilityAccessLevel
{
    View,               // Can view only
    Book,               // Can book spaces
    Manage,             // Can manage bookings
    Configure,          // Can configure spaces
    FullAdmin           // Full administrative access
}

// Space Maintenance Tracking
public class SpaceMaintenanceLog : BaseEntity
{
    public Guid SpaceId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public MaintenanceType Type { get; set; }
    public MaintenanceStatus Status { get; set; }
    public Guid ReportedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public decimal? Cost { get; set; }

    // Navigation properties
    public virtual Space Space { get; set; } = null!;
    public virtual User ReportedBy { get; set; } = null!;
    public virtual User? AssignedTo { get; set; }
}

public enum MaintenanceType
{
    Routine,
    Repair,
    Inspection,
    Cleaning,
    EquipmentIssue,
    SafetyConcern
}

public enum MaintenanceStatus
{
    Reported,
    Scheduled,
    InProgress,
    Completed,
    Cancelled
}

// Work Location Preferences for tracking where people work each day
public class WorkLocationPreference : TenantEntity
{
    public Guid UserId { get; set; }
    public DateOnly WorkDate { get; set; }
    public WorkLocationType LocationType { get; set; }

    // Optional fields based on location type
    public Guid? OfficeId { get; set; }  // Used for OfficeNoReservation and ClientSite
    public Guid? BookingId { get; set; }  // Used for OfficeWithReservation

    // Remote Plus location details
    public string? RemoteLocation { get; set; }  // Free text description (e.g., "Home", "Coffee shop")
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }

    public string? Notes { get; set; }  // Optional notes about the day

    // DOA relationship
    public Guid? DOAActivationId { get; set; }  // Link to active delegation of authority

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual User User { get; set; } = null!;
    public virtual Office? Office { get; set; }  // Include in serialization for display purposes
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Booking? Booking { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual DOAActivation? DOAActivation { get; set; }
}

public enum WorkLocationType
{
    Remote,                  // Simple remote work
    RemotePlus,             // Remote with location details
    ClientSite,             // Working at a client location
    OfficeNoReservation,    // In office but no specific desk/room booked
    OfficeWithReservation,  // In office with a specific booking
    PTO,                    // Paid Time Off
    Travel                  // Travel day (in transit)
}

// Company Holidays for tracking federal/company-wide holidays
public class CompanyHoliday : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public DateOnly HolidayDate { get; set; }
    public HolidayType Type { get; set; }
    public bool IsRecurring { get; set; } = false;  // Does this recur annually?
    public string? Description { get; set; }
    public bool IsObserved { get; set; } = true;  // Is the company observing this holiday?
}

public enum HolidayType
{
    Federal,            // US Federal holidays
    Company,            // Company-specific holidays
    Religious,          // Religious observances
    Cultural,           // Cultural observances
    Regional            // State or regional holidays
}
