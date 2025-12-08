using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;
using System.Text;
using System.Globalization;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/cost-rates")]
public class CostRatesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<CostRatesController> _logger;

    public CostRatesController(MySchedulingDbContext context, ILogger<CostRatesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Employee Cost Rates

    /// <summary>
    /// Get all employee cost rates for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<EmployeeCostRateDto>>> GetCostRates(
        [FromQuery] Guid? userId,
        [FromQuery] bool includeInactive = false,
        [FromQuery] DateOnly? asOfDate = null)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.EmployeeCostRates
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.TenantId == tenantId.Value);

            if (userId.HasValue)
                query = query.Where(r => r.UserId == userId.Value);

            if (!includeInactive)
            {
                var refDate = asOfDate ?? DateOnly.FromDateTime(DateTime.Today);
                query = query.Where(r =>
                    r.EffectiveDate <= refDate &&
                    (!r.EndDate.HasValue || r.EndDate.Value >= refDate));
            }

            var rates = await query
                .OrderBy(r => r.User!.DisplayName)
                .ThenByDescending(r => r.EffectiveDate)
                .Select(r => new EmployeeCostRateDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    UserDisplayName = r.User != null ? r.User.DisplayName : null,
                    UserEmail = r.User != null ? r.User.Email : null,
                    EffectiveDate = r.EffectiveDate,
                    EndDate = r.EndDate,
                    LoadedCostRate = r.LoadedCostRate,
                    Notes = r.Notes,
                    Source = r.Source,
                    ImportBatchId = r.ImportBatchId,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(rates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employee cost rates");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get the effective cost rate for a user at a specific date
    /// </summary>
    [HttpGet("user/{userId}/effective")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public async Task<ActionResult<EmployeeCostRateDto>> GetEffectiveRate(
        Guid userId,
        [FromQuery] DateOnly? asOfDate = null)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var refDate = asOfDate ?? DateOnly.FromDateTime(DateTime.Today);

            var rate = await _context.EmployeeCostRates
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.TenantId == tenantId.Value && r.UserId == userId)
                .Where(r => r.EffectiveDate <= refDate)
                .Where(r => !r.EndDate.HasValue || r.EndDate.Value >= refDate)
                .OrderByDescending(r => r.EffectiveDate)
                .FirstOrDefaultAsync();

            if (rate == null)
                return NotFound(new { message = "No effective rate found for this user" });

            return Ok(new EmployeeCostRateDto
            {
                Id = rate.Id,
                UserId = rate.UserId,
                UserDisplayName = rate.User?.DisplayName,
                UserEmail = rate.User?.Email,
                EffectiveDate = rate.EffectiveDate,
                EndDate = rate.EndDate,
                LoadedCostRate = rate.LoadedCostRate,
                Notes = rate.Notes,
                Source = rate.Source,
                ImportBatchId = rate.ImportBatchId,
                CreatedAt = rate.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting effective rate for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get cost rate history for a user
    /// </summary>
    [HttpGet("user/{userId}/history")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<EmployeeCostRateDto>>> GetRateHistory(Guid userId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var rates = await _context.EmployeeCostRates
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.TenantId == tenantId.Value && r.UserId == userId)
                .OrderByDescending(r => r.EffectiveDate)
                .Select(r => new EmployeeCostRateDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    UserDisplayName = r.User != null ? r.User.DisplayName : null,
                    UserEmail = r.User != null ? r.User.Email : null,
                    EffectiveDate = r.EffectiveDate,
                    EndDate = r.EndDate,
                    LoadedCostRate = r.LoadedCostRate,
                    Notes = r.Notes,
                    Source = r.Source,
                    ImportBatchId = r.ImportBatchId,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(rates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rate history for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new cost rate
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Create)]
    public async Task<ActionResult<EmployeeCostRateDto>> CreateCostRate([FromBody] CreateCostRateRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var currentUserId = GetCurrentUserIdNullable();

            // Validate user exists
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
                return BadRequest(new { message = "User not found" });

            // Auto-close any overlapping rate
            var existingRate = await _context.EmployeeCostRates
                .Where(r => r.TenantId == tenantId.Value && r.UserId == request.UserId)
                .Where(r => !r.EndDate.HasValue || r.EndDate >= request.EffectiveDate)
                .Where(r => r.EffectiveDate < request.EffectiveDate)
                .OrderByDescending(r => r.EffectiveDate)
                .FirstOrDefaultAsync();

            if (existingRate != null && !existingRate.EndDate.HasValue)
            {
                existingRate.EndDate = request.EffectiveDate.AddDays(-1);
                existingRate.UpdatedAt = DateTime.UtcNow;
            }

            var rate = new EmployeeCostRate
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                UserId = request.UserId,
                EffectiveDate = request.EffectiveDate,
                EndDate = request.EndDate,
                LoadedCostRate = request.LoadedCostRate,
                Notes = request.Notes,
                Source = CostRateSource.ManualEntry,
                CreatedAt = DateTime.UtcNow
            };

            _context.EmployeeCostRates.Add(rate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEffectiveRate), new { userId = rate.UserId }, new EmployeeCostRateDto
            {
                Id = rate.Id,
                UserId = rate.UserId,
                UserDisplayName = user.DisplayName,
                UserEmail = user.Email,
                EffectiveDate = rate.EffectiveDate,
                EndDate = rate.EndDate,
                LoadedCostRate = rate.LoadedCostRate,
                Notes = rate.Notes,
                Source = rate.Source,
                CreatedAt = rate.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cost rate");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a cost rate
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateCostRate(Guid id, [FromBody] UpdateCostRateRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var rate = await _context.EmployeeCostRates
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);

            if (rate == null)
                return NotFound(new { message = "Cost rate not found" });

            if (request.EffectiveDate.HasValue) rate.EffectiveDate = request.EffectiveDate.Value;
            if (request.EndDate.HasValue) rate.EndDate = request.EndDate;
            if (request.LoadedCostRate.HasValue) rate.LoadedCostRate = request.LoadedCostRate.Value;
            if (request.Notes != null) rate.Notes = request.Notes;

            rate.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cost rate {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a cost rate
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteCostRate(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var rate = await _context.EmployeeCostRates
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);

            if (rate == null)
                return NotFound(new { message = "Cost rate not found" });

            _context.EmployeeCostRates.Remove(rate);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cost rate {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Import/Export

    /// <summary>
    /// Export cost rates to CSV
    /// </summary>
    [HttpGet("export")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Export)]
    public async Task<ActionResult> ExportCostRates([FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.EmployeeCostRates
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.TenantId == tenantId.Value);

            if (!includeInactive)
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                query = query.Where(r =>
                    r.EffectiveDate <= today &&
                    (!r.EndDate.HasValue || r.EndDate.Value >= today));
            }

            var rates = await query
                .OrderBy(r => r.User!.Email)
                .ThenByDescending(r => r.EffectiveDate)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Email,DisplayName,EffectiveDate,EndDate,LoadedCostRate,Notes");

            foreach (var rate in rates)
            {
                var endDate = rate.EndDate.HasValue ? rate.EndDate.Value.ToString("yyyy-MM-dd") : "";
                var notes = EscapeCsvField(rate.Notes ?? "");
                csv.AppendLine($"{rate.User?.Email},{EscapeCsvField(rate.User?.DisplayName ?? "")},{rate.EffectiveDate:yyyy-MM-dd},{endDate},{rate.LoadedCostRate:F2},{notes}");
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"cost-rates-{DateTime.Now:yyyy-MM-dd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting cost rates");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Import cost rates from CSV
    /// </summary>
    [HttpPost("import")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Import)]
    public async Task<ActionResult<ImportResultDto>> ImportCostRates(IFormFile file)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var currentUserId = GetCurrentUserIdNullable();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // Validate file type
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".csv")
                return BadRequest(new { message = "Only CSV files are supported" });

            // Create import batch
            var batch = new CostRateImportBatch
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                FileName = file.FileName,
                FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
                ImportedByUserId = currentUserId,
                ImportedAt = DateTime.UtcNow,
                Status = CostRateImportStatus.Processing,
                CreatedAt = DateTime.UtcNow
            };

            _context.CostRateImportBatches.Add(batch);

            var result = new ImportResultDto
            {
                BatchId = batch.Id,
                FileName = file.FileName
            };

            using var reader = new StreamReader(file.OpenReadStream());
            var lineNumber = 0;
            var isHeader = true;

            // Get all users for email lookup
            var users = await _context.Users
                .Where(u => u.TenantMemberships.Any(tm => tm.TenantId == tenantId.Value))
                .ToDictionaryAsync(u => u.Email.ToLower(), u => u);

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                lineNumber++;

                if (string.IsNullOrWhiteSpace(line)) continue;

                if (isHeader)
                {
                    isHeader = false;
                    continue;
                }

                try
                {
                    var fields = ParseCsvLine(line);
                    if (fields.Length < 5)
                    {
                        result.Errors.Add($"Line {lineNumber}: Invalid format - expected at least 5 columns");
                        result.FailedCount++;
                        continue;
                    }

                    var email = fields[0].Trim().ToLower();
                    if (!users.TryGetValue(email, out var user))
                    {
                        result.Errors.Add($"Line {lineNumber}: User not found - {email}");
                        result.FailedCount++;
                        continue;
                    }

                    if (!DateOnly.TryParse(fields[2].Trim(), out var effectiveDate))
                    {
                        result.Errors.Add($"Line {lineNumber}: Invalid effective date - {fields[2]}");
                        result.FailedCount++;
                        continue;
                    }

                    DateOnly? endDate = null;
                    if (!string.IsNullOrWhiteSpace(fields[3]) && DateOnly.TryParse(fields[3].Trim(), out var parsedEndDate))
                    {
                        endDate = parsedEndDate;
                    }

                    if (!decimal.TryParse(fields[4].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var loadedCostRate))
                    {
                        result.Errors.Add($"Line {lineNumber}: Invalid cost rate - {fields[4]}");
                        result.FailedCount++;
                        continue;
                    }

                    var notes = fields.Length > 5 ? fields[5].Trim() : null;

                    // Create rate
                    var rate = new EmployeeCostRate
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId.Value,
                        UserId = user.Id,
                        EffectiveDate = effectiveDate,
                        EndDate = endDate,
                        LoadedCostRate = loadedCostRate,
                        Notes = notes,
                        Source = CostRateSource.CsvImport,
                        ImportBatchId = batch.Id,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.EmployeeCostRates.Add(rate);
                    result.SuccessCount++;
                }
                catch (Exception lineEx)
                {
                    result.Errors.Add($"Line {lineNumber}: {lineEx.Message}");
                    result.FailedCount++;
                }
            }

            batch.TotalRecords = result.SuccessCount + result.FailedCount;
            batch.SuccessCount = result.SuccessCount;
            batch.ErrorCount = result.FailedCount;
            batch.ErrorDetails = result.Errors.Count > 0 ? string.Join("\n", result.Errors.Take(50)) : null;
            batch.Status = result.FailedCount > 0 ? CostRateImportStatus.CompletedWithErrors : CostRateImportStatus.Completed;
            batch.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing cost rates");
            return StatusCode(500, new { message = "An error occurred during import" });
        }
    }

    /// <summary>
    /// Get import history
    /// </summary>
    [HttpGet("import-history")]
    [RequiresPermission(Resource = "EmployeeCostRate", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<CostRateImportBatch>>> GetImportHistory()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var batches = await _context.CostRateImportBatches
                .AsNoTracking()
                .Include(b => b.ImportedByUser)
                .Where(b => b.TenantId == tenantId.Value)
                .OrderByDescending(b => b.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(batches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting import history");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Helpers

    private Guid? GetCurrentTenantId()
    {
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            var userTenantIds = User.FindAll("TenantId")
                .Select(c => Guid.TryParse(c.Value, out var tid) ? tid : Guid.Empty)
                .Where(id => id != Guid.Empty)
                .ToList();

            if (userTenantIds.Contains(parsedHeaderTenantId))
                return parsedHeaderTenantId;
        }

        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var parsedTenantId))
            return parsedTenantId;

        return null;
    }

    private Guid? GetCurrentUserIdNullable()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;

        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            return userId;

        return null;
    }

    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field)) return "";
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }

    private static string[] ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                fields.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        fields.Add(current.ToString());
        return fields.ToArray();
    }

    #endregion
}

#region DTOs

public class EmployeeCostRateDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public string? UserEmail { get; set; }
    public DateOnly EffectiveDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal LoadedCostRate { get; set; }
    public string? Notes { get; set; }
    public CostRateSource Source { get; set; }
    public Guid? ImportBatchId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCostRateRequest
{
    public Guid UserId { get; set; }
    public DateOnly EffectiveDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal LoadedCostRate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateCostRateRequest
{
    public DateOnly? EffectiveDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal? LoadedCostRate { get; set; }
    public string? Notes { get; set; }
}

public class ImportResultDto
{
    public Guid BatchId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

#endregion
