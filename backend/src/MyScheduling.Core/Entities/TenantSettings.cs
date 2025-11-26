namespace MyScheduling.Core.Entities;

/// <summary>
/// Tenant-specific settings including logo and DOA print template configuration
/// </summary>
public class TenantSettings : BaseEntity
{
    public Guid TenantId { get; set; }

    // Logo settings
    public string? LogoUrl { get; set; }
    public string? LogoFileName { get; set; }
    public int? LogoWidth { get; set; }
    public int? LogoHeight { get; set; }

    // DOA Print Template settings
    public string? DOAPrintHeaderContent { get; set; }
    public string? DOAPrintFooterContent { get; set; }
    public string? DOAPrintLetterhead { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    public string? CompanyWebsite { get; set; }

    // Print template styling
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? FontFamily { get; set; }
    public int? FontSize { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
}
