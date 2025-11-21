namespace MyScheduling.Core.Entities;

public class DigitalSignature : BaseEntity
{
    public Guid DOALetterId { get; set; }
    public Guid SignerUserId { get; set; }
    public SignatureRole Role { get; set; }
    public string SignatureData { get; set; } = string.Empty; // Base64 encoded signature image
    public DateTime SignedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public bool IsVerified { get; set; }

    // Navigation properties
    public virtual DelegationOfAuthorityLetter DOALetter { get; set; } = null!;
    public virtual User SignerUser { get; set; } = null!;
}

public enum SignatureRole
{
    Delegator = 0,  // Person delegating authority
    Designee = 1    // Person receiving authority
}
