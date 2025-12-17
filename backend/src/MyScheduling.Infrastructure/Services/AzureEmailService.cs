using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyScheduling.Core.Interfaces;

namespace MyScheduling.Infrastructure.Services;

/// <summary>
/// Azure Communication Services email implementation.
/// Uses Azure Communication Services Email for reliable email delivery.
/// </summary>
public class AzureEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureEmailService> _logger;
    private readonly EmailClient? _emailClient;
    private readonly string _senderAddress;

    public AzureEmailService(IConfiguration configuration, ILogger<AzureEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        var connectionString = _configuration["AzureEmail:ConnectionString"];
        _senderAddress = _configuration["AzureEmail:SenderAddress"] ?? "DoNotReply@myscheduling.aleutfederal.com";

        if (!string.IsNullOrEmpty(connectionString))
        {
            _emailClient = new EmailClient(connectionString);
            _logger.LogInformation("Azure Email Service initialized with sender: {SenderAddress}", _senderAddress);
        }
        else
        {
            _logger.LogWarning("Azure Email Service not configured - AzureEmail:ConnectionString is missing");
        }
    }

    public async Task<EmailResult> SendMagicLinkEmailAsync(string toEmail, string magicLinkUrl, DateTime expiresAt, string? requestedFromIp)
    {
        var appName = _configuration["App:Name"] ?? "MyScheduling";
        var expirationMinutes = (int)(expiresAt - DateTime.UtcNow).TotalMinutes;

        var subject = $"Your {appName} Login Link";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;"">
    <div style=""background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"">
        <h1 style=""color: #1a1a1a; margin-bottom: 24px; font-size: 24px;"">Sign in to {appName}</h1>

        <p style=""color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;"">
            Click the button below to sign in to your account. This link will expire in {expirationMinutes} minutes.
        </p>

        <a href=""{magicLinkUrl}""
           style=""display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;"">
            Sign In
        </a>

        <p style=""color: #6b7280; font-size: 14px; margin-top: 24px; line-height: 1.5;"">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style=""color: #2563eb; font-size: 14px; word-break: break-all;"">
            {magicLinkUrl}
        </p>

        <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"">

        <div style=""color: #9ca3af; font-size: 12px;"">
            <p style=""margin: 8px 0;"">
                <strong>Security Notice:</strong> This link was requested on {DateTime.UtcNow:MMMM d, yyyy 'at' h:mm tt} UTC
                {(string.IsNullOrEmpty(requestedFromIp) ? "" : $" from IP address {requestedFromIp}")}
            </p>
            <p style=""margin: 8px 0;"">
                If you didn't request this link, you can safely ignore this email. Someone may have entered your email address by mistake.
            </p>
            <p style=""margin: 8px 0;"">
                Never share this link with anyone. {appName} will never ask you for this link.
            </p>
        </div>
    </div>
</body>
</html>";

        var plainTextBody = $@"
Sign in to {appName}
=====================

Click or copy the link below to sign in to your account.
This link will expire in {expirationMinutes} minutes.

{magicLinkUrl}

Security Notice:
- This link was requested on {DateTime.UtcNow:MMMM d, yyyy 'at' h:mm tt} UTC{(string.IsNullOrEmpty(requestedFromIp) ? "" : $" from IP address {requestedFromIp}")}
- If you didn't request this link, you can safely ignore this email.
- Never share this link with anyone.
";

        return await SendEmailAsync(toEmail, subject, htmlBody, plainTextBody);
    }

    public async Task<EmailResult> SendEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null)
    {
        const int maxRetries = 3;
        var startTime = DateTime.UtcNow;

        try
        {
            if (_emailClient == null)
            {
                _logger.LogWarning("Azure Email not configured. Email to {ToEmail} not sent. Subject: {Subject}", toEmail, subject);

                // In development, just log and return success if configured to skip
                if (_configuration.GetValue("AzureEmail:SkipIfNotConfigured", false))
                {
                    _logger.LogInformation("Email content would have been sent:\nTo: {To}\nSubject: {Subject}\nBody: {Body}",
                        toEmail, subject, plainTextBody ?? "See HTML body");
                    return EmailResult.Succeeded("dev-skipped");
                }
                return EmailResult.Failed("Azure Email service not configured");
            }

            var emailContent = new EmailContent(subject)
            {
                Html = htmlBody
            };

            if (!string.IsNullOrEmpty(plainTextBody))
            {
                emailContent.PlainText = plainTextBody;
            }

            var emailMessage = new EmailMessage(
                senderAddress: _senderAddress,
                content: emailContent,
                recipients: new EmailRecipients(new List<EmailAddress> { new EmailAddress(toEmail) })
            );

            _logger.LogInformation("Sending email via Azure Communication Services to {ToEmail}. Subject: {Subject}", toEmail, subject);

            // Retry logic for transient failures
            RequestFailedException? lastException = null;
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    // Send email and wait for result
                    EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                        WaitUntil.Completed,
                        emailMessage);

                    var result = emailSendOperation.Value;
                    var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;

                    if (result.Status == EmailSendStatus.Succeeded)
                    {
                        _logger.LogInformation(
                            "Email sent successfully to {ToEmail}. MessageId: {MessageId}, Duration: {Duration}ms, Attempts: {Attempts}",
                            toEmail, emailSendOperation.Id, duration, attempt);
                        return EmailResult.Succeeded(emailSendOperation.Id);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Email send returned status {Status} for {ToEmail}. Duration: {Duration}ms",
                            result.Status, toEmail, duration);
                        return EmailResult.Failed($"Email send status: {result.Status}");
                    }
                }
                catch (RequestFailedException ex) when (IsTransientError(ex) && attempt < maxRetries)
                {
                    lastException = ex;
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt)); // Exponential backoff: 2s, 4s, 8s
                    _logger.LogWarning(
                        "Azure Email transient failure on attempt {Attempt}/{MaxRetries} for {ToEmail}. Status: {Status}, ErrorCode: {ErrorCode}. Retrying in {Delay}s",
                        attempt, maxRetries, toEmail, ex.Status, ex.ErrorCode, delay.TotalSeconds);
                    await Task.Delay(delay);
                }
            }

            // All retries exhausted
            var totalDuration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(lastException,
                "Azure Email request failed after {MaxRetries} attempts for {ToEmail}. Total Duration: {Duration}ms, Final Status: {Status}, ErrorCode: {ErrorCode}",
                maxRetries, toEmail, totalDuration, lastException?.Status, lastException?.ErrorCode);
            return EmailResult.Failed($"Azure Email error after {maxRetries} attempts: {lastException?.Message}");
        }
        catch (RequestFailedException ex)
        {
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(ex,
                "Azure Email request failed for {ToEmail}. Status: {Status}, ErrorCode: {ErrorCode}, Duration: {Duration}ms",
                toEmail, ex.Status, ex.ErrorCode, duration);
            return EmailResult.Failed($"Azure Email error: {ex.Message}");
        }
        catch (Exception ex)
        {
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(ex,
                "Failed to send email to {ToEmail}. Subject: {Subject}, Duration: {Duration}ms, ExceptionType: {ExceptionType}",
                toEmail, subject, duration, ex.GetType().Name);
            return EmailResult.Failed($"Failed to send email: {ex.Message}");
        }
    }

    /// <summary>
    /// Determines if an Azure request failure is transient and eligible for retry.
    /// </summary>
    private static bool IsTransientError(RequestFailedException ex)
    {
        // Retry on server errors (5xx) and some client errors
        return ex.Status >= 500 || ex.Status == 429; // 429 = Too Many Requests
    }
}
