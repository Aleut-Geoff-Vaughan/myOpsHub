using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OfficesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<OfficesController> _logger;

    public OfficesController(MySchedulingDbContext context, ILogger<OfficesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/offices
    [HttpGet]
    [RequiresPermission(Resource = "Office", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<OfficeDto>>> GetOffices(
        [FromQuery] Guid tenantId,
        [FromQuery] OfficeStatus? status = null,
        [FromQuery] bool? isClientSite = null)
    {
        try
        {
            var query = _context.Offices
                .AsNoTracking()
                .Where(o => o.TenantId == tenantId);

            if (status.HasValue)
            {
                query = query.Where(o => o.Status == status.Value);
            }

            if (isClientSite.HasValue)
            {
                query = query.Where(o => o.IsClientSite == isClientSite.Value);
            }

            var offices = await query
                .OrderBy(o => o.Name)
                .Select(o => new OfficeDto
                {
                    Id = o.Id,
                    TenantId = o.TenantId,
                    Name = o.Name,
                    Address = o.Address,
                    Timezone = o.Timezone,
                    Status = o.Status,
                    IsClientSite = o.IsClientSite,
                    SpaceCount = o.Spaces.Count,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt
                })
                .ToListAsync();

            return Ok(offices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving offices for tenant {TenantId}", tenantId);
            return StatusCode(500, "An error occurred while retrieving offices");
        }
    }

    // GET: api/offices/{id}
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "Office", Action = PermissionAction.Read)]
    public async Task<ActionResult<OfficeDto>> GetOffice(Guid id)
    {
        try
        {
            var office = await _context.Offices
                .Include(o => o.Spaces)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (office == null)
            {
                return NotFound($"Office with ID {id} not found");
            }

            var dto = new OfficeDto
            {
                Id = office.Id,
                TenantId = office.TenantId,
                Name = office.Name,
                Address = office.Address,
                Timezone = office.Timezone,
                Status = office.Status,
                IsClientSite = office.IsClientSite,
                SpaceCount = office.Spaces.Count,
                CreatedAt = office.CreatedAt,
                UpdatedAt = office.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving office {OfficeId}", id);
            return StatusCode(500, "An error occurred while retrieving the office");
        }
    }

    // POST: api/offices
    [HttpPost]
    [RequiresPermission(Resource = "Office", Action = PermissionAction.Create)]
    public async Task<ActionResult<OfficeDto>> CreateOffice(CreateOfficeRequest request)
    {
        try
        {
            var office = new Office
            {
                Id = Guid.NewGuid(),
                TenantId = request.TenantId,
                Name = request.Name,
                Address = request.Address,
                Timezone = request.Timezone ?? "America/New_York",
                Status = request.Status ?? OfficeStatus.Active,
                IsClientSite = request.IsClientSite ?? false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Offices.Add(office);
            await _context.SaveChangesAsync();

            var dto = new OfficeDto
            {
                Id = office.Id,
                TenantId = office.TenantId,
                Name = office.Name,
                Address = office.Address,
                Timezone = office.Timezone,
                Status = office.Status,
                IsClientSite = office.IsClientSite,
                SpaceCount = 0,
                CreatedAt = office.CreatedAt,
                UpdatedAt = office.UpdatedAt
            };

            return CreatedAtAction(nameof(GetOffice), new { id = office.Id }, dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating office");
            return StatusCode(500, "An error occurred while creating the office");
        }
    }

    // PUT: api/offices/{id}
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "Office", Action = PermissionAction.Update)]
    public async Task<IActionResult> UpdateOffice(Guid id, UpdateOfficeRequest request)
    {
        try
        {
            var office = await _context.Offices.FindAsync(id);
            if (office == null)
            {
                return NotFound($"Office with ID {id} not found");
            }

            office.Name = request.Name;
            office.Address = request.Address;
            office.Timezone = request.Timezone;
            office.Status = request.Status;
            office.IsClientSite = request.IsClientSite;
            office.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating office {OfficeId}", id);
            return StatusCode(500, "An error occurred while updating the office");
        }
    }

    // DELETE: api/offices/{id}
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "Office", Action = PermissionAction.Delete)]
    public async Task<IActionResult> DeleteOffice(Guid id)
    {
        try
        {
            var office = await _context.Offices
                .Include(o => o.Spaces)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (office == null)
            {
                return NotFound($"Office with ID {id} not found");
            }

            // Check if office has spaces
            if (office.Spaces.Any())
            {
                return BadRequest($"Cannot delete office '{office.Name}' because it has {office.Spaces.Count} space(s). Please delete all spaces first.");
            }

            _context.Offices.Remove(office);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting office {OfficeId}", id);
            return StatusCode(500, "An error occurred while deleting the office");
        }
    }
}

// DTOs
public class OfficeDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Timezone { get; set; }
    public OfficeStatus Status { get; set; }
    public bool IsClientSite { get; set; }
    public int SpaceCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateOfficeRequest
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Timezone { get; set; }
    public OfficeStatus? Status { get; set; }
    public bool? IsClientSite { get; set; }
}

public class UpdateOfficeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Timezone { get; set; }
    public OfficeStatus Status { get; set; }
    public bool IsClientSite { get; set; }
}
