namespace MyScheduling.Core.Entities;

/// <summary>
/// Categories for non-labor costs
/// </summary>
public enum NonLaborCostCategory
{
    Travel = 0,
    Meals = 1,
    Equipment = 2,
    Supplies = 3,
    Subcontracts = 4,
    Training = 5,
    Communications = 6,
    Facilities = 7,
    Other = 99
}

/// <summary>
/// Configurable non-labor cost types for a tenant
/// </summary>
public class NonLaborCostType : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public NonLaborCostCategory Category { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>
/// Non-labor cost forecast for a project by month
/// </summary>
public class NonLaborForecast : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Guid? WbsElementId { get; set; }
    public Guid NonLaborCostTypeId { get; set; }
    public Guid? ForecastVersionId { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public decimal ForecastedAmount { get; set; }
    public string? Notes { get; set; }

    // Workflow (same as labor forecasts)
    public ForecastStatus Status { get; set; } = ForecastStatus.Draft;
    public Guid? SubmittedByUserId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual WbsElement? WbsElement { get; set; }
    public virtual NonLaborCostType NonLaborCostType { get; set; } = null!;
    public virtual ForecastVersion? ForecastVersion { get; set; }
    public virtual User? SubmittedByUser { get; set; }
    public virtual User? ApprovedByUser { get; set; }
}

/// <summary>
/// Non-labor budget line item for a project budget
/// </summary>
public class NonLaborBudgetLine : TenantEntity
{
    public Guid ProjectBudgetId { get; set; }
    public Guid NonLaborCostTypeId { get; set; }
    public Guid? WbsElementId { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public decimal BudgetedAmount { get; set; }

    // Navigation properties
    public virtual ProjectBudget ProjectBudget { get; set; } = null!;
    public virtual NonLaborCostType NonLaborCostType { get; set; } = null!;
    public virtual WbsElement? WbsElement { get; set; }
}

/// <summary>
/// Actual non-labor costs from ERP or manual entry
/// </summary>
public class ActualNonLaborCost : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Guid NonLaborCostTypeId { get; set; }
    public Guid? WbsElementId { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public decimal ActualAmount { get; set; }
    public ActualHoursSource Source { get; set; }

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual NonLaborCostType NonLaborCostType { get; set; } = null!;
    public virtual WbsElement? WbsElement { get; set; }
}
