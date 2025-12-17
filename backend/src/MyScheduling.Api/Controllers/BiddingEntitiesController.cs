using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/bidding-entities")]
public class BiddingEntitiesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<BiddingEntitiesController> _logger;

    public BiddingEntitiesController(MySchedulingDbContext context, ILogger<BiddingEntitiesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all bidding entities for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "BiddingEntity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<BiddingEntityDto>>> GetBiddingEntities(
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool? is8a = null)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.BiddingEntities
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(e => e.IsActive);

            if (is8a.HasValue)
                query = query.Where(e => e.Is8a == is8a.Value);

            var entities = await query
                .OrderBy(e => e.Name)
                .Select(e => new BiddingEntityDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    LegalName = e.LegalName,
                    ShortName = e.ShortName,
                    DunsNumber = e.DunsNumber,
                    CageCode = e.CageCode,
                    UeiNumber = e.UeiNumber,
                    Is8a = e.Is8a,
                    SbaEntryDate = e.SbaEntryDate,
                    SbaExpirationDate = e.SbaExpirationDate,
                    SbaGraduationDate = e.SbaGraduationDate,
                    IsSmallBusiness = e.IsSmallBusiness,
                    IsSDVOSB = e.IsSDVOSB,
                    IsVOSB = e.IsVOSB,
                    IsWOSB = e.IsWOSB,
                    IsEDWOSB = e.IsEDWOSB,
                    IsHUBZone = e.IsHUBZone,
                    IsSDB = e.IsSDB,
                    IsActive = e.IsActive,
                    // Calculate these in memory since EF can't translate them
                    IsSbaActive = e.Is8a && e.SbaExpirationDate.HasValue && e.SbaExpirationDate > DateTime.UtcNow,
                    DaysUntilSbaExpiration = e.SbaExpirationDate.HasValue
                        ? (int)(e.SbaExpirationDate.Value - DateTime.UtcNow).TotalDays
                        : (int?)null
                })
                .ToListAsync();

            return Ok(entities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bidding entities");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get bidding entities with expiring SBA status
    /// </summary>
    [HttpGet("expiring")]
    [RequiresPermission(Resource = "BiddingEntity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<BiddingEntityDto>>> GetExpiringEntities([FromQuery] int daysAhead = 90)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var cutoffDate = DateTime.UtcNow.AddDays(daysAhead);

            var entities = await _context.BiddingEntities
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId.Value
                    && e.IsActive
                    && e.Is8a
                    && e.SbaExpirationDate.HasValue
                    && e.SbaExpirationDate <= cutoffDate)
                .OrderBy(e => e.SbaExpirationDate)
                .Select(e => new BiddingEntityDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    LegalName = e.LegalName,
                    ShortName = e.ShortName,
                    DunsNumber = e.DunsNumber,
                    CageCode = e.CageCode,
                    UeiNumber = e.UeiNumber,
                    Is8a = e.Is8a,
                    SbaEntryDate = e.SbaEntryDate,
                    SbaExpirationDate = e.SbaExpirationDate,
                    SbaGraduationDate = e.SbaGraduationDate,
                    IsSmallBusiness = e.IsSmallBusiness,
                    IsSDVOSB = e.IsSDVOSB,
                    IsVOSB = e.IsVOSB,
                    IsWOSB = e.IsWOSB,
                    IsEDWOSB = e.IsEDWOSB,
                    IsHUBZone = e.IsHUBZone,
                    IsSDB = e.IsSDB,
                    IsActive = e.IsActive,
                    IsSbaActive = e.Is8a && e.SbaExpirationDate.HasValue && e.SbaExpirationDate > DateTime.UtcNow,
                    DaysUntilSbaExpiration = e.SbaExpirationDate.HasValue
                        ? (int)(e.SbaExpirationDate.Value - DateTime.UtcNow).TotalDays
                        : (int?)null
                })
                .ToListAsync();

            return Ok(entities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expiring bidding entities");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific bidding entity
    /// </summary>
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "BiddingEntity", Action = PermissionAction.Read)]
    public async Task<ActionResult<BiddingEntity>> GetBiddingEntity(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var entity = await _context.BiddingEntities
                .Include(e => e.Opportunities)
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId.Value);

            if (entity == null)
                return NotFound(new { message = "Bidding entity not found" });

            return Ok(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bidding entity {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new bidding entity
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "BiddingEntity", Action = PermissionAction.Create)]
    public async Task<ActionResult<BiddingEntity>> CreateBiddingEntity([FromBody] CreateBiddingEntityRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var entity = new BiddingEntity
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                Name = request.Name,
                LegalName = request.LegalName,
                ShortName = request.ShortName,
                DunsNumber = request.DunsNumber,
                CageCode = request.CageCode,
                UeiNumber = request.UeiNumber,
                TaxId = request.TaxId,
                Is8a = request.Is8a,
                SbaEntryDate = request.SbaEntryDate,
                SbaExpirationDate = request.SbaExpirationDate,
                SbaGraduationDate = request.SbaGraduationDate,
                IsSmallBusiness = request.IsSmallBusiness,
                IsSDVOSB = request.IsSDVOSB,
                IsVOSB = request.IsVOSB,
                IsWOSB = request.IsWOSB,
                IsEDWOSB = request.IsEDWOSB,
                IsHUBZone = request.IsHUBZone,
                IsSDB = request.IsSDB,
                Address = request.Address,
                City = request.City,
                State = request.State,
                PostalCode = request.PostalCode,
                Country = request.Country,
                Notes = request.Notes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.BiddingEntities.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBiddingEntity), new { id = entity.Id }, entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating bidding entity");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a bidding entity
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "BiddingEntity", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateBiddingEntity(Guid id, [FromBody] UpdateBiddingEntityRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var entity = await _context.BiddingEntities
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId.Value);

            if (entity == null)
                return NotFound(new { message = "Bidding entity not found" });

            if (request.Name != null) entity.Name = request.Name;
            if (request.LegalName != null) entity.LegalName = request.LegalName;
            if (request.ShortName != null) entity.ShortName = request.ShortName;
            if (request.DunsNumber != null) entity.DunsNumber = request.DunsNumber;
            if (request.CageCode != null) entity.CageCode = request.CageCode;
            if (request.UeiNumber != null) entity.UeiNumber = request.UeiNumber;
            if (request.TaxId != null) entity.TaxId = request.TaxId;
            if (request.Is8a.HasValue) entity.Is8a = request.Is8a.Value;
            if (request.SbaEntryDate.HasValue) entity.SbaEntryDate = request.SbaEntryDate;
            if (request.SbaExpirationDate.HasValue) entity.SbaExpirationDate = request.SbaExpirationDate;
            if (request.SbaGraduationDate.HasValue) entity.SbaGraduationDate = request.SbaGraduationDate;
            if (request.IsSmallBusiness.HasValue) entity.IsSmallBusiness = request.IsSmallBusiness.Value;
            if (request.IsSDVOSB.HasValue) entity.IsSDVOSB = request.IsSDVOSB.Value;
            if (request.IsVOSB.HasValue) entity.IsVOSB = request.IsVOSB.Value;
            if (request.IsWOSB.HasValue) entity.IsWOSB = request.IsWOSB.Value;
            if (request.IsEDWOSB.HasValue) entity.IsEDWOSB = request.IsEDWOSB.Value;
            if (request.IsHUBZone.HasValue) entity.IsHUBZone = request.IsHUBZone.Value;
            if (request.IsSDB.HasValue) entity.IsSDB = request.IsSDB.Value;
            if (request.Address != null) entity.Address = request.Address;
            if (request.City != null) entity.City = request.City;
            if (request.State != null) entity.State = request.State;
            if (request.PostalCode != null) entity.PostalCode = request.PostalCode;
            if (request.Country != null) entity.Country = request.Country;
            if (request.Notes != null) entity.Notes = request.Notes;
            if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;

            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating bidding entity {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a bidding entity (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "BiddingEntity", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteBiddingEntity(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var entity = await _context.BiddingEntities
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId.Value);

            if (entity == null)
                return NotFound(new { message = "Bidding entity not found" });

            entity.IsActive = false;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting bidding entity {Id}", id);
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

public class BiddingEntityDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? ShortName { get; set; }
    public string? DunsNumber { get; set; }
    public string? CageCode { get; set; }
    public string? UeiNumber { get; set; }
    public bool Is8a { get; set; }
    public DateTime? SbaEntryDate { get; set; }
    public DateTime? SbaExpirationDate { get; set; }
    public DateTime? SbaGraduationDate { get; set; }
    public bool IsSmallBusiness { get; set; }
    public bool IsSDVOSB { get; set; }
    public bool IsVOSB { get; set; }
    public bool IsWOSB { get; set; }
    public bool IsEDWOSB { get; set; }
    public bool IsHUBZone { get; set; }
    public bool IsSDB { get; set; }
    public bool IsActive { get; set; }
    public bool IsSbaActive { get; set; }
    public int? DaysUntilSbaExpiration { get; set; }
}

public class CreateBiddingEntityRequest
{
    public required string Name { get; set; }
    public string? LegalName { get; set; }
    public string? ShortName { get; set; }
    public string? DunsNumber { get; set; }
    public string? CageCode { get; set; }
    public string? UeiNumber { get; set; }
    public string? TaxId { get; set; }
    public bool Is8a { get; set; }
    public DateTime? SbaEntryDate { get; set; }
    public DateTime? SbaExpirationDate { get; set; }
    public DateTime? SbaGraduationDate { get; set; }
    public bool IsSmallBusiness { get; set; }
    public bool IsSDVOSB { get; set; }
    public bool IsVOSB { get; set; }
    public bool IsWOSB { get; set; }
    public bool IsEDWOSB { get; set; }
    public bool IsHUBZone { get; set; }
    public bool IsSDB { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Notes { get; set; }
}

public class UpdateBiddingEntityRequest
{
    public string? Name { get; set; }
    public string? LegalName { get; set; }
    public string? ShortName { get; set; }
    public string? DunsNumber { get; set; }
    public string? CageCode { get; set; }
    public string? UeiNumber { get; set; }
    public string? TaxId { get; set; }
    public bool? Is8a { get; set; }
    public DateTime? SbaEntryDate { get; set; }
    public DateTime? SbaExpirationDate { get; set; }
    public DateTime? SbaGraduationDate { get; set; }
    public bool? IsSmallBusiness { get; set; }
    public bool? IsSDVOSB { get; set; }
    public bool? IsVOSB { get; set; }
    public bool? IsWOSB { get; set; }
    public bool? IsEDWOSB { get; set; }
    public bool? IsHUBZone { get; set; }
    public bool? IsSDB { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Notes { get; set; }
    public bool? IsActive { get; set; }
}
