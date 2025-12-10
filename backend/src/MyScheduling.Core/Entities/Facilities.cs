namespace MyScheduling.Core.Entities;

// ============================================================================
// LEASE MANAGEMENT
// ============================================================================

/// <summary>
/// Tracks office lease agreements with comprehensive details
/// </summary>
public class Lease : TenantEntity
{
    public Guid OfficeId { get; set; }
    public string LeaseNumber { get; set; } = string.Empty;  // Internal reference number
    public string? ExternalLeaseId { get; set; }  // Landlord's lease ID

    // Landlord/Property Info
    public string LandlordName { get; set; } = string.Empty;
    public string? LandlordContactName { get; set; }
    public string? LandlordEmail { get; set; }
    public string? LandlordPhone { get; set; }
    public string? PropertyManagementCompany { get; set; }
    public string? PropertyManagerName { get; set; }
    public string? PropertyManagerEmail { get; set; }
    public string? PropertyManagerPhone { get; set; }

    // Lease Terms
    public DateOnly LeaseStartDate { get; set; }
    public DateOnly LeaseEndDate { get; set; }
    public int LeaseTerm { get; set; }  // Total months
    public LeaseStatus Status { get; set; } = LeaseStatus.Active;

    // Space Details
    public decimal SquareFootage { get; set; }
    public decimal? UsableSquareFootage { get; set; }  // Actual usable space
    public int? ParkingSpots { get; set; }
    public int? ReservedParkingSpots { get; set; }
    public bool HasLoadingDock { get; set; } = false;
    public int? MaxOccupancy { get; set; }

    // Cost Information
    public decimal BaseRentMonthly { get; set; }
    public decimal? CamChargesMonthly { get; set; }  // Common Area Maintenance
    public decimal? UtilitiesMonthly { get; set; }
    public decimal? TaxesMonthly { get; set; }
    public decimal? InsuranceMonthly { get; set; }
    public decimal? OtherChargesMonthly { get; set; }
    public string? OtherChargesDescription { get; set; }
    public decimal? SecurityDeposit { get; set; }
    public decimal? EscalationPercentage { get; set; }  // Annual rent increase %
    public DateOnly? NextEscalationDate { get; set; }

    // Important Dates
    public DateOnly? RenewalNoticeDeadline { get; set; }  // Date by which renewal intent must be communicated
    public int? RenewalNoticeDays { get; set; }  // Days before lease end to give notice
    public DateOnly? EarlyTerminationDate { get; set; }  // If applicable
    public decimal? EarlyTerminationFee { get; set; }

    // Compliance & Security
    public bool IsAdaCompliant { get; set; } = true;
    public SecurityClearanceLevel? RequiredSecurityLevel { get; set; }
    public bool HasScif { get; set; } = false;  // Sensitive Compartmented Information Facility
    public string? ScifDetails { get; set; }

    // Insurance
    public string? InsuranceProvider { get; set; }
    public string? InsurancePolicyNumber { get; set; }
    public DateOnly? InsuranceExpirationDate { get; set; }
    public decimal? InsuranceCoverageAmount { get; set; }

    // Critical Clauses (searchable text fields)
    public string? CriticalClauses { get; set; }  // JSON array of key clause summaries
    public string? SpecialTerms { get; set; }  // Free text for special conditions
    public string? Notes { get; set; }

    // Custom Attributes (tenant-configurable)
    public string? CustomAttributes { get; set; }  // JSON key-value pairs

    // Navigation
    public virtual Office Office { get; set; } = null!;
    public virtual ICollection<LeaseOptionYear> OptionYears { get; set; } = new List<LeaseOptionYear>();
    public virtual ICollection<LeaseAmendment> Amendments { get; set; } = new List<LeaseAmendment>();
    public virtual ICollection<LeaseAttachment> Attachments { get; set; } = new List<LeaseAttachment>();
}

