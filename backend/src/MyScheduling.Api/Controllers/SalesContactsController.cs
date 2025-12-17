using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/contacts")]
public class SalesContactsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesContactsController> _logger;

    public SalesContactsController(MySchedulingDbContext context, ILogger<SalesContactsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all contacts for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "SalesContact", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<SalesContactDto>>> GetContacts(
        [FromQuery] string? search = null,
        [FromQuery] Guid? accountId = null,
        [FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.SalesContacts
                .AsNoTracking()
                .Include(c => c.Account)
                .Where(c => c.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(c => c.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(c =>
                    c.FirstName.ToLower().Contains(searchLower) ||
                    c.LastName.ToLower().Contains(searchLower) ||
                    (c.Email != null && c.Email.ToLower().Contains(searchLower)));
            }

            if (accountId.HasValue)
                query = query.Where(c => c.AccountId == accountId.Value);

            var contacts = await query
                .OrderBy(c => c.LastName)
                .ThenBy(c => c.FirstName)
                .Select(c => new SalesContactDto
                {
                    Id = c.Id,
                    TenantId = c.TenantId,
                    AccountId = c.AccountId,
                    AccountName = c.Account != null ? c.Account.Name : null,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    FullName = c.FirstName + " " + c.LastName,
                    Title = c.Title,
                    Department = c.Department,
                    Email = c.Email,
                    Phone = c.Phone,
                    MobilePhone = c.MobilePhone,
                    LinkedInUrl = c.LinkedInUrl,
                    MailingAddress = c.MailingAddress,
                    MailingCity = c.MailingCity,
                    MailingState = c.MailingState,
                    MailingPostalCode = c.MailingPostalCode,
                    IsActive = c.IsActive,
                    Notes = c.Notes,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(contacts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting contacts");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific contact
    /// </summary>
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "SalesContact", Action = PermissionAction.Read)]
    public async Task<ActionResult<SalesContactDto>> GetContact(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var contact = await _context.SalesContacts
                .Include(c => c.Account)
                .Include(c => c.OpportunityRoles)
                    .ThenInclude(r => r.Opportunity)
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId.Value);

            if (contact == null)
                return NotFound(new { message = "Contact not found" });

            var dto = new SalesContactDto
            {
                Id = contact.Id,
                TenantId = contact.TenantId,
                AccountId = contact.AccountId,
                AccountName = contact.Account?.Name,
                FirstName = contact.FirstName,
                LastName = contact.LastName,
                FullName = contact.FullName,
                Title = contact.Title,
                Department = contact.Department,
                Email = contact.Email,
                Phone = contact.Phone,
                MobilePhone = contact.MobilePhone,
                LinkedInUrl = contact.LinkedInUrl,
                MailingAddress = contact.MailingAddress,
                MailingCity = contact.MailingCity,
                MailingState = contact.MailingState,
                MailingPostalCode = contact.MailingPostalCode,
                IsActive = contact.IsActive,
                Notes = contact.Notes,
                CreatedAt = contact.CreatedAt,
                UpdatedAt = contact.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting contact {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new contact
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "SalesContact", Action = PermissionAction.Create)]
    public async Task<ActionResult<SalesContactDto>> CreateContact([FromBody] CreateContactRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var contact = new SalesContact
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                AccountId = request.AccountId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Title = request.Title,
                Department = request.Department,
                Email = request.Email,
                Phone = request.Phone,
                MobilePhone = request.MobilePhone,
                LinkedInUrl = request.LinkedInUrl,
                MailingAddress = request.MailingAddress,
                MailingCity = request.MailingCity,
                MailingState = request.MailingState,
                MailingPostalCode = request.MailingPostalCode,
                Notes = request.Notes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesContacts.Add(contact);
            await _context.SaveChangesAsync();

            // Load the account for the response
            await _context.Entry(contact).Reference(c => c.Account).LoadAsync();

            var dto = new SalesContactDto
            {
                Id = contact.Id,
                TenantId = contact.TenantId,
                AccountId = contact.AccountId,
                AccountName = contact.Account?.Name,
                FirstName = contact.FirstName,
                LastName = contact.LastName,
                FullName = contact.FullName,
                Title = contact.Title,
                Department = contact.Department,
                Email = contact.Email,
                Phone = contact.Phone,
                MobilePhone = contact.MobilePhone,
                LinkedInUrl = contact.LinkedInUrl,
                MailingAddress = contact.MailingAddress,
                MailingCity = contact.MailingCity,
                MailingState = contact.MailingState,
                MailingPostalCode = contact.MailingPostalCode,
                IsActive = contact.IsActive,
                Notes = contact.Notes,
                CreatedAt = contact.CreatedAt,
                UpdatedAt = contact.UpdatedAt
            };

            return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating contact");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a contact
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "SalesContact", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateContact(Guid id, [FromBody] UpdateContactRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var contact = await _context.SalesContacts
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId.Value);

            if (contact == null)
                return NotFound(new { message = "Contact not found" });

            if (request.AccountId.HasValue) contact.AccountId = request.AccountId;
            if (request.FirstName != null) contact.FirstName = request.FirstName;
            if (request.LastName != null) contact.LastName = request.LastName;
            if (request.Title != null) contact.Title = request.Title;
            if (request.Department != null) contact.Department = request.Department;
            if (request.Email != null) contact.Email = request.Email;
            if (request.Phone != null) contact.Phone = request.Phone;
            if (request.MobilePhone != null) contact.MobilePhone = request.MobilePhone;
            if (request.LinkedInUrl != null) contact.LinkedInUrl = request.LinkedInUrl;
            if (request.MailingAddress != null) contact.MailingAddress = request.MailingAddress;
            if (request.MailingCity != null) contact.MailingCity = request.MailingCity;
            if (request.MailingState != null) contact.MailingState = request.MailingState;
            if (request.MailingPostalCode != null) contact.MailingPostalCode = request.MailingPostalCode;
            if (request.Notes != null) contact.Notes = request.Notes;
            if (request.IsActive.HasValue) contact.IsActive = request.IsActive.Value;

            contact.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating contact {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a contact (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "SalesContact", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteContact(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var contact = await _context.SalesContacts
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId.Value);

            if (contact == null)
                return NotFound(new { message = "Contact not found" });

            contact.IsActive = false;
            contact.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting contact {Id}", id);
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

public class SalesContactDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? AccountId { get; set; }
    public string? AccountName { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? MailingAddress { get; set; }
    public string? MailingCity { get; set; }
    public string? MailingState { get; set; }
    public string? MailingPostalCode { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateContactRequest
{
    public Guid? AccountId { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? Title { get; set; }
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? MailingAddress { get; set; }
    public string? MailingCity { get; set; }
    public string? MailingState { get; set; }
    public string? MailingPostalCode { get; set; }
    public string? Notes { get; set; }
}

public class UpdateContactRequest
{
    public Guid? AccountId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Title { get; set; }
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? MailingAddress { get; set; }
    public string? MailingCity { get; set; }
    public string? MailingState { get; set; }
    public string? MailingPostalCode { get; set; }
    public string? Notes { get; set; }
    public bool? IsActive { get; set; }
}
