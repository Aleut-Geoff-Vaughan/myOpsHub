namespace MyScheduling.Core.Entities;

/// <summary>
/// Source of the cost rate entry
/// </summary>
public enum CostRateSource
{
    ManualEntry = 0,
    CsvImport = 1,
    ExcelImport = 2,
    BulkAdjustment = 3
}

/// <summary>
/// Status of a cost rate import batch
/// </summary>
public enum CostRateImportStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    CompletedWithErrors = 3,
    Failed = 4
}

/// <summary>
/// Employee loaded cost rate with effective dating for scheduling raises
/// </summary>
public class EmployeeCostRate : TenantEntity
{
    public Guid UserId { get; set; }

    /// <summary>
    /// Date this rate becomes effective
    /// </summary>
    public DateOnly EffectiveDate { get; set; }

    /// <summary>
    /// Optional end date - null means current/future rate
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// Fully loaded hourly cost rate (calculated externally)
    /// </summary>
    public decimal LoadedCostRate { get; set; }

    public string? Notes { get; set; }
    public CostRateSource Source { get; set; } = CostRateSource.ManualEntry;
    public Guid? ImportBatchId { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual CostRateImportBatch? ImportBatch { get; set; }
}

/// <summary>
/// Tracks bulk import operations for cost rates
/// </summary>
public class CostRateImportBatch : TenantEntity
{
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty; // "csv" or "xlsx"
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public CostRateImportStatus Status { get; set; } = CostRateImportStatus.Pending;
    public string? ErrorDetails { get; set; } // JSON array of errors
    public DateTime? CompletedAt { get; set; }

    // Import tracking
    public Guid? ImportedByUserId { get; set; }
    public DateTime? ImportedAt { get; set; }

    // Navigation properties
    public virtual User? ImportedByUser { get; set; }
    public virtual ICollection<EmployeeCostRate> CostRates { get; set; } = new List<EmployeeCostRate>();
}
