using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/email-test")]
public class EmailTestController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailTestController> _logger;
    private readonly IConfiguration _configuration;

    public EmailTestController(
        MySchedulingDbContext context,
        IEmailService emailService,
        ILogger<EmailTestController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Get list of users for email test recipient selection
    /// </summary>
    [HttpGet("users")]
    [RequiresPermission(Resource = "EmailTest", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<EmailTestUserDto>>> GetUsers()
    {
        var users = await _context.Users
            .Where(u => u.IsActive && !string.IsNullOrEmpty(u.Email))
            .OrderBy(u => u.DisplayName)
            .Select(u => new EmailTestUserDto
            {
                Id = u.Id,
                Email = u.Email,
                DisplayName = u.DisplayName
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Send a test email to verify deliverability
    /// </summary>
    [HttpPost("send")]
    [RequiresPermission(Resource = "EmailTest", Action = PermissionAction.Create)]
    public async Task<ActionResult<EmailTestResult>> SendTestEmail([FromBody] SendTestEmailRequest request)
    {
        try
        {
            var timestamp = DateTime.UtcNow;
            var appName = _configuration["App:Name"] ?? "MyScheduling";

            // Build the email content
            var subject = string.IsNullOrWhiteSpace(request.Subject)
                ? $"[{appName}] Email Deliverability Test - {timestamp:yyyy-MM-dd HH:mm:ss} UTC"
                : request.Subject;

            var htmlBody = BuildTestEmailHtml(request.Body, timestamp, appName);
            var plainTextBody = BuildTestEmailPlainText(request.Body, timestamp, appName);

            _logger.LogInformation("Sending test email to {Email} at {Timestamp}", request.ToEmail, timestamp);

            var result = await _emailService.SendEmailAsync(
                request.ToEmail,
                subject,
                htmlBody,
                plainTextBody);

            if (result.Success)
            {
                _logger.LogInformation("Test email sent successfully to {Email}, MessageId: {MessageId}",
                    request.ToEmail, result.MessageId);

                return Ok(new EmailTestResult
                {
                    Success = true,
                    Message = $"Test email sent successfully to {request.ToEmail}",
                    MessageId = result.MessageId,
                    SentAt = timestamp
                });
            }
            else
            {
                _logger.LogWarning("Failed to send test email to {Email}: {Error}",
                    request.ToEmail, result.ErrorMessage);

                return Ok(new EmailTestResult
                {
                    Success = false,
                    Message = $"Failed to send email: {result.ErrorMessage}",
                    SentAt = timestamp
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test email to {Email}", request.ToEmail);
            return StatusCode(500, new EmailTestResult
            {
                Success = false,
                Message = $"Error sending email: {ex.Message}",
                SentAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Get the current email configuration status (without sensitive data)
    /// </summary>
    [HttpGet("config")]
    [RequiresPermission(Resource = "EmailTest", Action = PermissionAction.Read)]
    public ActionResult<EmailConfigStatus> GetEmailConfig()
    {
        var azureConnectionString = _configuration["AzureEmail:ConnectionString"];
        var smtpHost = _configuration["Email:SmtpHost"];

        var isAzureConfigured = !string.IsNullOrEmpty(azureConnectionString);
        var isSmtpConfigured = !string.IsNullOrEmpty(smtpHost);

        return Ok(new EmailConfigStatus
        {
            Provider = isAzureConfigured ? "Azure Communication Services" :
                       isSmtpConfigured ? "SMTP" : "Not Configured",
            IsConfigured = isAzureConfigured || isSmtpConfigured,
            SmtpHost = isSmtpConfigured ? smtpHost : null,
            AzureSenderAddress = isAzureConfigured ? _configuration["AzureEmail:SenderAddress"] : null,
            FromEmail = _configuration["Email:FromEmail"] ?? _configuration["AzureEmail:SenderAddress"],
            FromName = _configuration["Email:FromName"] ?? "MyScheduling"
        });
    }

    private string BuildTestEmailHtml(string? customBody, DateTime timestamp, string appName)
    {
        var body = string.IsNullOrWhiteSpace(customBody)
            ? "This is a test email to verify email deliverability from the MyScheduling application."
            : customBody;

        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Email Test</title>
</head>
<body style=""margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;"">
    <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
        <tr>
            <td style=""padding: 40px 20px;"">
                <table role=""presentation"" style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"">
                    <!-- Header -->
                    <tr>
                        <td style=""padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;"">
                            <h1 style=""margin: 0; font-size: 24px; font-weight: 600; color: #7c3aed;"">
                                {appName}
                            </h1>
                            <p style=""margin: 8px 0 0; font-size: 14px; color: #6b7280;"">
                                Email Deliverability Test
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style=""padding: 32px;"">
                            <div style=""background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; margin-bottom: 24px;"">
                                <p style=""margin: 0; color: #166534; font-weight: 500;"">
                                    ✓ Email delivered successfully!
                                </p>
                            </div>

                            <p style=""margin: 0 0 16px; color: #374151; line-height: 1.6;"">
                                {body}
                            </p>

                            <div style=""background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-top: 24px;"">
                                <h3 style=""margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;"">
                                    Test Details
                                </h3>
                                <table style=""width: 100%; font-size: 13px; color: #6b7280;"">
                                    <tr>
                                        <td style=""padding: 4px 0; width: 140px;"">Sent At (UTC):</td>
                                        <td style=""padding: 4px 0; font-family: monospace;"">{timestamp:yyyy-MM-dd HH:mm:ss}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 4px 0;"">Sent At (Local):</td>
                                        <td style=""padding: 4px 0; font-family: monospace;"">{timestamp.ToLocalTime():yyyy-MM-dd HH:mm:ss}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 4px 0;"">Test ID:</td>
                                        <td style=""padding: 4px 0; font-family: monospace;"">{Guid.NewGuid():N}</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"">
                            <p style=""margin: 0; font-size: 12px; color: #9ca3af; text-align: center;"">
                                This is an automated test email from {appName}.<br>
                                Please do not reply to this message.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }

    private string BuildTestEmailPlainText(string? customBody, DateTime timestamp, string appName)
    {
        var body = string.IsNullOrWhiteSpace(customBody)
            ? "This is a test email to verify email deliverability from the MyScheduling application."
            : customBody;

        return $@"{appName} - Email Deliverability Test
========================================

✓ Email delivered successfully!

{body}

Test Details:
- Sent At (UTC): {timestamp:yyyy-MM-dd HH:mm:ss}
- Sent At (Local): {timestamp.ToLocalTime():yyyy-MM-dd HH:mm:ss}
- Test ID: {Guid.NewGuid():N}

---
This is an automated test email from {appName}.
Please do not reply to this message.";
    }
}

// DTOs
public class EmailTestUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class SendTestEmailRequest
{
    public string ToEmail { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Body { get; set; }
}

public class EmailTestResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? MessageId { get; set; }
    public DateTime SentAt { get; set; }
}

public class EmailConfigStatus
{
    public string Provider { get; set; } = string.Empty;
    public bool IsConfigured { get; set; }
    public string? SmtpHost { get; set; }
    public string? AzureSenderAddress { get; set; }
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
}
