namespace MyScheduling.Core.Entities;

// ==================== SALES OPERATIONS ENUMS ====================

/// <summary>
/// Type of opportunity
/// </summary>
public enum OpportunityType
{
    NewBusiness = 0,
    Recompete = 1,
    TaskOrder = 2,
    Modification = 3,
    Option = 4
}

/// <summary>
/// Growth type classification
/// </summary>
public enum GrowthType
{
    NewBusiness = 0,
    Expansion = 1,
    Renewal = 2
}

/// <summary>
/// Federal acquisition type / set-aside
/// </summary>
public enum AcquisitionType
{
    FullAndOpen = 0,
    SmallBusiness = 1,
    EightASetAside = 2,
    SDVOSB = 3,
    WOSB = 4,
    HUBZone = 5,
    EightADirectAward = 6,
    SoleSource = 7,
    Other = 99
}

/// <summary>
/// Contract type
/// </summary>
public enum SalesContractType
{
    FirmFixedPrice = 0,
    TimeAndMaterials = 1,
    CostPlus = 2,
    CostPlusFixedFee = 3,
    CostPlusIncentiveFee = 4,
    CostPlusAwardFee = 5,
    IDIQ = 6,
    BPA = 7,
    Hybrid = 8,
    Other = 99
}

/// <summary>
/// Opportunity result/outcome
/// </summary>
public enum OpportunityResult
{
    Won = 0,
    Lost = 1,
    NoBid = 2,
    Cancelled = 3,
    Withdrawn = 4
}

/// <summary>
/// RFI/Sources Sought status
/// </summary>
public enum RfiStatus
{
    NotApplicable = 0,
    Pending = 1,
    Submitted = 2,
    Responded = 3
}

/// <summary>
/// Bid decision status
/// </summary>
public enum BidDecision
{
    Pending = 0,
    Bid = 1,
    NoBid = 2,
    ConditionalBid = 3
}

/// <summary>
/// Role of bidding entity in an opportunity
/// </summary>
public enum BiddingEntityRole
{
    Prime = 0,
    Subcontractor = 1
}

/// <summary>
/// Custom field data types
/// </summary>
public enum SalesCustomFieldType
{
    Text = 0,
    TextArea = 1,
    Number = 2,
    Currency = 3,
    Percent = 4,
    Date = 5,
    DateTime = 6,
    Checkbox = 7,
    Picklist = 8,
    MultiPicklist = 9,
    Lookup = 10,
    Url = 11,
    Email = 12,
    Phone = 13
}

// ==================== PICKLIST DEFINITION ====================

/// <summary>
/// Admin-configurable picklist definitions for sales entities (tenant-specific dropdowns)
/// </summary>
public class SalesPicklistDefinition : TenantEntity
{
    /// <summary>
    /// Unique key name for the picklist (e.g., "AcquisitionType", "ContractType", "Portfolio")
    /// </summary>
    public string PicklistName { get; set; } = string.Empty;

    /// <summary>
    /// Display label shown in admin UI
    /// </summary>
    public string DisplayLabel { get; set; } = string.Empty;

    /// <summary>
    /// Description of the picklist purpose
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// System picklists cannot be deleted (only values can be managed)
    /// </summary>
    public bool IsSystemPicklist { get; set; }

    /// <summary>
    /// Allow multiple values to be selected
    /// </summary>
    public bool AllowMultiple { get; set; }

    /// <summary>
    /// Entity type this picklist applies to (e.g., "Opportunity", "Account")
    /// </summary>
    public string? EntityType { get; set; }

    /// <summary>
    /// Field name on the entity this picklist maps to (e.g., "AcquisitionType")
    /// </summary>
    public string? FieldName { get; set; }

    /// <summary>
    /// Active status
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Sort order for displaying picklists
    /// </summary>
    public int SortOrder { get; set; }

    // Navigation
    public virtual ICollection<SalesPicklistValue> Values { get; set; } = new List<SalesPicklistValue>();
}

// ==================== PICKLIST VALUE ====================

/// <summary>
/// Individual values within a picklist
/// </summary>
public class SalesPicklistValue : TenantEntity
{
    public Guid PicklistDefinitionId { get; set; }

