namespace MyScheduling.Core.Entities;

/// <summary>
/// Tracks sent certification expiry notifications to avoid spam.
/// Records when a notification was sent for each person's certification.
/// </summary>
public class CertificationExpiryNotification : BaseEntity
{
    public Guid PersonCertificationId { get; set; }
    public DateTime SentAt { get; set; }

    // Navigation properties
    public virtual PersonCertification PersonCertification { get; set; } = null!;
}
