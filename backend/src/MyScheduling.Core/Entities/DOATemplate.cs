namespace MyScheduling.Core.Entities;

/// <summary>
/// Template for DOA letter content that can be used by all users in a tenant
/// </summary>
public class DOATemplate : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LetterContent { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
}