    /// <summary>
    /// The value stored in the database
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// The display label shown to users
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Display order within the picklist
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Whether this is the default selected value for new records
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// Inactive values are hidden but preserved for historical records
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional hex color for badges/pills (e.g., "#FF5733")
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Optional description/help text for this value
    /// </summary>
    public string? Description { get; set; }

    // Navigation
    public virtual SalesPicklistDefinition PicklistDefinition { get; set; } = null!;
}

// ==================== SALES STAGE ====================

/// <summary>
/// Admin-configurable sales pipeline stages
/// </summary>
public class SalesStage : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public int DefaultProbability { get; set; }  // e.g., Qualified = 25%
    public string? Color { get; set; }  // Hex color for kanban board
    public bool IsActive { get; set; } = true;
    public bool IsWonStage { get; set; }
    public bool IsLostStage { get; set; }
    public bool IsClosedStage { get; set; }

    // Navigation
    public virtual ICollection<SalesOpportunity> Opportunities { get; set; } = new List<SalesOpportunity>();
}

// ==================== LOSS REASON ====================

/// <summary>
/// Admin-configurable reasons for losing opportunities
/// </summary>
public class LossReason : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    // Navigation
    public virtual ICollection<SalesOpportunity> Opportunities { get; set; } = new List<SalesOpportunity>();
}

// ==================== SALES ACCOUNT ====================

/// <summary>
/// Government agency or customer account
/// </summary>
public class SalesAccount : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Acronym { get; set; }
    public string? Description { get; set; }

    // Hierarchy (for agency structure)
    public Guid? ParentAccountId { get; set; }

    // Classification
    public string? AccountType { get; set; }  // Federal, State, Local, Commercial
    public string? FederalDepartment { get; set; }  // DoD, DHS, HHS, etc.
    public string? Portfolio { get; set; }  // Defense, Civilian, etc.

    // Location
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    // Contact Info
    public string? Phone { get; set; }
    public string? Website { get; set; }

    // Status
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation
    public virtual SalesAccount? ParentAccount { get; set; }
    public virtual ICollection<SalesAccount> ChildAccounts { get; set; } = new List<SalesAccount>();
    public virtual ICollection<SalesContact> Contacts { get; set; } = new List<SalesContact>();
    public virtual ICollection<SalesOpportunity> Opportunities { get; set; } = new List<SalesOpportunity>();
}

// ==================== SALES CONTACT ====================

/// <summary>
/// Contact person at an account
/// </summary>
public class SalesContact : TenantEntity
{
    public Guid? AccountId { get; set; }

    // Identity
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Department { get; set; }

    // Contact Info
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public string? LinkedInUrl { get; set; }

    // Address (if different from account)
    public string? MailingAddress { get; set; }
    public string? MailingCity { get; set; }
    public string? MailingState { get; set; }
    public string? MailingPostalCode { get; set; }

    // Status
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation
    public virtual SalesAccount? Account { get; set; }
    public virtual ICollection<OpportunityContactRole> OpportunityRoles { get; set; } = new List<OpportunityContactRole>();

    // Computed
    public string FullName => $"{FirstName} {LastName}".Trim();
}

// ==================== BIDDING ENTITY ====================

/// <summary>
/// Legal entity used for bidding (LLCs, subsidiaries) - includes 8(a) tracking
/// </summary>
public class BiddingEntity : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? ShortName { get; set; }

    // Business Identifiers
    public string? DunsNumber { get; set; }
    public string? CageCode { get; set; }
    public string? UeiNumber { get; set; }  // Unique Entity ID (replaced DUNS)
    public string? TaxId { get; set; }

    // SBA 8(a) Program Tracking
    public bool Is8a { get; set; }
    public DateTime? SbaEntryDate { get; set; }
    public DateTime? SbaExpirationDate { get; set; }
    public DateTime? SbaGraduationDate { get; set; }

    // Other Certifications
    public bool IsSmallBusiness { get; set; }
    public bool IsSDVOSB { get; set; }  // Service-Disabled Veteran-Owned
    public bool IsVOSB { get; set; }    // Veteran-Owned
    public bool IsWOSB { get; set; }    // Women-Owned
    public bool IsEDWOSB { get; set; }  // Economically Disadvantaged WOSB
    public bool IsHUBZone { get; set; }
    public bool IsSDB { get; set; }     // Small Disadvantaged Business

    // Address
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    // Status
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation
    public virtual ICollection<SalesOpportunity> Opportunities { get; set; } = new List<SalesOpportunity>();

    // Computed Properties
    public bool IsSbaActive => Is8a && SbaExpirationDate.HasValue && SbaExpirationDate > DateTime.UtcNow;
    public int? DaysUntilSbaExpiration => SbaExpirationDate.HasValue
        ? (int)(SbaExpirationDate.Value - DateTime.UtcNow).TotalDays : null;
}

