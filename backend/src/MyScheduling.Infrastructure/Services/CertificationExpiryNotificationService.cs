using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Infrastructure.Services;

/// <summary>
/// Service for sending certification expiry notification emails.
/// Can be called manually or scheduled via a background job.
/// </summary>
public class CertificationExpiryNotificationService
{
    private readonly MySchedulingDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CertificationExpiryNotificationService> _logger;

    public CertificationExpiryNotificationService(
        MySchedulingDbContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<CertificationExpiryNotificationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Process all tenants and send expiry notifications to users with expiring certifications.
    /// </summary>
    /// <returns>Summary of notifications sent</returns>
    public async Task<NotificationSummary> SendExpiryNotificationsAsync()
    {
        var summary = new NotificationSummary();

        try
        {
            // Get all tenants with email notifications enabled
            var tenantSettings = await _context.TenantSettings
                .Where(ts => ts.EnableCertificationExpiryEmails)
                .ToListAsync();

            foreach (var settings in tenantSettings)
            {
                try
                {
                    var tenantResult = await ProcessTenantNotificationsAsync(settings);
                    summary.TotalEmailsSent += tenantResult.TotalEmailsSent;
                    summary.TotalEmailsFailed += tenantResult.TotalEmailsFailed;
                    summary.TenantsProcessed++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing notifications for tenant {TenantId}", settings.TenantId);
                    summary.Errors.Add($"Tenant {settings.TenantId}: {ex.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in certification expiry notification process");
            summary.Errors.Add(ex.Message);
        }

        _logger.LogInformation(
            "Certification expiry notification complete. Tenants: {Tenants}, Emails sent: {Sent}, Failed: {Failed}",
            summary.TenantsProcessed, summary.TotalEmailsSent, summary.TotalEmailsFailed);

        return summary;
    }

    /// <summary>
    /// Process notifications for a specific tenant
    /// </summary>
    private async Task<NotificationSummary> ProcessTenantNotificationsAsync(TenantSettings settings)
    {
        var summary = new NotificationSummary();
        var emailDays = settings.CertificationExpiryEmailDays;
        var cutoffDate = DateTime.UtcNow.AddDays(emailDays);

        // Get tenant users
        var tenantUserIds = await _context.TenantMemberships
            .Where(tm => tm.TenantId == settings.TenantId)
            .Select(tm => tm.UserId)
            .ToListAsync();

        // Find expiring certifications for users in this tenant
        var expiringCerts = await _context.PersonCertifications
            .Include(pc => pc.Certification)
            .Include(pc => pc.User)
            .Where(pc => tenantUserIds.Contains(pc.UserId) &&
                        pc.ExpiryDate != null &&
                        pc.ExpiryDate <= cutoffDate &&
                        pc.ExpiryDate >= DateTime.UtcNow) // Only future expirations
            .ToListAsync();

        // Group by user and send one email per certification (as per design)
        foreach (var cert in expiringCerts)
        {
            // Check if we've already notified recently (within last 7 days)
            // Using a simple tracking approach via a tag or separate tracking table
            var shouldNotify = await ShouldSendNotificationAsync(cert.Id);
            if (!shouldNotify)
            {
                continue;
            }

            try
            {
                var result = await SendCertificationExpiryEmailAsync(cert);
                if (result.Success)
                {
                    summary.TotalEmailsSent++;
                    await RecordNotificationSentAsync(cert.Id);
                }
                else
                {
                    summary.TotalEmailsFailed++;
                    _logger.LogWarning("Failed to send expiry email for cert {CertId}: {Error}",
                        cert.Id, result.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                summary.TotalEmailsFailed++;
                _logger.LogError(ex, "Error sending expiry email for certification {CertId}", cert.Id);
            }
        }

        return summary;
    }

    /// <summary>
    /// Send certification expiry notification email
    /// </summary>
    private async Task<EmailResult> SendCertificationExpiryEmailAsync(PersonCertification cert)
    {
        if (cert.User?.Email == null)
        {
            return EmailResult.Failed("User email not found");
        }

        var appName = _configuration["App:Name"] ?? "MyScheduling";
        var daysRemaining = (int)(cert.ExpiryDate!.Value - DateTime.UtcNow).TotalDays;
        var urgencyText = daysRemaining <= 7 ? "URGENT: " : (daysRemaining <= 14 ? "Reminder: " : "");

        var subject = $"{urgencyText}Your {cert.Certification?.Name} certification expires in {daysRemaining} days";

        var htmlBody = BuildExpiryEmailHtml(cert, daysRemaining, appName);
        var plainTextBody = BuildExpiryEmailPlainText(cert, daysRemaining, appName);

        return await _emailService.SendEmailAsync(cert.User.Email, subject, htmlBody, plainTextBody);
    }

    private string BuildExpiryEmailHtml(PersonCertification cert, int daysRemaining, string appName)
    {
        var urgencyColor = daysRemaining <= 7 ? "#dc2626" : (daysRemaining <= 30 ? "#f59e0b" : "#2563eb");
        var userName = cert.User?.DisplayName ?? cert.User?.Email ?? "User";

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;"">
    <div style=""background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"">
        <h1 style=""color: #1a1a1a; margin-bottom: 24px; font-size: 24px;"">Certification Expiring Soon</h1>

        <p style=""color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 16px;"">
            Hi {userName},
        </p>

        <p style=""color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;"">
            Your certification is expiring soon. Please take action to renew it before the expiration date.
        </p>

        <div style=""background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid {urgencyColor};"">
            <p style=""margin: 0 0 8px 0; font-size: 14px; color: #6b7280;"">Certification</p>
            <p style=""margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;"">{cert.Certification?.Name}</p>

            <p style=""margin: 0 0 8px 0; font-size: 14px; color: #6b7280;"">Issuing Organization</p>
            <p style=""margin: 0 0 16px 0; font-size: 16px; color: #1a1a1a;"">{cert.Certification?.Issuer ?? "N/A"}</p>

            <p style=""margin: 0 0 8px 0; font-size: 14px; color: #6b7280;"">Expiration Date</p>
            <p style=""margin: 0 0 16px 0; font-size: 16px; color: {urgencyColor}; font-weight: 600;"">{cert.ExpiryDate:MMMM d, yyyy}</p>

            <p style=""margin: 0; font-size: 14px; color: {urgencyColor}; font-weight: 600;"">
                Expires in {daysRemaining} day{(daysRemaining != 1 ? "s" : "")}
            </p>
        </div>

        {(string.IsNullOrEmpty(cert.CredentialId) ? "" : $@"
        <p style=""color: #6b7280; font-size: 14px; margin-bottom: 24px;"">
            <strong>Credential ID:</strong> {cert.CredentialId}
        </p>
        ")}

        <p style=""color: #4a4a4a; font-size: 14px; line-height: 1.5;"">
            To update your certification information after renewal, log in to {appName} and update your resume.
        </p>

        <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"">

        <p style=""color: #9ca3af; font-size: 12px; margin: 0;"">
            This is an automated notification from {appName}. You received this email because you have certifications tracked in your profile.
        </p>
    </div>
</body>
</html>";
    }

    private string BuildExpiryEmailPlainText(PersonCertification cert, int daysRemaining, string appName)
    {
        var userName = cert.User?.DisplayName ?? cert.User?.Email ?? "User";

        return $@"
Certification Expiring Soon
============================

Hi {userName},

Your certification is expiring soon. Please take action to renew it before the expiration date.

Certification: {cert.Certification?.Name}
Issuing Organization: {cert.Certification?.Issuer ?? "N/A"}
Expiration Date: {cert.ExpiryDate:MMMM d, yyyy}
Expires in: {daysRemaining} day{(daysRemaining != 1 ? "s" : "")}
{(string.IsNullOrEmpty(cert.CredentialId) ? "" : $"Credential ID: {cert.CredentialId}")}

To update your certification information after renewal, log in to {appName} and update your resume.

---
This is an automated notification from {appName}. You received this email because you have certifications tracked in your profile.
";
    }

    /// <summary>
    /// Check if we should send a notification (avoid spam by tracking recent notifications)
    /// For simplicity, we'll use a 7-day cooldown period stored via Tags in PersonCertification
    /// </summary>
    private async Task<bool> ShouldSendNotificationAsync(Guid personCertificationId)
    {
        // Check if there's a recent notification record
        // Using FileAccessLog pattern - we could create a dedicated table, but for now use simple approach
        var lastNotification = await _context.Set<CertificationExpiryNotification>()
            .Where(n => n.PersonCertificationId == personCertificationId)
            .OrderByDescending(n => n.SentAt)
            .FirstOrDefaultAsync();

        if (lastNotification == null)
            return true;

        // Only send if last notification was more than 7 days ago
        return (DateTime.UtcNow - lastNotification.SentAt).TotalDays >= 7;
    }

    /// <summary>
    /// Record that a notification was sent
    /// </summary>
    private async Task RecordNotificationSentAsync(Guid personCertificationId)
    {
        var notification = new CertificationExpiryNotification
        {
            Id = Guid.NewGuid(),
            PersonCertificationId = personCertificationId,
            SentAt = DateTime.UtcNow
        };

        _context.Set<CertificationExpiryNotification>().Add(notification);
        await _context.SaveChangesAsync();
    }
}

/// <summary>
/// Summary of notification processing
/// </summary>
public class NotificationSummary
{
    public int TenantsProcessed { get; set; }
    public int TotalEmailsSent { get; set; }
    public int TotalEmailsFailed { get; set; }
    public List<string> Errors { get; set; } = new();
}
