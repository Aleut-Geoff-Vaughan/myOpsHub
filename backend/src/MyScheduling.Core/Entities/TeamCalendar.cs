namespace MyScheduling.Core.Entities;

/// <summary>
/// Represents a team calendar that groups people for shared work location visibility
/// Can be used for manager views or cross-functional team coordination
/// </summary>
public class TeamCalendar : TenantEntity
{
    /// <summary>
    /// Name of the team calendar (e.g., "Engineering Team", "Sales - East Coast")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the team calendar's purpose
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Team calendar type - determines how it's used
    /// </summary>
    public TeamCalendarType Type { get; set; } = TeamCalendarType.Team;

    /// <summary>
    /// If true, this calendar is visible to its members
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional manager/owner of this calendar (can be used for manager hierarchies)
    /// </summary>
    public Guid? OwnerId { get; set; }

    /// <summary>
    /// Navigation to the owner person
    /// </summary>
    public virtual Person? Owner { get; set; }

    /// <summary>
    /// Members of this team calendar
    /// </summary>
    public virtual ICollection<TeamCalendarMember> Members { get; set; } = new List<TeamCalendarMember>();
}

/// <summary>
/// Represents a person's membership in a team calendar
/// </summary>
public class TeamCalendarMember : TenantEntity
{
    /// <summary>
    /// ID of the team calendar
    /// </summary>
    public Guid TeamCalendarId { get; set; }

    /// <summary>
    /// ID of the person who is a member
    /// </summary>
    public Guid PersonId { get; set; }

    /// <summary>
    /// How this person was added to the calendar
    /// </summary>
    public MembershipType MembershipType { get; set; } = MembershipType.OptIn;

    /// <summary>
    /// Date when person was added to the calendar
    /// </summary>
    public DateTime AddedDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional: ID of admin who added this person (for forced memberships)
    /// </summary>
    public Guid? AddedByUserId { get; set; }

    /// <summary>
    /// If false, person's work location won't show on this calendar
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual TeamCalendar TeamCalendar { get; set; } = null!;
    public virtual Person Person { get; set; } = null!;
    public virtual User? AddedByUser { get; set; }
}

/// <summary>
/// Type of team calendar
/// </summary>
public enum TeamCalendarType
{
    /// <summary>
    /// General team calendar - can be any group of people
    /// </summary>
    Team = 0,

    /// <summary>
    /// Manager calendar - automatically includes direct reports
    /// </summary>
    Manager = 1,

    /// <summary>
    /// Department or organizational unit calendar
    /// </summary>
    Department = 2,

    /// <summary>
    /// Project-based team calendar
    /// </summary>
    Project = 3
}

/// <summary>
/// How a person became a member of a team calendar
/// </summary>
public enum MembershipType
{
    /// <summary>
    /// Person voluntarily added themselves
    /// </summary>
    OptIn = 0,

    /// <summary>
    /// Admin/manager forced person onto calendar
    /// </summary>
    Forced = 1,

    /// <summary>
    /// Automatically added (e.g., direct report to manager)
    /// </summary>
    Automatic = 2
}
