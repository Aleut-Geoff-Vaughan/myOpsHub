using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/contract-vehicles")]
public class SalesContractVehiclesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesContractVehiclesController> _logger;

    public SalesContractVehiclesController(MySchedulingDbContext context, ILogger<SalesContractVehiclesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all contract vehicles for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "ContractVehicle", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<ContractVehicleDto>>> GetContractVehicles(
        [FromQuery] string? search = null,
        [FromQuery] string? vehicleType = null,
        [FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.ContractVehicles
                .AsNoTracking()
                .Include(v => v.BiddingEntity)
                .Where(v => v.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(v => v.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(v =>
                    v.Name.ToLower().Contains(searchLower) ||
                    (v.ContractNumber != null && v.ContractNumber.ToLower().Contains(searchLower)));
            }

            if (!string.IsNullOrWhiteSpace(vehicleType))
                query = query.Where(v => v.VehicleType == vehicleType);

            var vehicles = await query
                .OrderBy(v => v.Name)
                .Select(v => new ContractVehicleDto
                {
                    Id = v.Id,
                    TenantId = v.TenantId,
                    Name = v.Name,
                    ContractNumber = v.ContractNumber,
                    Description = v.Description,
                    VehicleType = v.VehicleType,
                    IssuingAgency = v.IssuingAgency,
                    AwardDate = v.AwardDate,
                    StartDate = v.StartDate,
                    EndDate = v.EndDate,
                    ExpirationDate = v.ExpirationDate,
                    CeilingValue = v.CeilingValue,
                    AwardedValue = v.AwardedValue,
                    RemainingValue = v.RemainingValue,
                    IsActive = v.IsActive,
                    EligibilityNotes = v.EligibilityNotes,
                    BiddingEntityId = v.BiddingEntityId,
                    BiddingEntityName = v.BiddingEntity != null ? v.BiddingEntity.Name : null,
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt
                })
                .ToListAsync();

            return Ok(vehicles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting contract vehicles");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific contract vehicle
    /// </summary>
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "ContractVehicle", Action = PermissionAction.Read)]
    public async Task<ActionResult<ContractVehicleDto>> GetContractVehicle(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var vehicle = await _context.ContractVehicles
                .Include(v => v.BiddingEntity)
                .Include(v => v.Opportunities)
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId.Value);

            if (vehicle == null)
                return NotFound(new { message = "Contract vehicle not found" });

            var dto = new ContractVehicleDto
            {
                Id = vehicle.Id,
                TenantId = vehicle.TenantId,
                Name = vehicle.Name,
                ContractNumber = vehicle.ContractNumber,
                Description = vehicle.Description,
                VehicleType = vehicle.VehicleType,
                IssuingAgency = vehicle.IssuingAgency,
                AwardDate = vehicle.AwardDate,
                StartDate = vehicle.StartDate,
                EndDate = vehicle.EndDate,
                ExpirationDate = vehicle.ExpirationDate,
                CeilingValue = vehicle.CeilingValue,
                AwardedValue = vehicle.AwardedValue,
                RemainingValue = vehicle.RemainingValue,
                IsActive = vehicle.IsActive,
                EligibilityNotes = vehicle.EligibilityNotes,
                BiddingEntityId = vehicle.BiddingEntityId,
                BiddingEntityName = vehicle.BiddingEntity?.Name,
                CreatedAt = vehicle.CreatedAt,
                UpdatedAt = vehicle.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting contract vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new contract vehicle
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "ContractVehicle", Action = PermissionAction.Create)]
    public async Task<ActionResult<ContractVehicleDto>> CreateContractVehicle([FromBody] CreateContractVehicleRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var vehicle = new ContractVehicle
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                Name = request.Name,
                ContractNumber = request.ContractNumber,
                Description = request.Description,
                VehicleType = request.VehicleType,
                IssuingAgency = request.IssuingAgency,
                AwardDate = request.AwardDate,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                ExpirationDate = request.ExpirationDate,
                CeilingValue = request.CeilingValue,
                AwardedValue = request.AwardedValue,
                EligibilityNotes = request.EligibilityNotes,
                BiddingEntityId = request.BiddingEntityId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ContractVehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            // Load the bidding entity for the response
            await _context.Entry(vehicle).Reference(v => v.BiddingEntity).LoadAsync();

            var dto = new ContractVehicleDto
            {
                Id = vehicle.Id,
                TenantId = vehicle.TenantId,
                Name = vehicle.Name,
                ContractNumber = vehicle.ContractNumber,
                Description = vehicle.Description,
                VehicleType = vehicle.VehicleType,
                IssuingAgency = vehicle.IssuingAgency,
                AwardDate = vehicle.AwardDate,
                StartDate = vehicle.StartDate,
                EndDate = vehicle.EndDate,
                ExpirationDate = vehicle.ExpirationDate,
                CeilingValue = vehicle.CeilingValue,
                AwardedValue = vehicle.AwardedValue,
                RemainingValue = vehicle.RemainingValue,
                IsActive = vehicle.IsActive,
                EligibilityNotes = vehicle.EligibilityNotes,
                BiddingEntityId = vehicle.BiddingEntityId,
                BiddingEntityName = vehicle.BiddingEntity?.Name,
                CreatedAt = vehicle.CreatedAt,
                UpdatedAt = vehicle.UpdatedAt
            };

            return CreatedAtAction(nameof(GetContractVehicle), new { id = vehicle.Id }, dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating contract vehicle");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a contract vehicle
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "ContractVehicle", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateContractVehicle(Guid id, [FromBody] UpdateContractVehicleRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var vehicle = await _context.ContractVehicles
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId.Value);

            if (vehicle == null)
                return NotFound(new { message = "Contract vehicle not found" });

            if (request.Name != null) vehicle.Name = request.Name;
            if (request.ContractNumber != null) vehicle.ContractNumber = request.ContractNumber;
            if (request.Description != null) vehicle.Description = request.Description;
            if (request.VehicleType != null) vehicle.VehicleType = request.VehicleType;
            if (request.IssuingAgency != null) vehicle.IssuingAgency = request.IssuingAgency;
            if (request.AwardDate.HasValue) vehicle.AwardDate = request.AwardDate;
            if (request.StartDate.HasValue) vehicle.StartDate = request.StartDate;
            if (request.EndDate.HasValue) vehicle.EndDate = request.EndDate;
            if (request.ExpirationDate.HasValue) vehicle.ExpirationDate = request.ExpirationDate;
            if (request.CeilingValue.HasValue) vehicle.CeilingValue = request.CeilingValue;
            if (request.AwardedValue.HasValue) vehicle.AwardedValue = request.AwardedValue;
            if (request.EligibilityNotes != null) vehicle.EligibilityNotes = request.EligibilityNotes;
            if (request.BiddingEntityId.HasValue) vehicle.BiddingEntityId = request.BiddingEntityId;
            if (request.IsActive.HasValue) vehicle.IsActive = request.IsActive.Value;

            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating contract vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a contract vehicle (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "ContractVehicle", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteContractVehicle(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var vehicle = await _context.ContractVehicles
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId.Value);

            if (vehicle == null)
                return NotFound(new { message = "Contract vehicle not found" });

            vehicle.IsActive = false;
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting contract vehicle {Id}", id);
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

public class ContractVehicleDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContractNumber { get; set; }
    public string? Description { get; set; }
    public string? VehicleType { get; set; }
    public string? IssuingAgency { get; set; }
    public DateTime? AwardDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public decimal? CeilingValue { get; set; }
    public decimal? AwardedValue { get; set; }
    public decimal? RemainingValue { get; set; }
    public bool IsActive { get; set; }
    public string? EligibilityNotes { get; set; }
    public Guid? BiddingEntityId { get; set; }
    public string? BiddingEntityName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateContractVehicleRequest
{
    public required string Name { get; set; }
    public string? ContractNumber { get; set; }
    public string? Description { get; set; }
    public string? VehicleType { get; set; }
    public string? IssuingAgency { get; set; }
    public DateTime? AwardDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public decimal? CeilingValue { get; set; }
    public decimal? AwardedValue { get; set; }
    public string? EligibilityNotes { get; set; }
    public Guid? BiddingEntityId { get; set; }
}

public class UpdateContractVehicleRequest
{
    public string? Name { get; set; }
    public string? ContractNumber { get; set; }
    public string? Description { get; set; }
    public string? VehicleType { get; set; }
    public string? IssuingAgency { get; set; }
    public DateTime? AwardDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public decimal? CeilingValue { get; set; }
    public decimal? AwardedValue { get; set; }
    public string? EligibilityNotes { get; set; }
    public Guid? BiddingEntityId { get; set; }
    public bool? IsActive { get; set; }
}