public enum LeaseStatus
{
    Draft,              // Not yet executed
    Active,             // Current active lease
    Expiring,           // Within renewal notice period
    InRenewal,          // Renewal negotiations in progress
    Terminated,         // Ended early
    Expired,            // Past end date
    Superseded          // Replaced by new lease
}

public enum SecurityClearanceLevel
{
    None,
    PublicTrust,
    Secret,
    TopSecret,
    TopSecretSci        // TS/SCI
}

/// <summary>
/// Option years for lease renewal
/// </summary>
public class LeaseOptionYear : TenantEntity
{
    public Guid LeaseId { get; set; }
    public int OptionNumber { get; set; }  // 1, 2, 3...
    public DateOnly OptionStartDate { get; set; }
    public DateOnly OptionEndDate { get; set; }
    public int TermMonths { get; set; }
    public decimal? ProposedRentMonthly { get; set; }
    public DateOnly ExerciseDeadline { get; set; }  // Must decide by this date
    public OptionYearStatus Status { get; set; } = OptionYearStatus.Available;
    public DateOnly? ExercisedDate { get; set; }
    public Guid? ExercisedByUserId { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public virtual Lease Lease { get; set; } = null!;
    public virtual User? ExercisedBy { get; set; }
}

public enum OptionYearStatus
{
    Available,          // Can still be exercised
    Exercised,          // Option was taken
    Declined,           // Explicitly declined
    Expired,            // Deadline passed without action
    Negotiating         // In discussions with landlord
}

/// <summary>
/// Lease amendments and modifications
/// </summary>
public class LeaseAmendment : TenantEntity
{
    public Guid LeaseId { get; set; }
    public string AmendmentNumber { get; set; } = string.Empty;  // "Amendment 1", "Modification A"
    public DateOnly EffectiveDate { get; set; }
    public DateOnly? ExecutedDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public AmendmentType Type { get; set; }
    public decimal? RentChange { get; set; }  // Monthly rent change (+/-)
    public decimal? SquareFootageChange { get; set; }  // SF change (+/-)
    public DateOnly? NewLeaseEndDate { get; set; }  // If term extended
    public string? Terms { get; set; }  // Summary of amendment terms
    public Guid? ProcessedByUserId { get; set; }

    // Navigation
    public virtual Lease Lease { get; set; } = null!;
    public virtual User? ProcessedBy { get; set; }
    public virtual ICollection<LeaseAttachment> Attachments { get; set; } = new List<LeaseAttachment>();
}

public enum AmendmentType
{
    RentAdjustment,
    SpaceExpansion,
    SpaceReduction,
    TermExtension,
    TermReduction,
    CostAdjustment,
    Other
}

/// <summary>
/// Attachments for leases and amendments (uses IFileStorageService)
/// </summary>
public class LeaseAttachment : TenantEntity
{
    public Guid? LeaseId { get; set; }
    public Guid? AmendmentId { get; set; }
    public Guid? StoredFileId { get; set; }  // Reference to StoredFile for blob storage
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;  // Path in blob storage
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public LeaseAttachmentType Type { get; set; }
    public string? Description { get; set; }
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; }

    // Navigation
    public virtual Lease? Lease { get; set; }
    public virtual LeaseAmendment? Amendment { get; set; }
    public virtual User UploadedBy { get; set; } = null!;
    public virtual StoredFile? StoredFile { get; set; }
}

public enum LeaseAttachmentType
{
    LeaseDocument,
    Amendment,
    FloorPlan,
    InsuranceCertificate,
    Estoppel,
    Correspondence,
    Invoice,
    Photo,
    Other
}

// ============================================================================
// OFFICE TRAVEL GUIDES & INFO
// ============================================================================

/// <summary>
/// Travel and visitor information for an office
/// </summary>
public class OfficeTravelGuide : TenantEntity
{
    public Guid OfficeId { get; set; }

