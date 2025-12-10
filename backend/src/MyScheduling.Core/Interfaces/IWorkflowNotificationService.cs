using MyScheduling.Core.Entities;

namespace MyScheduling.Core.Interfaces;

/// <summary>
/// Service for sending workflow-related notifications
/// </summary>
public interface IWorkflowNotificationService
{
    // Assignment Request Notifications
    Task SendAssignmentRequestCreatedAsync(AssignmentRequest request, User requester, User requestedFor, IEnumerable<User> approvers);
    Task SendAssignmentRequestApprovedAsync(AssignmentRequest request, User approver, User requester, User requestedFor);
    Task SendAssignmentRequestRejectedAsync(AssignmentRequest request, User approver, User requester, User requestedFor, string? reason);

    // WBS Workflow Notifications
    Task SendWbsSubmittedForApprovalAsync(WbsElement wbs, User submitter, User approver);
    Task SendWbsApprovedAsync(WbsElement wbs, User approver, User creator);
    Task SendWbsRejectedAsync(WbsElement wbs, User approver, User creator, string reason);
    Task SendWbsSuspendedAsync(WbsElement wbs, User suspendedBy, User creator, string? reason);
}
