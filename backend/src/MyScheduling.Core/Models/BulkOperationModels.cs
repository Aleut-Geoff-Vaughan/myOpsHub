namespace MyScheduling.Core.Models;

/// <summary>
/// Request model for bulk workflow operations
/// </summary>
public class BulkWorkflowRequest
{
    /// <summary>
    /// List of WBS element IDs to process
    /// </summary>
    public List<Guid> WbsIds { get; set; } = new();

    /// <summary>
    /// User ID performing the bulk operation
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Optional notes for the bulk operation
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Response model for bulk workflow operations
/// </summary>
public class BulkOperationResult
{
    /// <summary>
    /// List of successfully processed item IDs
    /// </summary>
    public List<Guid> Successful { get; set; } = new();

    /// <summary>
    /// List of failed operations with error details
    /// </summary>
    public List<FailedOperation> Failed { get; set; } = new();
}

/// <summary>
/// Details of a failed operation in a bulk request
/// </summary>
public class FailedOperation
{
    /// <summary>
    /// ID of the item that failed
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Error message describing why the operation failed
    /// </summary>
    public string Error { get; set; } = string.Empty;
}
