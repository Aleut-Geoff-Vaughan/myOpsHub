namespace MyScheduling.Core.Entities;

public class DOAActivation : BaseEntity
{
    public Guid DOALetterId { get; set; }
    public Guid TenantId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = string.Empty; // Travel, PTO, etc.
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime? DeactivatedAt { get; set; }
    public Guid? DeactivatedByUserId { get; set; }

    // Navigation properties
    public virtual DelegationOfAuthorityLetter DOALetter { get; set; } = null!;
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual ICollection<WorkLocationPreference> WorkLocationPreferences { get; set; } = new List<WorkLocationPreference>();
}
