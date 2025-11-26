namespace MyScheduling.Core.Entities;

/// <summary>
/// Represents a user's assignment to a project (Step 1 of two-step assignment model).
/// Users must first be assigned to a project before they can be assigned to specific WBS elements.
/// </summary>
public class ProjectAssignment : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public ProjectAssignmentStatus Status { get; set; }
    public string? Notes { get; set; }

    // Approval tracking
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Project Project { get; set; } = null!;
    public virtual User? ApprovedByUser { get; set; }
    public virtual ICollection<Assignment> WbsAssignments { get; set; } = new List<Assignment>();
}

public enum ProjectAssignmentStatus
{
    Draft,
    PendingApproval,
    Active,
    Completed,
    Cancelled
}