// ==================== CONTRACT VEHICLE ====================

/// <summary>
/// GWAC, IDIQ, BPA, or other contract vehicle
/// </summary>
public class ContractVehicle : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContractNumber { get; set; }
    public string? Description { get; set; }

    // Vehicle Type
    public string? VehicleType { get; set; }  // GWAC, IDIQ, BPA, GSA Schedule, etc.
    public string? IssuingAgency { get; set; }

    // Dates
    public DateTime? AwardDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ExpirationDate { get; set; }

    // Financial
    public decimal? CeilingValue { get; set; }
    public decimal? AwardedValue { get; set; }
    public decimal? RemainingValue { get; set; }

    // Eligibility
    public bool IsActive { get; set; } = true;
    public string? EligibilityNotes { get; set; }

    // Associated Bidding Entity
    public Guid? BiddingEntityId { get; set; }

    // Navigation
    public virtual BiddingEntity? BiddingEntity { get; set; }
    public virtual ICollection<SalesOpportunity> Opportunities { get; set; } = new List<SalesOpportunity>();
}

// ==================== SALES OPPORTUNITY ====================

/// <summary>
/// Main sales opportunity entity - US Federal Government contracting
/// </summary>
public class SalesOpportunity : TenantEntity
{
    // ===== Identity =====
    public string OpportunityNumber { get; set; } = string.Empty;  // Auto: "OPP-000001"
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // ===== Relationships =====
    public Guid? AccountId { get; set; }
    public Guid? BiddingEntityId { get; set; }
    public Guid? ContractVehicleId { get; set; }
    public Guid? PrimaryContactId { get; set; }
    public Guid OwnerId { get; set; }  // Opportunity Owner (BD/Capture Manager)

    // ===== Classification =====
    public Guid StageId { get; set; }
    public OpportunityType Type { get; set; }
    public GrowthType GrowthType { get; set; }
    public string? AcquisitionType { get; set; }  // Dynamic picklist value
    public string? ContractType { get; set; }     // Dynamic picklist value
    public string? OpportunityStatus { get; set; } // Dynamic picklist value
    public string? Portfolio { get; set; }         // Dynamic picklist value
    public BidDecision BidDecision { get; set; } = BidDecision.Pending;

    // ===== Business Line =====
    public string? PrimaryBusinessLine { get; set; }
    public string? Capability { get; set; }
    public string? CapabilityBusinessLine { get; set; }

    // ===== Financials =====
    public decimal Amount { get; set; }  // Annual/First Year Value
    public decimal TotalContractValue { get; set; }  // Full contract value
    public int ProbabilityPercent { get; set; }
    public int? ProbabilityGoPercent { get; set; }  // Probability-Go (internal confidence)
    public decimal? TargetGrossMarginPercent { get; set; }
    public decimal? TargetGrossMarginAmount { get; set; }
    public decimal? TargetOperatingIncomePercent { get; set; }
    public decimal? TargetOperatingIncomeAmount { get; set; }
    public bool IncludedInForecast { get; set; }
    public string? RevenueStream { get; set; }

    // ===== Key Dates =====
    public DateTime CloseDate { get; set; }
    public string? CloseFiscalYear { get; set; }
    public string? CloseFiscalQuarter { get; set; }

    // RFI / Sources Sought
    public RfiStatus RfiStatus { get; set; } = RfiStatus.NotApplicable;
    public DateTime? PlannedRfiSubmissionDate { get; set; }
    public DateTime? ActualRfiSubmissionDate { get; set; }

    // RFP
    public DateTime? PlannedRfpReleaseDate { get; set; }
    public DateTime? ActualRfpReleaseDate { get; set; }

    // Proposal
    public DateTime? PlannedProposalSubmissionDate { get; set; }
    public DateTime? ActualProposalSubmissionDate { get; set; }

