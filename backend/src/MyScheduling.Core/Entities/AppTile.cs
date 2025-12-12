namespace MyScheduling.Core.Entities;

/// <summary>
/// Represents an application tile in the launcher portal.
/// Can be a built-in app (myWork, myForecast, myFacilities) or an external link.
/// Supports tenant-wide and user-specific tiles.
/// </summary>
public class AppTile : BaseEntity
{
    /// <summary>
    /// Tenant ID for tenant-wide tiles. Null for system-wide built-in tiles.
    /// </summary>
    public Guid? TenantId { get; set; }

    /// <summary>
    /// User ID for personal tiles. Null for tenant-wide or system tiles.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Display name of the tile
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Short description shown under the tile name
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Icon name (for built-in icons) or URL to custom icon
    /// </summary>
    public string Icon { get; set; } = "link";

    /// <summary>
    /// Background color for the tile (hex color code)
    /// </summary>
    public string BackgroundColor { get; set; } = "#6366f1";

    /// <summary>
    /// Text color for the tile (hex color code)
    /// </summary>
    public string TextColor { get; set; } = "#ffffff";

    /// <summary>
    /// URL to navigate to. For internal apps, use relative paths. For external, use full URL.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Whether the link should open in a new tab
    /// </summary>
    public bool OpenInNewTab { get; set; } = true;

    /// <summary>
    /// Display order of the tile
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Whether this is a built-in system tile (myWork, myForecast, myFacilities)
    /// </summary>
    public bool IsBuiltIn { get; set; }

    /// <summary>
    /// Whether the tile is active/visible
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Category for grouping tiles (e.g., "Internal Apps", "External Tools", "Resources")
    /// </summary>
    public string? Category { get; set; }

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Tenant? Tenant { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public virtual User? User { get; set; }
}
