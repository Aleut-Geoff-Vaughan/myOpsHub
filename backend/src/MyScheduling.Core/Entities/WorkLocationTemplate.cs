namespace MyScheduling.Core.Entities;

public class WorkLocationTemplate : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TemplateType Type { get; set; }
    public bool IsShared { get; set; }

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual User? User { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Tenant? Tenant { get; set; }
    public virtual ICollection<WorkLocationTemplateItem> Items { get; set; } = new List<WorkLocationTemplateItem>();
}

public enum TemplateType
{
    Day = 0,      // Single day template
    Week = 1,     // 5-day week template
    Custom = 2    // Custom multi-day template
}