    // Getting There
    public string? NearestAirport { get; set; }
    public string? AirportCode { get; set; }
    public string? AirportDistance { get; set; }  // "15 miles / 25 min drive"
    public string? RecommendedGroundTransport { get; set; }  // "Uber/Lyft recommended, taxi stand outside baggage claim"
    public string? PublicTransitOptions { get; set; }  // Rich text with routes
    public string? DrivingDirections { get; set; }  // Rich text
    public string? ParkingInstructions { get; set; }  // Where to park, validation
    public decimal? ParkingDailyCost { get; set; }

    // Recommended Lodging
    public string? RecommendedHotels { get; set; }  // JSON array of hotels with details
    public string? CorporateHotelCode { get; set; }  // If company has negotiated rate
    public string? NeighborhoodTips { get; set; }  // Areas to stay/avoid

    // Building Access
    public string? BuildingHours { get; set; }  // "Mon-Fri 6am-8pm, Sat 8am-2pm"
    public string? AfterHoursAccess { get; set; }  // How to get in after hours
    public string? VisitorCheckIn { get; set; }  // Lobby procedures
    public string? SecurityRequirements { get; set; }  // ID requirements, escort policy
    public string? BadgeInstructions { get; set; }

    // What to Expect
    public string? DressCode { get; set; }
    public string? CafeteriaInfo { get; set; }
    public string? NearbyRestaurants { get; set; }  // JSON array
    public string? WifiInstructions { get; set; }  // Guest wifi SSID and password
    public string? ConferenceRoomBooking { get; set; }  // How to book rooms
    public string? PrintingInstructions { get; set; }
    public string? Amenities { get; set; }  // Gym, showers, mother's room, etc.

    // Contacts
    public string? ReceptionPhone { get; set; }
    public string? SecurityPhone { get; set; }
    public string? FacilitiesEmail { get; set; }
    public string? EmergencyContact { get; set; }

    // Rich Content
    public string? WelcomeMessage { get; set; }  // Markdown welcome content
    public string? ImportantNotes { get; set; }  // Markdown important notices

    // Media
    public string? PhotoGallery { get; set; }  // JSON array of image URLs
    public string? VideoTourUrl { get; set; }
    public string? VirtualTourUrl { get; set; }  // Matterport or similar

    // Live Status (can be updated frequently)
    public string? CurrentAnnouncements { get; set; }  // JSON array of current notices
    public string? SpecialInstructions { get; set; }  // Temporary instructions
    public DateTime? LastUpdated { get; set; }
    public Guid? LastUpdatedByUserId { get; set; }

    // Custom Attributes
    public string? CustomAttributes { get; set; }  // JSON key-value pairs

    // Navigation
    public virtual Office Office { get; set; } = null!;
    public virtual User? LastUpdatedBy { get; set; }
}

/// <summary>
/// Office-specific points of contact
/// </summary>
public class OfficePoc : TenantEntity
{
    public Guid OfficeId { get; set; }
    public Guid? UserId { get; set; }  // Link to user if internal
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public OfficePocRole Role { get; set; }
    public string? Responsibilities { get; set; }  // What they handle
    public bool IsPrimary { get; set; } = false;  // Primary POC for this role
    public bool IsEmergencyContact { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual Office Office { get; set; } = null!;
    public virtual User? User { get; set; }
}

public enum OfficePocRole
{
    FacilitiesManager,
    OfficeManager,
    SecurityOfficer,
    ItSupport,
    HrRepresentative,
    SafetyOfficer,
    BuildingMaintenance,
    Reception,
    Fso,                // Facility Security Officer
    Issm,               // Information System Security Manager
    Other
}

/// <summary>
/// Announcements for specific offices or all facilities
/// </summary>
public class FacilityAnnouncement : TenantEntity
{
    public Guid? OfficeId { get; set; }  // Null = all offices
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;  // Markdown
    public AnnouncementType Type { get; set; }
    public AnnouncementPriority Priority { get; set; } = AnnouncementPriority.Normal;
    public DateOnly? EffectiveDate { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public bool IsActive { get; set; } = true;
    public bool RequiresAcknowledgment { get; set; } = false;
    public Guid AuthoredByUserId { get; set; }
    public DateTime? PublishedAt { get; set; }

    // Navigation
    public virtual Office? Office { get; set; }
    public virtual User AuthoredBy { get; set; } = null!;
    public virtual ICollection<AnnouncementAcknowledgment> Acknowledgments { get; set; } = new List<AnnouncementAcknowledgment>();
}

public enum AnnouncementType
{
    General,
    Maintenance,
    Emergency,
    Policy,
    Event,
    Holiday,
    SecurityAlert
}

public enum AnnouncementPriority
{
    Low,
    Normal,
    High,
    Urgent
}

/// <summary>
/// Track user acknowledgment of announcements
/// </summary>
public class AnnouncementAcknowledgment : BaseEntity
{
    public Guid AnnouncementId { get; set; }
    public Guid UserId { get; set; }
    public DateTime AcknowledgedAt { get; set; }

