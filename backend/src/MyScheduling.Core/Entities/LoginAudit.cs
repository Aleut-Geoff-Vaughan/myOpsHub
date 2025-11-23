namespace MyScheduling.Core.Entities;

public class LoginAudit : BaseEntity
{
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public bool IsSuccess { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Device { get; set; }
    public string? OperatingSystem { get; set; }
    public string? Browser { get; set; }
}
