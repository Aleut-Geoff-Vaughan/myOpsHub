namespace MyScheduling.Core.Entities;

/// <summary>
/// User feedback for errors, bugs, or enhancement suggestions.
/// </summary>
public class Feedback : TenantEntity
{
    /// <summary>
    /// The user who submitted the feedback
    /// </summary>
    public Guid SubmittedByUserId { get; set; }

    /// <summary>
    /// Type of feedback: Bug, Enhancement, Question, Other
    /// </summary>
    public FeedbackType Type { get; set; }

    /// <summary>
    /// Priority level: Low, Medium, High, Critical
    /// </summary>
    public FeedbackPriority Priority { get; set; } = FeedbackPriority.Medium;

    /// <summary>
    /// Brief summary/title of the feedback
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of the feedback
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// The page/route where the feedback was submitted from
    /// </summary>
    public string? PageUrl { get; set; }

    /// <summary>
    /// Steps to reproduce (for bugs)
    /// </summary>
    public string? StepsToReproduce { get; set; }

    /// <summary>
    /// Expected behavior (for bugs)
    /// </summary>
    public string? ExpectedBehavior { get; set; }

    /// <summary>
    /// Actual behavior (for bugs)
    /// </summary>
    public string? ActualBehavior { get; set; }

    /// <summary>
    /// Browser/device information captured at submission
    /// </summary>
    public string? BrowserInfo { get; set; }

    /// <summary>
    /// Screenshot URL (if uploaded)
    /// </summary>
    public string? ScreenshotUrl { get; set; }

    /// <summary>
    /// Current status of the feedback
    /// </summary>
    public FeedbackStatus Status { get; set; } = FeedbackStatus.New;

    /// <summary>
    /// Admin notes/response
    /// </summary>
    public string? AdminNotes { get; set; }

    /// <summary>
    /// External ticket ID (e.g., JIRA ticket number)
    /// </summary>
    public string? ExternalTicketId { get; set; }

    /// <summary>
    /// External ticket URL (e.g., JIRA link)
    /// </summary>
    public string? ExternalTicketUrl { get; set; }

    /// <summary>
    /// JSON string of AI conversation for requirement refinement
    /// </summary>
    public string? AiConversationHistory { get; set; }

    /// <summary>
    /// AI-refined requirements summary
    /// </summary>
    public string? RefinedRequirements { get; set; }

    /// <summary>
    /// Date when feedback was resolved/closed
    /// </summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>
    /// User who resolved the feedback
    /// </summary>
    public Guid? ResolvedByUserId { get; set; }

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual User? SubmittedByUser { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public virtual User? ResolvedByUser { get; set; }
}

public enum FeedbackType
{
    Bug = 0,
    Enhancement = 1,
    Question = 2,
    Other = 3
}

public enum FeedbackPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum FeedbackStatus
{
    New = 0,
    UnderReview = 1,
    InProgress = 2,
    Resolved = 3,
    Closed = 4,
    WontFix = 5
}
