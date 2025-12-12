namespace MyScheduling.Core.Entities;

/// <summary>
/// Represents a help article that provides context-sensitive help content.
/// Articles can link to JIRA knowledge base, video tutorials, or custom content.
/// </summary>
public class HelpArticle : BaseEntity
{
    /// <summary>
    /// Tenant ID for multi-tenant isolation. Null for system-wide help articles.
    /// </summary>
    public Guid? TenantId { get; set; }

    /// <summary>
    /// The context key that identifies where this help content appears.
    /// Examples: "work.staffing", "forecast.projects", "facilities.hoteling"
    /// </summary>
    public string ContextKey { get; set; } = string.Empty;

    /// <summary>
    /// Display title for the help article
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional brief description shown as preview text
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// URL to JIRA knowledge base article (if applicable)
    /// </summary>
    public string? JiraArticleUrl { get; set; }

    /// <summary>
    /// URL to video tutorial (YouTube, Loom, etc.)
    /// </summary>
    public string? VideoUrl { get; set; }

    /// <summary>
    /// Display title for the video link
    /// </summary>
    public string? VideoTitle { get; set; }

    /// <summary>
    /// Optional custom HTML/Markdown content for inline help
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Sort order for displaying multiple articles in the same context
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this article is currently active/visible
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Module name for grouping (work, forecast, facilities, admin, etc.)
    /// </summary>
    public string? ModuleName { get; set; }

    /// <summary>
    /// Tags for searching and categorization
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// Icon name to display (from lucide-react icon library)
    /// </summary>
    public string? IconName { get; set; }

    // Navigation properties
    public virtual Tenant? Tenant { get; set; }
}
