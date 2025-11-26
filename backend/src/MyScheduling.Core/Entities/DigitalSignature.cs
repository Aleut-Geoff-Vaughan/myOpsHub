namespace MyScheduling.Core.Entities;

public class DigitalSignature : BaseEntity
{
    public Guid DOALetterId { get; set; }
    public Guid SignerUserId { get; set; }
    public SignatureRole Role { get; set; }

    // Signature data - supports both graphic (canvas) and typed signatures
    public string SignatureData { get; set; } = string.Empty; // Base64 encoded signature image from canvas
    public SignatureType SignatureType { get; set; } = SignatureType.Drawn;
    public string? TypedSignature { get; set; }  // Full name if typed signature

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

public enum SignatureType
{
    Drawn = 0,      // Hand-drawn signature from canvas
    Typed = 1       // Typed full name as signature
}