    // Project/Contract Dates
    public DateTime? ProjectStartDate { get; set; }  // NTP / Start Date
    public DateTime? ProjectFinishDate { get; set; }
    public int? DurationMonths { get; set; }
    public string? OpportunityTerms { get; set; }

    // ===== Contract Details =====
    public string? SolicitationNumber { get; set; }
    public string? PrimaryNaicsCode { get; set; }
    public string? CostpointProjectCode { get; set; }
    public string? IncumbentContractNumber { get; set; }
    public string? Incumbent { get; set; }
    public DateTime? IncumbentAwardDate { get; set; }
    public DateTime? IncumbentExpireDate { get; set; }
    public bool IsDirectAward { get; set; }
    public bool IsFrontDoor { get; set; }
    public string? ProposalId { get; set; }
    public Guid? MasterContractId { get; set; }
    public string? MasterContractTitle { get; set; }
    public string? PlaceOfPerformance { get; set; }

    // ===== Priority & Strategy =====
    public string? Priority { get; set; }  // Standard, High, Critical
    public string? NextStep { get; set; }
    public string? SolutionDetails { get; set; }

    // ===== Win/Loss =====
    public OpportunityResult? Result { get; set; }
    public Guid? LossReasonId { get; set; }
    public string? CustomerFeedback { get; set; }
    public decimal? WinningPriceTcv { get; set; }
    public string? WinningCompetitor { get; set; }

    // ===== Lead Source =====
    public string? LeadSource { get; set; }  // GovWin, SAM.gov, Referral, etc.
    public string? GovWinId { get; set; }
    public string? OpportunityLink { get; set; }
    public string? BAndPCode { get; set; }
    public string? ResponseFolder { get; set; }

    // ===== Navigation =====
    public virtual SalesAccount? Account { get; set; }
    public virtual BiddingEntity? BiddingEntity { get; set; }
    public virtual ContractVehicle? ContractVehicle { get; set; }
    public virtual SalesContact? PrimaryContact { get; set; }
    public virtual SalesStage Stage { get; set; } = null!;
    public virtual User Owner { get; set; } = null!;
    public virtual LossReason? LossReason { get; set; }
    public virtual ICollection<OpportunityTeamMember> TeamMembers { get; set; } = new List<OpportunityTeamMember>();
    public virtual ICollection<OpportunityContactRole> ContactRoles { get; set; } = new List<OpportunityContactRole>();
    public virtual ICollection<OpportunityCapability> Capabilities { get; set; } = new List<OpportunityCapability>();
    public virtual ICollection<OpportunityNote> Notes { get; set; } = new List<OpportunityNote>();
    public virtual ICollection<OpportunityFieldHistory> FieldHistory { get; set; } = new List<OpportunityFieldHistory>();

    // ===== Computed Properties =====
    public decimal WeightedAmount => Amount * ProbabilityPercent / 100m;
    public decimal WeightedTcv => TotalContractValue * ProbabilityPercent / 100m;
}

// ==================== OPPORTUNITY TEAM MEMBER ====================

/// <summary>
/// Internal team members assigned to an opportunity
/// </summary>
public class OpportunityTeamMember : TenantEntity
{
    public Guid OpportunityId { get; set; }
    public Guid UserId { get; set; }

    public string? Role { get; set; }  // Capture Manager, Proposal Manager, Solution Architect, etc.
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public virtual SalesOpportunity Opportunity { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}

// ==================== OPPORTUNITY CONTACT ROLE ====================

/// <summary>
/// Customer contacts associated with an opportunity
/// </summary>
public class OpportunityContactRole : TenantEntity
{
    public Guid OpportunityId { get; set; }
    public Guid ContactId { get; set; }

    public string? Role { get; set; }  // Decision Maker, Technical POC, Contracting Officer, etc.
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public virtual SalesOpportunity Opportunity { get; set; } = null!;
    public virtual SalesContact Contact { get; set; } = null!;
}

// ==================== OPPORTUNITY CAPABILITY ====================

/// <summary>
/// Capabilities/services being proposed for an opportunity
/// </summary>
public class OpportunityCapability : TenantEntity
{
    public Guid OpportunityId { get; set; }

