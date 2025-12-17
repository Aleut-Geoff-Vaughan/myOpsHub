using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/customfields")]
public class SalesCustomFieldsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesCustomFieldsController> _logger;

    public SalesCustomFieldsController(MySchedulingDbContext context, ILogger<SalesCustomFieldsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ===== Custom Field Definition Endpoints =====

    /// <summary>
    /// Get all custom field definitions for the tenant
    /// </summary>
    [HttpGet("definitions")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<CustomFieldDefinitionDto>>> GetFieldDefinitions(
        [FromQuery] string? entityType = null,
        [FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.SalesCustomFieldDefinitions
                .AsNoTracking()
                .Where(f => f.TenantId == tenantId.Value);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(f => f.EntityType == entityType);

            if (!includeInactive)
                query = query.Where(f => f.IsActive);

            var fields = await query
                .OrderBy(f => f.EntityType)
                .ThenBy(f => f.Section)
                .ThenBy(f => f.SortOrder)
                .Select(f => new CustomFieldDefinitionDto
                {
                    Id = f.Id,
                    EntityType = f.EntityType,
                    FieldName = f.FieldName,
                    DisplayLabel = f.DisplayLabel,
                    FieldType = f.FieldType,
                    PicklistOptions = f.PicklistOptions,
                    DefaultValue = f.DefaultValue,
                    IsRequired = f.IsRequired,
                    IsSearchable = f.IsSearchable,
                    IsVisibleInList = f.IsVisibleInList,
                    Section = f.Section,
                    HelpText = f.HelpText,
                    SortOrder = f.SortOrder,
                    IsActive = f.IsActive,
                    LookupEntityType = f.LookupEntityType
                })
                .ToListAsync();

            return Ok(fields);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom field definitions");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific custom field definition by ID
    /// </summary>
    [HttpGet("definitions/{id:guid}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Read)]
    public async Task<ActionResult<CustomFieldDefinitionDto>> GetFieldDefinition(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var field = await _context.SalesCustomFieldDefinitions
                .AsNoTracking()
                .Where(f => f.Id == id && f.TenantId == tenantId.Value)
                .Select(f => new CustomFieldDefinitionDto
                {
                    Id = f.Id,
                    EntityType = f.EntityType,
                    FieldName = f.FieldName,
                    DisplayLabel = f.DisplayLabel,
                    FieldType = f.FieldType,
                    PicklistOptions = f.PicklistOptions,
                    DefaultValue = f.DefaultValue,
                    IsRequired = f.IsRequired,
                    IsSearchable = f.IsSearchable,
                    IsVisibleInList = f.IsVisibleInList,
                    Section = f.Section,
                    HelpText = f.HelpText,
                    SortOrder = f.SortOrder,
                    IsActive = f.IsActive,
                    LookupEntityType = f.LookupEntityType
                })
                .FirstOrDefaultAsync();

            if (field == null)
                return NotFound(new { message = "Custom field definition not found" });

            return Ok(field);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom field definition {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new custom field definition
    /// </summary>
    [HttpPost("definitions")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Create)]
    public async Task<ActionResult<CustomFieldDefinitionDto>> CreateFieldDefinition([FromBody] CreateCustomFieldRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Validate field name is unique for this entity type
            var fieldNameExists = await _context.SalesCustomFieldDefinitions
                .AnyAsync(f => f.TenantId == tenantId.Value &&
                              f.EntityType == request.EntityType &&
                              f.FieldName == request.FieldName);

            if (fieldNameExists)
                return BadRequest(new { message = $"A field with name '{request.FieldName}' already exists for {request.EntityType}" });

            // Get max sort order for this section
            var maxSort = await _context.SalesCustomFieldDefinitions
                .Where(f => f.TenantId == tenantId.Value &&
                           f.EntityType == request.EntityType &&
                           f.Section == request.Section)
                .MaxAsync(f => (int?)f.SortOrder) ?? 0;

            var field = new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = request.EntityType,
                FieldName = request.FieldName,
                DisplayLabel = request.DisplayLabel,
                FieldType = request.FieldType,
                PicklistOptions = request.PicklistOptions,
                DefaultValue = request.DefaultValue,
                IsRequired = request.IsRequired,
                IsSearchable = request.IsSearchable,
                IsVisibleInList = request.IsVisibleInList,
                Section = request.Section,
                HelpText = request.HelpText,
                SortOrder = request.SortOrder ?? maxSort + 1,
                LookupEntityType = request.LookupEntityType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesCustomFieldDefinitions.Add(field);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFieldDefinition), new { id = field.Id }, new CustomFieldDefinitionDto
            {
                Id = field.Id,
                EntityType = field.EntityType,
                FieldName = field.FieldName,
                DisplayLabel = field.DisplayLabel,
                FieldType = field.FieldType,
                PicklistOptions = field.PicklistOptions,
                DefaultValue = field.DefaultValue,
                IsRequired = field.IsRequired,
                IsSearchable = field.IsSearchable,
                IsVisibleInList = field.IsVisibleInList,
                Section = field.Section,
                HelpText = field.HelpText,
                SortOrder = field.SortOrder,
                IsActive = field.IsActive,
                LookupEntityType = field.LookupEntityType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating custom field definition");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a custom field definition
    /// </summary>
    [HttpPut("definitions/{id:guid}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateFieldDefinition(Guid id, [FromBody] UpdateCustomFieldRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var field = await _context.SalesCustomFieldDefinitions
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (field == null)
                return NotFound(new { message = "Custom field definition not found" });

            // Update fields
            if (request.DisplayLabel != null) field.DisplayLabel = request.DisplayLabel;
            if (request.PicklistOptions != null) field.PicklistOptions = request.PicklistOptions;
            if (request.DefaultValue != null) field.DefaultValue = request.DefaultValue;
            if (request.IsRequired.HasValue) field.IsRequired = request.IsRequired.Value;
            if (request.IsSearchable.HasValue) field.IsSearchable = request.IsSearchable.Value;
            if (request.IsVisibleInList.HasValue) field.IsVisibleInList = request.IsVisibleInList.Value;
            if (request.Section != null) field.Section = request.Section;
            if (request.HelpText != null) field.HelpText = request.HelpText;
            if (request.SortOrder.HasValue) field.SortOrder = request.SortOrder.Value;
            if (request.IsActive.HasValue) field.IsActive = request.IsActive.Value;
            if (request.LookupEntityType != null) field.LookupEntityType = request.LookupEntityType;

            field.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating custom field definition {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete (deactivate) a custom field definition
    /// </summary>
    [HttpDelete("definitions/{id:guid}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteFieldDefinition(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var field = await _context.SalesCustomFieldDefinitions
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (field == null)
                return NotFound(new { message = "Custom field definition not found" });

            // Soft delete
            field.IsActive = false;
            field.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting custom field definition {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reorder custom fields within a section
    /// </summary>
    [HttpPut("definitions/reorder")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Update)]
    public async Task<ActionResult> ReorderFieldDefinitions([FromBody] List<Guid> fieldIds)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var fields = await _context.SalesCustomFieldDefinitions
                .Where(f => f.TenantId == tenantId.Value && fieldIds.Contains(f.Id))
                .ToListAsync();

            for (int i = 0; i < fieldIds.Count; i++)
            {
                var field = fields.FirstOrDefault(f => f.Id == fieldIds[i]);
                if (field != null)
                {
                    field.SortOrder = i;
                    field.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering custom field definitions");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // ===== Custom Field Value Endpoints =====

    /// <summary>
    /// Get all custom field values for an entity
    /// </summary>
    [HttpGet("values/{entityType}/{entityId:guid}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<CustomFieldValueDto>>> GetFieldValues(string entityType, Guid entityId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var values = await _context.SalesCustomFieldValues
                .AsNoTracking()
                .Include(v => v.FieldDefinition)
                .Where(v => v.TenantId == tenantId.Value &&
                           v.EntityType == entityType &&
                           v.EntityId == entityId)
                .Select(v => new CustomFieldValueDto
                {
                    Id = v.Id,
                    FieldDefinitionId = v.FieldDefinitionId,
                    FieldName = v.FieldDefinition.FieldName,
                    DisplayLabel = v.FieldDefinition.DisplayLabel,
                    FieldType = v.FieldDefinition.FieldType,
                    EntityType = v.EntityType,
                    EntityId = v.EntityId,
                    TextValue = v.TextValue,
                    NumberValue = v.NumberValue,
                    DateValue = v.DateValue,
                    BoolValue = v.BoolValue,
                    PicklistValue = v.PicklistValue,
                    LookupValue = v.LookupValue
                })
                .ToListAsync();

            return Ok(values);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom field values for {EntityType}/{EntityId}", entityType, entityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Set/update custom field values for an entity
    /// </summary>
    [HttpPut("values/{entityType}/{entityId:guid}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Update)]
    public async Task<ActionResult> SetFieldValues(string entityType, Guid entityId, [FromBody] List<SetCustomFieldValueRequest> values)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Get existing values for this entity
            var existingValues = await _context.SalesCustomFieldValues
                .Where(v => v.TenantId == tenantId.Value &&
                           v.EntityType == entityType &&
                           v.EntityId == entityId)
                .ToListAsync();

            foreach (var valueRequest in values)
            {
                // Validate the field definition exists
                var fieldDef = await _context.SalesCustomFieldDefinitions
                    .FirstOrDefaultAsync(f => f.Id == valueRequest.FieldDefinitionId && f.TenantId == tenantId.Value);

                if (fieldDef == null)
                {
                    _logger.LogWarning("Custom field definition {Id} not found", valueRequest.FieldDefinitionId);
                    continue;
                }

                var existingValue = existingValues.FirstOrDefault(v => v.FieldDefinitionId == valueRequest.FieldDefinitionId);

                if (existingValue != null)
                {
                    // Update existing value
                    existingValue.TextValue = valueRequest.TextValue;
                    existingValue.NumberValue = valueRequest.NumberValue;
                    existingValue.DateValue = valueRequest.DateValue;
                    existingValue.BoolValue = valueRequest.BoolValue;
                    existingValue.PicklistValue = valueRequest.PicklistValue;
                    existingValue.LookupValue = valueRequest.LookupValue;
                    existingValue.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create new value
                    var newValue = new SalesCustomFieldValue
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId.Value,
                        FieldDefinitionId = valueRequest.FieldDefinitionId,
                        EntityType = entityType,
                        EntityId = entityId,
                        TextValue = valueRequest.TextValue,
                        NumberValue = valueRequest.NumberValue,
                        DateValue = valueRequest.DateValue,
                        BoolValue = valueRequest.BoolValue,
                        PicklistValue = valueRequest.PicklistValue,
                        LookupValue = valueRequest.LookupValue,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.SalesCustomFieldValues.Add(newValue);
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting custom field values for {EntityType}/{EntityId}", entityType, entityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a custom field value
    /// </summary>
    [HttpDelete("values/{id:guid}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteFieldValue(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var value = await _context.SalesCustomFieldValues
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId.Value);

            if (value == null)
                return NotFound(new { message = "Custom field value not found" });

            _context.SalesCustomFieldValues.Remove(value);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting custom field value {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Seed default custom field definitions for the tenant
    /// </summary>
    [HttpPost("definitions/seed")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Create)]
    public async Task<ActionResult> SeedDefaultFieldDefinitions()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Check if any custom fields already exist for this tenant
            var existingCount = await _context.SalesCustomFieldDefinitions
                .CountAsync(f => f.TenantId == tenantId.Value);

            if (existingCount > 0)
                return BadRequest(new { message = $"Custom fields already exist ({existingCount} fields). Delete existing fields first if you want to re-seed." });

            var redYellowGreenOptions = "[\"Red\", \"Yellow\", \"Green\"]";
            var complexityOptions = "[\"Simple\", \"Moderate\", \"Complex\"]";
            var now = DateTime.UtcNow;
            var sortOrder = 0;

            var fieldsToCreate = new List<SalesCustomFieldDefinition>();

            // ===== Deal Qualification Section =====
            var dealQualificationFields = new[]
            {
                ("client_intent_to_buy", "Client Intent to Buy", "Assessment of client's readiness and intent to purchase"),
                ("customer_insight", "Customer Insight", "Understanding of customer needs, challenges, and requirements"),
                ("relationships", "Relationships", "Strength of relationships with key decision makers"),
                ("aleut_track_record", "Aleut Track Record/Reputation", "Our reputation and past performance with this customer"),
                ("value_proposition", "Value Proposition", "Strength of our value proposition for this opportunity"),
                ("competitive_positioning", "Competitive Positioning", "Our position relative to competitors"),
                ("solution", "Solution", "Quality and fit of our proposed solution"),
                ("pricing_profitability", "Pricing / Profitability", "Assessment of pricing competitiveness and profit margins"),
                ("teaming", "Teaming", "Quality and completeness of teaming arrangements"),
                ("orals_site_visit", "Orals / Site Visit", "Readiness for orals presentations or site visits"),
                ("size_type_of_work", "Size/Type of Work", "Fit with our capabilities and capacity"),
                ("leverages_assets", "Leverages Assets", "Ability to leverage existing assets, contracts, or capabilities"),
                ("delivery_skills", "Delivery Skills / Key Personnel", "Availability of key personnel and delivery capabilities"),
                ("risk", "Risk", "Overall risk assessment for this opportunity")
            };

            foreach (var (fieldName, displayLabel, helpText) in dealQualificationFields)
            {
                // Picklist field
                fieldsToCreate.Add(new SalesCustomFieldDefinition
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    EntityType = "Opportunity",
                    FieldName = fieldName,
                    DisplayLabel = displayLabel,
                    FieldType = SalesCustomFieldType.Picklist,
                    PicklistOptions = redYellowGreenOptions,
                    Section = "Deal Qualification",
                    HelpText = helpText,
                    SortOrder = sortOrder++,
                    IsActive = true,
                    CreatedAt = now
                });

                // Notes field
                fieldsToCreate.Add(new SalesCustomFieldDefinition
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    EntityType = "Opportunity",
                    FieldName = $"{fieldName}_notes",
                    DisplayLabel = $"{displayLabel} Notes",
                    FieldType = SalesCustomFieldType.TextArea,
                    Section = "Deal Qualification",
                    HelpText = $"Additional notes for {displayLabel}",
                    SortOrder = sortOrder++,
                    IsActive = true,
                    CreatedAt = now
                });
            }

            // ===== Proposal Response Section =====
            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "proposal_manager",
                DisplayLabel = "Proposal Manager",
                FieldType = SalesCustomFieldType.Lookup,
                LookupEntityType = "User",
                Section = "Proposal Response",
                HelpText = "Person responsible for managing the proposal",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "pricing_estimation",
                DisplayLabel = "Pricing / Estimation",
                FieldType = SalesCustomFieldType.Text,
                Section = "Proposal Response",
                HelpText = "Pricing and estimation approach",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "proposal_tech_volume",
                DisplayLabel = "Proposal Tech Volume",
                FieldType = SalesCustomFieldType.Picklist,
                PicklistOptions = complexityOptions,
                Section = "Proposal Response",
                HelpText = "Complexity of the technical volume",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "proposal_pricing",
                DisplayLabel = "Proposal Pricing",
                FieldType = SalesCustomFieldType.Picklist,
                PicklistOptions = complexityOptions,
                Section = "Proposal Response",
                HelpText = "Complexity of the pricing volume",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "proposal_comments",
                DisplayLabel = "Proposal Comments",
                FieldType = SalesCustomFieldType.TextArea,
                Section = "Proposal Response",
                HelpText = "Additional comments about the proposal",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "key_personnel",
                DisplayLabel = "Key Personnel",
                FieldType = SalesCustomFieldType.TextArea,
                Section = "Proposal Response",
                HelpText = "Key personnel assigned to this opportunity",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            // ===== Opportunity Classification Section =====
            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "follow_on_opportunity",
                DisplayLabel = "Follow-On Opportunity",
                FieldType = SalesCustomFieldType.Lookup,
                LookupEntityType = "Opportunity",
                Section = "Opportunity Classification",
                HelpText = "Link to related follow-on opportunity",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            fieldsToCreate.Add(new SalesCustomFieldDefinition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                EntityType = "Opportunity",
                FieldName = "portfolio",
                DisplayLabel = "Portfolio",
                FieldType = SalesCustomFieldType.Picklist,
                PicklistOptions = "[\"Defense\", \"National Security\", \"Civilian\", \"Safety & Citizen Services\"]",
                Section = "Opportunity Classification",
                HelpText = "Portfolio category for this opportunity",
                SortOrder = sortOrder++,
                IsActive = true,
                CreatedAt = now
            });

            _context.SalesCustomFieldDefinitions.AddRange(fieldsToCreate);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Seeded {Count} custom field definitions for tenant {TenantId}", fieldsToCreate.Count, tenantId.Value);

            return Ok(new { message = $"Successfully created {fieldsToCreate.Count} custom field definitions", count = fieldsToCreate.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding custom field definitions");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get distinct sections used by custom fields for an entity type
    /// </summary>
    [HttpGet("sections/{entityType}")]
    [RequiresPermission(Resource = "SalesCustomField", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<string>>> GetSections(string entityType)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var sections = await _context.SalesCustomFieldDefinitions
                .AsNoTracking()
                .Where(f => f.TenantId == tenantId.Value &&
                           f.EntityType == entityType &&
                           f.IsActive &&
                           !string.IsNullOrEmpty(f.Section))
                .Select(f => f.Section!)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();

            return Ok(sections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sections for {EntityType}", entityType);
            return StatusCode(500, new { message = "An error occurred" });
        }
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

// ===== DTOs =====

public class CustomFieldDefinitionDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public SalesCustomFieldType FieldType { get; set; }
    public string? PicklistOptions { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsRequired { get; set; }
    public bool IsSearchable { get; set; }
    public bool IsVisibleInList { get; set; }
    public string? Section { get; set; }
    public string? HelpText { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public string? LookupEntityType { get; set; }
}

public class CustomFieldValueDto
{
    public Guid Id { get; set; }
    public Guid FieldDefinitionId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public SalesCustomFieldType FieldType { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? TextValue { get; set; }
    public decimal? NumberValue { get; set; }
    public DateTime? DateValue { get; set; }
    public bool? BoolValue { get; set; }
    public string? PicklistValue { get; set; }
    public Guid? LookupValue { get; set; }
}

public class CreateCustomFieldRequest
{
    public required string EntityType { get; set; }
    public required string FieldName { get; set; }
    public required string DisplayLabel { get; set; }
    public SalesCustomFieldType FieldType { get; set; }
    public string? PicklistOptions { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsRequired { get; set; }
    public bool IsSearchable { get; set; }
    public bool IsVisibleInList { get; set; }
    public string? Section { get; set; }
    public string? HelpText { get; set; }
    public int? SortOrder { get; set; }
    public string? LookupEntityType { get; set; }
}

public class UpdateCustomFieldRequest
{
    public string? DisplayLabel { get; set; }
    public string? PicklistOptions { get; set; }
    public string? DefaultValue { get; set; }
    public bool? IsRequired { get; set; }
    public bool? IsSearchable { get; set; }
    public bool? IsVisibleInList { get; set; }
    public string? Section { get; set; }
    public string? HelpText { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
    public string? LookupEntityType { get; set; }
}

public class SetCustomFieldValueRequest
{
    public Guid FieldDefinitionId { get; set; }
    public string? TextValue { get; set; }
    public decimal? NumberValue { get; set; }
    public DateTime? DateValue { get; set; }
    public bool? BoolValue { get; set; }
    public string? PicklistValue { get; set; }
    public Guid? LookupValue { get; set; }
}
