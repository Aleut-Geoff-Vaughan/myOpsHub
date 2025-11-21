namespace MyScheduling.Core.Entities;

public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Tenant? Tenant { get; set; }
}