    public string? CapabilityBusinessLine { get; set; }
    public string? Capability { get; set; }
    public string? ParentCapability { get; set; }
    public decimal? Percentage { get; set; }  // % of contract value
    public decimal? AllocatedAmount { get; set; }
    public decimal? WeightedAmount { get; set; }

    // Navigation
    public virtual SalesOpportunity Opportunity { get; set; } = null!;
}

// ==================== OPPORTUNITY NOTE ====================

/// <summary>
/// Notes and activity log for an opportunity
/// </summary>
public class OpportunityNote : TenantEntity
{
    public Guid OpportunityId { get; set; }

    public string Content { get; set; } = string.Empty;
    public string? NoteType { get; set; }  // General, Call, Email, Meeting, etc.

    // Navigation
    public virtual SalesOpportunity Opportunity { get; set; } = null!;
}

// ==================== OPPORTUNITY FIELD HISTORY ====================

/// <summary>
/// Audit trail for field changes on opportunities
/// </summary>
public class OpportunityFieldHistory : BaseEntity
{
    public Guid OpportunityId { get; set; }

    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime ChangedAt { get; set; }
    public Guid ChangedByUserId { get; set; }

    // Navigation
    public virtual SalesOpportunity Opportunity { get; set; } = null!;
    public virtual User ChangedByUser { get; set; } = null!;
}

// ==================== CUSTOM FIELD DEFINITION ====================

/// <summary>
/// Admin-configurable custom fields for sales entities
/// </summary>
public class SalesCustomFieldDefinition : TenantEntity
{
    public string EntityType { get; set; } = string.Empty;  // "Opportunity", "Account", "Contact"
    public string FieldName { get; set; } = string.Empty;   // API name (no spaces)
    public string DisplayLabel { get; set; } = string.Empty;
    public SalesCustomFieldType FieldType { get; set; }
    public string? PicklistOptions { get; set; }  // JSON: ["Red", "Yellow", "Green"]
    public string? DefaultValue { get; set; }
    public bool IsRequired { get; set; }
    public bool IsSearchable { get; set; }
    public bool IsVisibleInList { get; set; }
    public string? Section { get; set; }  // For form layout grouping
    public string? HelpText { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Lookup configuration (for Lookup field type)
    public string? LookupEntityType { get; set; }

    // Navigation
    public virtual ICollection<SalesCustomFieldValue> Values { get; set; } = new List<SalesCustomFieldValue>();
}

// ==================== CUSTOM FIELD VALUE ====================

/// <summary>
/// Stores custom field values for sales entities
/// </summary>
public class SalesCustomFieldValue : TenantEntity
{
    public Guid FieldDefinitionId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }

    // Typed storage (only one populated based on FieldType)
    public string? TextValue { get; set; }
    public decimal? NumberValue { get; set; }
    public DateTime? DateValue { get; set; }
    public bool? BoolValue { get; set; }
    public string? PicklistValue { get; set; }  // JSON for multi-select
    public Guid? LookupValue { get; set; }

    // Navigation
    public virtual SalesCustomFieldDefinition FieldDefinition { get; set; } = null!;
}

// ==================== SALES FORECAST GROUP ====================

/// <summary>
/// Grouping for sales forecasts (Division, Market, Region, etc.)
/// </summary>
public class SalesForecastGroup : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? GroupType { get; set; }  // Division, Market, Region, etc.
    public Guid? ParentGroupId { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    // Navigation
    public virtual SalesForecastGroup? ParentGroup { get; set; }
    public virtual ICollection<SalesForecastGroup> ChildGroups { get; set; } = new List<SalesForecastGroup>();
    public virtual ICollection<SalesForecastTarget> Targets { get; set; } = new List<SalesForecastTarget>();
}

// ==================== SALES FORECAST TARGET ====================

/// <summary>
/// Revenue targets by forecast group and period
/// </summary>
public class SalesForecastTarget : TenantEntity
{
    public Guid? ForecastGroupId { get; set; }

    public int FiscalYear { get; set; }
    public int? FiscalQuarter { get; set; }  // 1-4, or null for annual
    public int? FiscalMonth { get; set; }    // 1-12, or null for quarter/annual

    public decimal TargetValue { get; set; }
    public decimal? ActualValue { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public virtual SalesForecastGroup? ForecastGroup { get; set; }
}