    // Navigation
    public virtual FacilityAnnouncement Announcement { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}

// ============================================================================
// FIELD PERSONNEL & CLIENT SITE MANAGEMENT
// ============================================================================

/// <summary>
/// Extended client site information (builds on Office with IsClientSite=true)
/// </summary>
public class ClientSiteDetail : TenantEntity
{
    public Guid OfficeId { get; set; }  // Links to Office with IsClientSite=true

    // Client Information
    public string ClientName { get; set; } = string.Empty;
    public string? ContractNumber { get; set; }
    public string? TaskOrderNumber { get; set; }
    public string? ClientPocName { get; set; }
    public string? ClientPocEmail { get; set; }
    public string? ClientPocPhone { get; set; }

    // Security
    public SecurityClearanceLevel RequiredClearance { get; set; } = SecurityClearanceLevel.None;
    public bool RequiresBadge { get; set; } = false;
    public string? BadgeType { get; set; }  // "CAC", "PIV", "Site Badge"
    public string? BadgeInstructions { get; set; }
    public bool HasScif { get; set; } = false;
    public string? ScifAccessInstructions { get; set; }
    public string? SecurityPocName { get; set; }
    public string? SecurityPocEmail { get; set; }
    public string? SecurityPocPhone { get; set; }

    // Access & Hours
    public string? SiteHours { get; set; }
    public string? AccessInstructions { get; set; }
    public string? CheckInProcedure { get; set; }
    public string? EscortRequirements { get; set; }

    // IT & Communications
    public string? NetworkAccess { get; set; }  // VPN, client network, etc.
    public string? ItSupportContact { get; set; }
    public string? ApprovedDevices { get; set; }  // What devices can be brought

    // FSO Link
    public Guid? AssignedFsoUserId { get; set; }  // Internal FSO responsible for this site

    // Custom Attributes
    public string? CustomAttributes { get; set; }

    // Navigation
    public virtual Office Office { get; set; } = null!;
    public virtual User? AssignedFso { get; set; }
}

/// <summary>
/// Field employee assignments to client sites
/// </summary>
public class FieldAssignment : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid ClientSiteOfficeId { get; set; }  // Office with IsClientSite=true
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }  // Null = ongoing
    public FieldAssignmentStatus Status { get; set; } = FieldAssignmentStatus.Active;

    // Assignment Details
    public string? ProjectName { get; set; }
    public string? TaskDescription { get; set; }
    public string? ContractNumber { get; set; }
    public decimal? BillRate { get; set; }  // Hourly rate if applicable
    public int? ExpectedHoursPerWeek { get; set; }

    // Security
    public bool ClearanceVerified { get; set; } = false;
    public DateOnly? ClearanceVerifiedDate { get; set; }
    public Guid? ClearanceVerifiedByUserId { get; set; }
    public bool BadgeIssued { get; set; } = false;
    public string? BadgeNumber { get; set; }
    public DateOnly? BadgeExpirationDate { get; set; }
    public bool SecurityBriefingCompleted { get; set; } = false;
    public DateOnly? SecurityBriefingDate { get; set; }

