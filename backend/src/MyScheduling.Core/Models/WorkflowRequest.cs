namespace MyScheduling.Core.Models;

/// <summary>
/// Workflow request used for WBS approval, rejection, and status change operations
/// </summary>
public class WorkflowRequest
{
    /// <summary>
    /// User ID performing the workflow action
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Optional notes or comments about the workflow action
    /// </summary>
    public string? Notes { get; set; }
}
