using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/picklists")]
public class SalesPicklistsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesPicklistsController> _logger;

    public SalesPicklistsController(MySchedulingDbContext context, ILogger<SalesPicklistsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all picklist definitions for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<SalesPicklistDefinition>>> GetPicklists([FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.SalesPicklistDefinitions
                .AsNoTracking()
                .Include(p => p.Values.Where(v => includeInactive || v.IsActive).OrderBy(v => v.SortOrder))
                .Where(p => p.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(p => p.IsActive);

            var picklists = await query
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.DisplayLabel)
                .ToListAsync();

            return Ok(picklists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting picklists");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific picklist by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Read)]
    public async Task<ActionResult<SalesPicklistDefinition>> GetPicklist(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var picklist = await _context.SalesPicklistDefinitions
                .Include(p => p.Values.OrderBy(v => v.SortOrder))
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId.Value);

            if (picklist == null)
                return NotFound(new { message = "Picklist not found" });

            return Ok(picklist);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting picklist {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific picklist by name (e.g., "AcquisitionType")
    /// </summary>
    [HttpGet("by-name/{name}")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Read)]
    public async Task<ActionResult<SalesPicklistDefinition>> GetPicklistByName(string name)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var picklist = await _context.SalesPicklistDefinitions
                .Include(p => p.Values.Where(v => v.IsActive).OrderBy(v => v.SortOrder))
                .FirstOrDefaultAsync(p => p.PicklistName == name && p.TenantId == tenantId.Value && p.IsActive);

            if (picklist == null)
                return NotFound(new { message = "Picklist not found" });

            return Ok(picklist);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting picklist by name {Name}", name);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get only the values for a picklist (for dropdown population)
    /// </summary>
    [HttpGet("by-name/{name}/values")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<SalesPicklistValue>>> GetPicklistValues(string name)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var picklist = await _context.SalesPicklistDefinitions
                .Include(p => p.Values.Where(v => v.IsActive).OrderBy(v => v.SortOrder))
                .FirstOrDefaultAsync(p => p.PicklistName == name && p.TenantId == tenantId.Value && p.IsActive);

            if (picklist == null)
                return NotFound(new { message = "Picklist not found" });

            return Ok(picklist.Values.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting picklist values for {Name}", name);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new picklist definition
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Create)]
    public async Task<ActionResult<SalesPicklistDefinition>> CreatePicklist([FromBody] CreatePicklistRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Check if name already exists
            var existing = await _context.SalesPicklistDefinitions
                .AnyAsync(p => p.PicklistName == request.PicklistName && p.TenantId == tenantId.Value);

            if (existing)
                return BadRequest(new { message = $"Picklist '{request.PicklistName}' already exists" });

            // Get max sort order
            var maxSort = await _context.SalesPicklistDefinitions
                .Where(p => p.TenantId == tenantId.Value)
                .MaxAsync(p => (int?)p.SortOrder) ?? 0;

            var picklist = new SalesPicklistDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                PicklistName = request.PicklistName,
                DisplayLabel = request.DisplayLabel,
                Description = request.Description,
                EntityType = request.EntityType,
                FieldName = request.FieldName,
                IsSystemPicklist = request.IsSystemPicklist,
                AllowMultiple = request.AllowMultiple,
                SortOrder = request.SortOrder ?? maxSort + 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesPicklistDefinitions.Add(picklist);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPicklist), new { id = picklist.Id }, picklist);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating picklist");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a picklist definition
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdatePicklist(Guid id, [FromBody] UpdatePicklistRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var picklist = await _context.SalesPicklistDefinitions
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId.Value);

            if (picklist == null)
                return NotFound(new { message = "Picklist not found" });

            if (request.DisplayLabel != null) picklist.DisplayLabel = request.DisplayLabel;
            if (request.Description != null) picklist.Description = request.Description;
            if (request.EntityType != null) picklist.EntityType = request.EntityType;
            if (request.FieldName != null) picklist.FieldName = request.FieldName;
            if (request.AllowMultiple.HasValue) picklist.AllowMultiple = request.AllowMultiple.Value;
            if (request.SortOrder.HasValue) picklist.SortOrder = request.SortOrder.Value;
            if (request.IsActive.HasValue) picklist.IsActive = request.IsActive.Value;

            picklist.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating picklist {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a picklist definition (only if not a system picklist)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeletePicklist(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var picklist = await _context.SalesPicklistDefinitions
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId.Value);

            if (picklist == null)
                return NotFound(new { message = "Picklist not found" });

            if (picklist.IsSystemPicklist)
                return BadRequest(new { message = "Cannot delete a system picklist. You can only manage its values." });

            // Soft delete
            picklist.IsActive = false;
            picklist.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting picklist {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // ===== Picklist Value Endpoints =====

    /// <summary>
    /// Add a value to a picklist
    /// </summary>
    [HttpPost("{picklistId}/values")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Update)]
    public async Task<ActionResult<SalesPicklistValue>> AddPicklistValue(Guid picklistId, [FromBody] CreatePicklistValueRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var picklist = await _context.SalesPicklistDefinitions
                .Include(p => p.Values)
                .FirstOrDefaultAsync(p => p.Id == picklistId && p.TenantId == tenantId.Value);

            if (picklist == null)
                return NotFound(new { message = "Picklist not found" });

            // Check if value already exists
            if (picklist.Values.Any(v => v.Value == request.Value))
                return BadRequest(new { message = $"Value '{request.Value}' already exists in this picklist" });

            // Get max sort order
            var maxSort = picklist.Values.Any() ? picklist.Values.Max(v => v.SortOrder) : 0;

            var value = new SalesPicklistValue
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                PicklistDefinitionId = picklistId,
                Value = request.Value,
                Label = request.Label ?? request.Value,
                Color = request.Color,
                Description = request.Description,
                IsDefault = request.IsDefault,
                SortOrder = request.SortOrder ?? maxSort + 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // If this is the default, unset any other defaults
            if (value.IsDefault)
            {
                foreach (var existingValue in picklist.Values.Where(v => v.IsDefault))
                {
                    existingValue.IsDefault = false;
                }
            }

            _context.SalesPicklistValues.Add(value);
            await _context.SaveChangesAsync();

            return Ok(value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding picklist value to {PicklistId}", picklistId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a picklist value
    /// </summary>
    [HttpPut("{picklistId}/values/{valueId}")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdatePicklistValue(Guid picklistId, Guid valueId, [FromBody] UpdatePicklistValueRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var value = await _context.SalesPicklistValues
                .FirstOrDefaultAsync(v => v.Id == valueId && v.PicklistDefinitionId == picklistId && v.TenantId == tenantId.Value);

            if (value == null)
                return NotFound(new { message = "Picklist value not found" });

            if (request.Label != null) value.Label = request.Label;
            if (request.Color != null) value.Color = request.Color;
            if (request.Description != null) value.Description = request.Description;
            if (request.SortOrder.HasValue) value.SortOrder = request.SortOrder.Value;
            if (request.IsActive.HasValue) value.IsActive = request.IsActive.Value;

            // Handle default flag
            if (request.IsDefault.HasValue && request.IsDefault.Value)
            {
                // Unset other defaults
                var otherDefaults = await _context.SalesPicklistValues
                    .Where(v => v.PicklistDefinitionId == picklistId && v.IsDefault && v.Id != valueId)
                    .ToListAsync();

                foreach (var other in otherDefaults)
                {
                    other.IsDefault = false;
                }
                value.IsDefault = true;
            }
            else if (request.IsDefault.HasValue)
            {
                value.IsDefault = false;
            }

            value.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating picklist value {ValueId}", valueId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reorder picklist values
    /// </summary>
    [HttpPut("{picklistId}/values/reorder")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Update)]
    public async Task<ActionResult> ReorderPicklistValues(Guid picklistId, [FromBody] List<Guid> valueIds)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var values = await _context.SalesPicklistValues
                .Where(v => v.PicklistDefinitionId == picklistId && v.TenantId == tenantId.Value && valueIds.Contains(v.Id))
                .ToListAsync();

            for (int i = 0; i < valueIds.Count; i++)
            {
                var value = values.FirstOrDefault(v => v.Id == valueIds[i]);
                if (value != null)
                {
                    value.SortOrder = i;
                    value.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering picklist values for {PicklistId}", picklistId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete (deactivate) a picklist value
    /// </summary>
    [HttpDelete("{picklistId}/values/{valueId}")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Update)]
    public async Task<ActionResult> DeletePicklistValue(Guid picklistId, Guid valueId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var value = await _context.SalesPicklistValues
                .FirstOrDefaultAsync(v => v.Id == valueId && v.PicklistDefinitionId == picklistId && v.TenantId == tenantId.Value);

            if (value == null)
                return NotFound(new { message = "Picklist value not found" });

            // Soft delete to preserve historical data
            value.IsActive = false;
            value.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting picklist value {ValueId}", valueId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Seed default picklists for a new tenant
    /// </summary>
    [HttpPost("seed-defaults")]
    [RequiresPermission(Resource = "SalesPicklist", Action = PermissionAction.Create)]
    public async Task<ActionResult> SeedDefaultPicklists()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Check if picklists already exist
            var existing = await _context.SalesPicklistDefinitions
                .AnyAsync(p => p.TenantId == tenantId.Value);

            if (existing)
                return BadRequest(new { message = "Picklists already exist for this tenant" });

            var picklists = new List<SalesPicklistDefinition>();

            // Acquisition Type
            var acquisitionType = new SalesPicklistDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                PicklistName = "AcquisitionType",
                DisplayLabel = "Acquisition Type",
                Description = "Federal acquisition type / set-aside category",
                EntityType = "Opportunity",
                FieldName = "AcquisitionType",
                IsSystemPicklist = true,
                AllowMultiple = false,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Values = new List<SalesPicklistValue>
                {
                    CreateValue(tenantId.Value, "8(a)", "8(a)", 1),
                    CreateValue(tenantId.Value, "SmallBusiness", "Small Business", 2),
                    CreateValue(tenantId.Value, "HubZoneSB", "HubZone SB", 3),
                    CreateValue(tenantId.Value, "SDVOSB", "SDVOSB", 4),
                    CreateValue(tenantId.Value, "WOSB", "WOSB", 5),
                    CreateValue(tenantId.Value, "EDWOSB", "EDWOSB", 6),
                    CreateValue(tenantId.Value, "MBE", "Minority Business Enterprise", 7),
                    CreateValue(tenantId.Value, "SDB", "Small Disadvantaged Business", 8),
                    CreateValue(tenantId.Value, "IEE", "Indian Economic Enterprise (IEE)", 9),
                    CreateValue(tenantId.Value, "Unrestricted", "Unrestricted", 10),
                    CreateValue(tenantId.Value, "TBD", "TBD", 11),
                }
            };
            picklists.Add(acquisitionType);

            // Contract Type
            var contractType = new SalesPicklistDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                PicklistName = "ContractType",
                DisplayLabel = "Contract Type",
                Description = "Type of contract pricing arrangement",
                EntityType = "Opportunity",
                FieldName = "ContractType",
                IsSystemPicklist = true,
                AllowMultiple = false,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Values = new List<SalesPicklistValue>
                {
                    CreateValue(tenantId.Value, "FFP", "Firm Fixed Price (FFP)", 1),
                    CreateValue(tenantId.Value, "T&M", "Time & Material (T&M)", 2),
                    CreateValue(tenantId.Value, "CostReimbursable", "Cost-Reimbursable", 3),
                    CreateValue(tenantId.Value, "CostPlusFee", "Cost Plus Fee", 4),
                    CreateValue(tenantId.Value, "CPFF", "Cost Plus Fixed Fee (CPFF)", 5),
                    CreateValue(tenantId.Value, "LaborHours", "Labor Hours", 6),
                    CreateValue(tenantId.Value, "SATOC", "Single Award IDIQ/SATOC", 7),
                    CreateValue(tenantId.Value, "MATOC", "Multi Award IDIQ/MATOC", 8),
                    CreateValue(tenantId.Value, "Hybrid", "Hybrid", 9),
                    CreateValue(tenantId.Value, "OTA", "Other Transaction Agreements (OTAs)", 10),
                    CreateValue(tenantId.Value, "TBD", "TBD", 11),
                }
            };
            picklists.Add(contractType);

            // Opportunity Status
            var oppStatus = new SalesPicklistDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                PicklistName = "OpportunityStatus",
                DisplayLabel = "Opportunity Status",
                Description = "Solicitation lifecycle status (separate from Stage)",
                EntityType = "Opportunity",
                FieldName = "OpportunityStatus",
                IsSystemPicklist = true,
                AllowMultiple = false,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Values = new List<SalesPicklistValue>
                {
                    CreateValue(tenantId.Value, "InitialProspect", "Initial Prospect/Forecast", 1),
                    CreateValue(tenantId.Value, "InitialCapture", "Initial Capture Planning", 2),
                    CreateValue(tenantId.Value, "MarketResearch", "Market Research/Sources Sought", 3),
                    CreateValue(tenantId.Value, "MarketResearchSubmitted", "(Submitted) Market Research/Sources Sought", 4),
                    CreateValue(tenantId.Value, "PreSolicitation", "Pre-Solicitation Notice Issued", 5),
                    CreateValue(tenantId.Value, "DraftRFP", "Draft RFP Issued (or in full Capture)", 6),
                    CreateValue(tenantId.Value, "FinalRFP", "Final RFP Issued", 7),
                    CreateValue(tenantId.Value, "ROM", "Rough Order of Magnitude (ROM)", 8),
                    CreateValue(tenantId.Value, "BAFO", "Best and Final Offer", 9),
                    CreateValue(tenantId.Value, "BAFOSubmitted", "(Submitted) Best and Final Offer", 10),
                    CreateValue(tenantId.Value, "ProposalSubmitted", "Proposal Submitted", 11),
                    CreateValue(tenantId.Value, "IndefiniteHold", "Indefinite Hold", 12),
                }
            };
            picklists.Add(oppStatus);

            // Portfolio
            var portfolio = new SalesPicklistDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                PicklistName = "Portfolio",
                DisplayLabel = "Portfolio",
                Description = "Business portfolio classification",
                EntityType = "Opportunity",
                FieldName = "Portfolio",
                IsSystemPicklist = true,
                AllowMultiple = false,
                SortOrder = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Values = new List<SalesPicklistValue>
                {
                    CreateValue(tenantId.Value, "Defense", "Defense", 1),
                    CreateValue(tenantId.Value, "NationalSecurity", "National Security", 2),
                    CreateValue(tenantId.Value, "Civilian", "Civilian", 3),
                    CreateValue(tenantId.Value, "SafetyCitizen", "Safety & Citizen Services", 4),
                }
            };
            picklists.Add(portfolio);

            _context.SalesPicklistDefinitions.AddRange(picklists);
            await _context.SaveChangesAsync();

            return Ok(picklists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding default picklists");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private SalesPicklistValue CreateValue(Guid tenantId, string value, string label, int sortOrder, string? color = null)
    {
        return new SalesPicklistValue
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Value = value,
            Label = label,
            SortOrder = sortOrder,
            Color = color,
            IsActive = true,
            IsDefault = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    #region Helper Methods

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

    #endregion
}

public class CreatePicklistRequest
{
    public required string PicklistName { get; set; }
    public required string DisplayLabel { get; set; }
    public string? Description { get; set; }
    public string? EntityType { get; set; }
    public string? FieldName { get; set; }
    public bool IsSystemPicklist { get; set; }
    public bool AllowMultiple { get; set; }
    public int? SortOrder { get; set; }
}

public class UpdatePicklistRequest
{
    public string? DisplayLabel { get; set; }
    public string? Description { get; set; }
    public string? EntityType { get; set; }
    public string? FieldName { get; set; }
    public bool? AllowMultiple { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class CreatePicklistValueRequest
{
    public required string Value { get; set; }
    public string? Label { get; set; }
    public string? Color { get; set; }
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public int? SortOrder { get; set; }
}

public class UpdatePicklistValueRequest
{
    public string? Label { get; set; }
    public string? Color { get; set; }
    public string? Description { get; set; }
    public bool? IsDefault { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}