    // Approvals
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }

    public string? Notes { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual Office ClientSiteOffice { get; set; } = null!;
    public virtual User? ApprovedBy { get; set; }
    public virtual User? ClearanceVerifiedBy { get; set; }
}

public enum FieldAssignmentStatus
{
    Pending,            // Awaiting approval/processing
    Active,             // Currently assigned
    OnHold,             // Temporarily paused
    Completed,          // Assignment ended normally
    Terminated,         // Ended early
    Cancelled           // Never started
}

/// <summary>
/// Security clearance tracking for employees
/// </summary>
public class EmployeeClearance : TenantEntity
{
    public Guid UserId { get; set; }
    public SecurityClearanceLevel Level { get; set; }
    public ClearanceStatus Status { get; set; } = ClearanceStatus.Active;

    // Investigation Details
    public string? InvestigationType { get; set; }  // "SSBI", "NACLC", "T5", etc.
    public DateOnly? InvestigationDate { get; set; }
    public DateOnly? GrantedDate { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public DateOnly? ReinvestigationDate { get; set; }  // When reinvestigation is due

    // Polygraph (if applicable)
    public bool HasPolygraph { get; set; } = false;
    public string? PolygraphType { get; set; }  // "CI", "FSP", "Lifestyle"
    public DateOnly? PolygraphDate { get; set; }
    public DateOnly? PolygraphExpirationDate { get; set; }

    // SCI Access
    public bool HasSciAccess { get; set; } = false;
    public string? SciCompartments { get; set; }  // JSON array of compartments
    public DateOnly? SciAccessDate { get; set; }

    // Sponsoring Agency
    public string? SponsoringAgency { get; set; }
    public string? ContractorCode { get; set; }

    // FSO Notes
    public Guid? VerifiedByUserId { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual User? VerifiedBy { get; set; }
}

public enum ClearanceStatus
{
    Active,
    Suspended,
    Revoked,
    Expired,
    InProcess,          // Application submitted
    Pending,            // Waiting for action
    Interim             // Interim clearance granted
}

/// <summary>
/// Foreign travel tracking for cleared personnel
/// </summary>
public class ForeignTravelRecord : TenantEntity
{
    public Guid UserId { get; set; }

    // Trip Details
    public string DestinationCountry { get; set; } = string.Empty;
    public string? DestinationCity { get; set; }
    public DateOnly DepartureDate { get; set; }
    public DateOnly ReturnDate { get; set; }
    public TravelPurpose Purpose { get; set; }
    public string? PurposeDescription { get; set; }

    // Pre-Travel
    public ForeignTravelStatus Status { get; set; } = ForeignTravelStatus.Pending;
    public bool BriefingCompleted { get; set; } = false;
    public DateOnly? BriefingDate { get; set; }
    public Guid? BriefedByUserId { get; set; }

    // Approval
    public bool FsoApproved { get; set; } = false;
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }

    // Post-Travel
    public bool DebriefingCompleted { get; set; } = false;
    public DateOnly? DebriefingDate { get; set; }
    public Guid? DebriefedByUserId { get; set; }
    public string? DebriefingNotes { get; set; }

    // Contacts
    public bool ForeignContactsReported { get; set; } = false;
    public string? ForeignContacts { get; set; }  // JSON array if any

    public string? Notes { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual User? BriefedBy { get; set; }
    public virtual User? ApprovedBy { get; set; }
    public virtual User? DebriefedBy { get; set; }
}

public enum TravelPurpose
{
    Personal,
    Business,
    Conference,
    Training,
    Family,
    Medical,
    Military,
    Other
}

public enum ForeignTravelStatus
{
    Pending,            // Not yet approved
    Approved,           // FSO approved
    Denied,             // FSO denied
    Completed,          // Trip completed and debriefed
    Cancelled           // Trip cancelled
}

/// <summary>
/// SCIF access log entries
/// </summary>
public class ScifAccessLog : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid OfficeId { get; set; }  // Office with SCIF
    public DateTime AccessTime { get; set; }
    public DateTime? ExitTime { get; set; }
    public ScifAccessType AccessType { get; set; }
    public string? Purpose { get; set; }
    public bool EscortRequired { get; set; } = false;
    public Guid? EscortUserId { get; set; }
    public string? BadgeNumber { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual Office Office { get; set; } = null!;
    public virtual User? Escort { get; set; }
}

public enum ScifAccessType
{
    Regular,            // Normal access
    Escorted,           // Visitor with escort
    Maintenance,        // Maintenance personnel
    Inspection,         // Security inspection
    Emergency           // Emergency access
}

// ============================================================================
// CHECK-IN & PRESENCE
// ============================================================================

/// <summary>
/// General facility check-in (not tied to bookings)
/// </summary>
public class FacilityCheckIn : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid OfficeId { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public CheckInMethod Method { get; set; }
    public string? BadgeId { get; set; }  // If checked in via badge
    public string? QrCode { get; set; }  // If checked in via QR
    public Guid? SpaceId { get; set; }  // Optional: specific space if known
    public string? Notes { get; set; }
    public string? DeviceInfo { get; set; }  // Device used for check-in
    public double? Latitude { get; set; }  // GPS if mobile
    public double? Longitude { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual Office Office { get; set; } = null!;
    public virtual Space? Space { get; set; }
}

public enum CheckInMethod
{
    Web,
    Mobile,
    Kiosk,
    QrCode,
    NfcTap,
    BadgeSwipe,
    Manual            // Manually entered by admin
}

// ============================================================================
// CONFIGURABLE ATTRIBUTES
// ============================================================================

/// <summary>
/// Custom attribute definitions per tenant
/// </summary>
public class FacilityAttributeDefinition : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public FacilityAttributeType AttributeType { get; set; }
    public FacilityAttributeEntityType EntityType { get; set; }  // What entity this applies to
    public string? Description { get; set; }
    public bool IsRequired { get; set; } = false;
    public bool IsSearchable { get; set; } = true;
    public string? DefaultValue { get; set; }
    public string? ValidationRule { get; set; }  // Regex or JSON schema
    public string? Options { get; set; }  // JSON array for dropdown/multiselect
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public enum FacilityAttributeType
{
    Text,
    Number,
    Decimal,
    Boolean,
    Date,
    DateTime,
    Dropdown,
    MultiSelect,
    Url,
    Email,
    Phone,
    TextArea
}

public enum FacilityAttributeEntityType
{
    Office,
    Lease,
    Space,
    Floor,
    Zone,
    ClientSite
}

// ============================================================================
// USAGE ANALYTICS (for tracking and reporting)
// ============================================================================

/// <summary>
/// Daily aggregated usage statistics per office
/// </summary>
public class FacilityUsageDaily : TenantEntity
{
    public Guid OfficeId { get; set; }
    public DateOnly Date { get; set; }

    // Booking Stats
    public int TotalBookings { get; set; }
    public int CheckedInCount { get; set; }
    public int NoShowCount { get; set; }
    public int CancelledCount { get; set; }

    // Space Utilization
    public int TotalSpaces { get; set; }
    public int BookedSpaces { get; set; }
    public decimal UtilizationRate { get; set; }  // Percentage

    // Check-in Stats
    public int TotalCheckIns { get; set; }
    public int UniqueVisitors { get; set; }
    public decimal AverageStayHours { get; set; }

    // Peak Usage
    public int PeakOccupancy { get; set; }
    public TimeOnly? PeakTime { get; set; }

    // By Space Type
    public string? UtilizationBySpaceType { get; set; }  // JSON breakdown

    // Navigation
    public virtual Office Office { get; set; } = null!;
}
