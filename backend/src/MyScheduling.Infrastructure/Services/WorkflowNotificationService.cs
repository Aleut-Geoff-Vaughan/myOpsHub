using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;

namespace MyScheduling.Infrastructure.Services;

/// <summary>
/// Service for sending workflow-related email notifications
/// </summary>
public class WorkflowNotificationService : IWorkflowNotificationService
{
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WorkflowNotificationService> _logger;
    private readonly string _appName;
    private readonly string _appUrl;

    public WorkflowNotificationService(
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<WorkflowNotificationService> logger)
    {
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _appName = configuration["App:Name"] ?? "MyScheduling";
        _appUrl = configuration["App:Url"] ?? "https://myscheduling.com";
    }

    #region Assignment Request Notifications

    public async Task SendAssignmentRequestCreatedAsync(
        AssignmentRequest request,
        User requester,
        User requestedFor,
        IEnumerable<User> approvers)
    {
        var projectName = request.WbsElement?.Project?.Name ?? "Unknown Project";
        var wbsCode = request.WbsElement?.Code ?? "N/A";

        foreach (var approver in approvers.Where(a => !string.IsNullOrEmpty(a.Email)))
        {
            try
            {
                var subject = $"[{_appName}] Assignment Request Awaiting Your Approval";

                var htmlBody = BuildEmailTemplate(
                    title: "Assignment Request Pending Approval",
                    greeting: $"Hello {approver.DisplayName ?? approver.Email},",
                    content: $@"
                        <p>A new assignment request has been submitted and requires your approval.</p>

                        <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                            <p style=""margin: 4px 0;""><strong>Requested By:</strong> {requester.DisplayName ?? requester.Email}</p>
                            <p style=""margin: 4px 0;""><strong>Requested For:</strong> {requestedFor.DisplayName ?? requestedFor.Email}</p>
                            <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                            <p style=""margin: 4px 0;""><strong>WBS Code:</strong> {wbsCode}</p>
                            <p style=""margin: 4px 0;""><strong>Allocation:</strong> {request.AllocationPct}%</p>
                            {(request.StartDate.HasValue ? $"<p style=\"margin: 4px 0;\"><strong>Start Date:</strong> {request.StartDate.Value:MMM d, yyyy}</p>" : "")}
                            {(request.EndDate.HasValue ? $"<p style=\"margin: 4px 0;\"><strong>End Date:</strong> {request.EndDate.Value:MMM d, yyyy}</p>" : "")}
                            {(!string.IsNullOrEmpty(request.Notes) ? $"<p style=\"margin: 4px 0;\"><strong>Notes:</strong> {request.Notes}</p>" : "")}
                        </div>",
                    actionUrl: $"{_appUrl}/staffing/requests",
                    actionText: "Review Request"
                );

                await _emailService.SendEmailAsync(approver.Email!, subject, htmlBody);
                _logger.LogInformation("Sent assignment request notification to approver {ApproverEmail} for request {RequestId}",
                    approver.Email, request.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send assignment request notification to {ApproverEmail}", approver.Email);
            }
        }
    }

    public async Task SendAssignmentRequestApprovedAsync(
        AssignmentRequest request,
        User approver,
        User requester,
        User requestedFor)
    {
        var recipients = new List<User> { requester };
        if (requester.Id != requestedFor.Id)
        {
            recipients.Add(requestedFor);
        }

        var projectName = request.WbsElement?.Project?.Name ?? "Unknown Project";

        foreach (var recipient in recipients.Where(r => !string.IsNullOrEmpty(r.Email)))
        {
            try
            {
                var subject = $"[{_appName}] Assignment Request Approved";

                var htmlBody = BuildEmailTemplate(
                    title: "Assignment Request Approved",
                    greeting: $"Hello {recipient.DisplayName ?? recipient.Email},",
                    content: $@"
                        <p style=""color: #059669;"">Good news! Your assignment request has been approved.</p>

                        <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                            <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                            <p style=""margin: 4px 0;""><strong>Assigned To:</strong> {requestedFor.DisplayName ?? requestedFor.Email}</p>
                            <p style=""margin: 4px 0;""><strong>Approved By:</strong> {approver.DisplayName ?? approver.Email}</p>
                            <p style=""margin: 4px 0;""><strong>Allocation:</strong> {request.AllocationPct}%</p>
                        </div>",
                    actionUrl: $"{_appUrl}/staffing/my-assignments",
                    actionText: "View Assignments"
                );

                await _emailService.SendEmailAsync(recipient.Email!, subject, htmlBody);
                _logger.LogInformation("Sent approval notification to {RecipientEmail} for request {RequestId}",
                    recipient.Email, request.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send approval notification to {RecipientEmail}", recipient.Email);
            }
        }
    }

    public async Task SendAssignmentRequestRejectedAsync(
        AssignmentRequest request,
        User approver,
        User requester,
        User requestedFor,
        string? reason)
    {
        var recipients = new List<User> { requester };
        if (requester.Id != requestedFor.Id)
        {
            recipients.Add(requestedFor);
        }

        var projectName = request.WbsElement?.Project?.Name ?? "Unknown Project";

        foreach (var recipient in recipients.Where(r => !string.IsNullOrEmpty(r.Email)))
        {
            try
            {
                var subject = $"[{_appName}] Assignment Request Rejected";

                var htmlBody = BuildEmailTemplate(
                    title: "Assignment Request Rejected",
                    greeting: $"Hello {recipient.DisplayName ?? recipient.Email},",
                    content: $@"
                        <p style=""color: #dc2626;"">Your assignment request has been rejected.</p>

                        <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                            <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                            <p style=""margin: 4px 0;""><strong>For:</strong> {requestedFor.DisplayName ?? requestedFor.Email}</p>
                            <p style=""margin: 4px 0;""><strong>Rejected By:</strong> {approver.DisplayName ?? approver.Email}</p>
                            {(!string.IsNullOrEmpty(reason) ? $"<p style=\"margin: 4px 0;\"><strong>Reason:</strong> {reason}</p>" : "")}
                        </div>

                        <p>Please contact the approver if you have questions or would like to discuss this decision.</p>",
                    actionUrl: $"{_appUrl}/staffing/requests",
                    actionText: "View Requests"
                );

                await _emailService.SendEmailAsync(recipient.Email!, subject, htmlBody);
                _logger.LogInformation("Sent rejection notification to {RecipientEmail} for request {RequestId}",
                    recipient.Email, request.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send rejection notification to {RecipientEmail}", recipient.Email);
            }
        }
    }

    #endregion

    #region WBS Workflow Notifications

    public async Task SendWbsSubmittedForApprovalAsync(WbsElement wbs, User submitter, User approver)
    {
        if (string.IsNullOrEmpty(approver.Email))
        {
            _logger.LogWarning("Cannot send WBS submission notification - approver {ApproverId} has no email", approver.Id);
            return;
        }

        try
        {
            var projectName = wbs.Project?.Name ?? "Unknown Project";
            var subject = $"[{_appName}] WBS Element Submitted for Approval - {wbs.Code}";

            var htmlBody = BuildEmailTemplate(
                title: "WBS Element Awaiting Approval",
                greeting: $"Hello {approver.DisplayName ?? approver.Email},",
                content: $@"
                    <p>A WBS element has been submitted for your approval.</p>

                    <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                        <p style=""margin: 4px 0;""><strong>WBS Code:</strong> {wbs.Code}</p>
                        <p style=""margin: 4px 0;""><strong>Description:</strong> {wbs.Description}</p>
                        <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                        <p style=""margin: 4px 0;""><strong>Submitted By:</strong> {submitter.DisplayName ?? submitter.Email}</p>
                        <p style=""margin: 4px 0;""><strong>Type:</strong> {wbs.Type}</p>
                    </div>",
                actionUrl: $"{_appUrl}/projects/{wbs.ProjectId}/wbs/{wbs.Id}",
                actionText: "Review WBS Element"
            );

            await _emailService.SendEmailAsync(approver.Email, subject, htmlBody);
            _logger.LogInformation("Sent WBS submission notification to approver {ApproverEmail} for WBS {WbsId}",
                approver.Email, wbs.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WBS submission notification to {ApproverEmail}", approver.Email);
        }
    }

    public async Task SendWbsApprovedAsync(WbsElement wbs, User approver, User creator)
    {
        if (string.IsNullOrEmpty(creator.Email))
        {
            _logger.LogWarning("Cannot send WBS approval notification - creator {CreatorId} has no email", creator.Id);
            return;
        }

        try
        {
            var projectName = wbs.Project?.Name ?? "Unknown Project";
            var subject = $"[{_appName}] WBS Element Approved - {wbs.Code}";

            var htmlBody = BuildEmailTemplate(
                title: "WBS Element Approved",
                greeting: $"Hello {creator.DisplayName ?? creator.Email},",
                content: $@"
                    <p style=""color: #059669;"">Your WBS element has been approved and is now active.</p>

                    <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                        <p style=""margin: 4px 0;""><strong>WBS Code:</strong> {wbs.Code}</p>
                        <p style=""margin: 4px 0;""><strong>Description:</strong> {wbs.Description}</p>
                        <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                        <p style=""margin: 4px 0;""><strong>Approved By:</strong> {approver.DisplayName ?? approver.Email}</p>
                        {(!string.IsNullOrEmpty(wbs.ApprovalNotes) ? $"<p style=\"margin: 4px 0;\"><strong>Notes:</strong> {wbs.ApprovalNotes}</p>" : "")}
                    </div>",
                actionUrl: $"{_appUrl}/projects/{wbs.ProjectId}/wbs/{wbs.Id}",
                actionText: "View WBS Element"
            );

            await _emailService.SendEmailAsync(creator.Email, subject, htmlBody);
            _logger.LogInformation("Sent WBS approval notification to creator {CreatorEmail} for WBS {WbsId}",
                creator.Email, wbs.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WBS approval notification to {CreatorEmail}", creator.Email);
        }
    }

    public async Task SendWbsRejectedAsync(WbsElement wbs, User approver, User creator, string reason)
    {
        if (string.IsNullOrEmpty(creator.Email))
        {
            _logger.LogWarning("Cannot send WBS rejection notification - creator {CreatorId} has no email", creator.Id);
            return;
        }

        try
        {
            var projectName = wbs.Project?.Name ?? "Unknown Project";
            var subject = $"[{_appName}] WBS Element Rejected - {wbs.Code}";

            var htmlBody = BuildEmailTemplate(
                title: "WBS Element Rejected",
                greeting: $"Hello {creator.DisplayName ?? creator.Email},",
                content: $@"
                    <p style=""color: #dc2626;"">Your WBS element has been rejected and requires revision.</p>

                    <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                        <p style=""margin: 4px 0;""><strong>WBS Code:</strong> {wbs.Code}</p>
                        <p style=""margin: 4px 0;""><strong>Description:</strong> {wbs.Description}</p>
                        <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                        <p style=""margin: 4px 0;""><strong>Rejected By:</strong> {approver.DisplayName ?? approver.Email}</p>
                        <p style=""margin: 4px 0;""><strong>Reason:</strong> {reason}</p>
                    </div>

                    <p>Please review the feedback and make the necessary corrections. You can resubmit the WBS element after making changes.</p>",
                actionUrl: $"{_appUrl}/projects/{wbs.ProjectId}/wbs/{wbs.Id}",
                actionText: "Edit WBS Element"
            );

            await _emailService.SendEmailAsync(creator.Email, subject, htmlBody);
            _logger.LogInformation("Sent WBS rejection notification to creator {CreatorEmail} for WBS {WbsId}",
                creator.Email, wbs.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WBS rejection notification to {CreatorEmail}", creator.Email);
        }
    }

    public async Task SendWbsSuspendedAsync(WbsElement wbs, User suspendedBy, User creator, string? reason)
    {
        if (string.IsNullOrEmpty(creator.Email))
        {
            _logger.LogWarning("Cannot send WBS suspension notification - creator {CreatorId} has no email", creator.Id);
            return;
        }

        try
        {
            var projectName = wbs.Project?.Name ?? "Unknown Project";
            var subject = $"[{_appName}] WBS Element Suspended - {wbs.Code}";

            var htmlBody = BuildEmailTemplate(
                title: "WBS Element Suspended",
                greeting: $"Hello {creator.DisplayName ?? creator.Email},",
                content: $@"
                    <p style=""color: #d97706;"">A WBS element you created has been suspended.</p>

                    <div style=""background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;"">
                        <p style=""margin: 4px 0;""><strong>WBS Code:</strong> {wbs.Code}</p>
                        <p style=""margin: 4px 0;""><strong>Description:</strong> {wbs.Description}</p>
                        <p style=""margin: 4px 0;""><strong>Project:</strong> {projectName}</p>
                        <p style=""margin: 4px 0;""><strong>Suspended By:</strong> {suspendedBy.DisplayName ?? suspendedBy.Email}</p>
                        {(!string.IsNullOrEmpty(reason) ? $"<p style=\"margin: 4px 0;\"><strong>Reason:</strong> {reason}</p>" : "")}
                    </div>

                    <p>The WBS element is no longer active. Please contact the administrator if you have questions.</p>",
                actionUrl: $"{_appUrl}/projects/{wbs.ProjectId}/wbs/{wbs.Id}",
                actionText: "View WBS Element"
            );

            await _emailService.SendEmailAsync(creator.Email, subject, htmlBody);
            _logger.LogInformation("Sent WBS suspension notification to creator {CreatorEmail} for WBS {WbsId}",
                creator.Email, wbs.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WBS suspension notification to {CreatorEmail}", creator.Email);
        }
    }

    #endregion

    #region Email Template Helper

    private string BuildEmailTemplate(string title, string greeting, string content, string actionUrl, string actionText)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;"">
    <div style=""background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"">
        <h1 style=""color: #1a1a1a; margin-bottom: 24px; font-size: 24px;"">{title}</h1>

        <p style=""color: #4a4a4a; font-size: 16px; line-height: 1.5;"">{greeting}</p>

        {content}

        <a href=""{actionUrl}""
           style=""display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-top: 16px;"">
            {actionText}
        </a>

        <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"">

        <div style=""color: #9ca3af; font-size: 12px;"">
            <p style=""margin: 8px 0;"">
                This is an automated notification from {_appName}. Please do not reply to this email.
            </p>
            <p style=""margin: 8px 0;"">
                If you have questions, please contact your system administrator.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    #endregion
}
