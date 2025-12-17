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

    // Environment and Notification Banner settings
    public string? EnvironmentName { get; set; } // e.g., "Development", "Test", "Staging", "Production"
    public bool ShowEnvironmentBanner { get; set; } = false;
    public bool NotificationBannerEnabled { get; set; } = false;
    public string? NotificationBannerMessage { get; set; }
    public string? NotificationBannerType { get; set; } // "info", "warning", "error", "success"
    public DateTime? NotificationBannerExpiresAt { get; set; }

    // Fiscal Year Configuration
    // FiscalYearStartMonth: 1 = January (calendar year), 4 = April (Apr-Mar), 7 = July (Jul-Jun), 10 = October (Oct-Sep)
    public int FiscalYearStartMonth { get; set; } = 10; // Default to October (federal fiscal year)
    public string FiscalYearPrefix { get; set; } = "FY"; // Display prefix (e.g., "FY2025")

    // Working Days Configuration (for forecast calculations)
    public decimal DefaultPtoDaysPerMonth { get; set; } = 1.5m; // Average PTO estimate per month
    public decimal StandardHoursPerDay { get; set; } = 8.0m;
    public bool ExcludeSaturdays { get; set; } = true;
    public bool ExcludeSundays { get; set; } = true;

    // Budget Configuration
    public bool RequireBudgetApproval { get; set; } = false;
    public int DefaultBudgetMonthsAhead { get; set; } = 12; // How many months ahead budgets can be created

    // Certification Expiry Notification Settings
    public int CertificationExpiryWarningDays { get; set; } = 90; // Show in UI within this many days
    public int CertificationExpiryEmailDays { get; set; } = 30; // Send email within this many days
    public bool EnableCertificationExpiryEmails { get; set; } = true; // Whether to send email notifications

    // Security Settings
    public bool EmailNotificationsEnabled { get; set; } = true;
    public bool Require2FA { get; set; } = false;
    public bool AllowSelfRegistration { get; set; } = false;
    public bool MaintenanceMode { get; set; } = false;
    public int SessionTimeoutMinutes { get; set; } = 30;
    public int PasswordMinLength { get; set; } = 8;
    public int FailedLoginAttemptsBeforeLock { get; set; } = 5;

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
}
