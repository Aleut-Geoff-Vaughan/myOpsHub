using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/accounts")]
public class SalesAccountsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesAccountsController> _logger;

    public SalesAccountsController(MySchedulingDbContext context, ILogger<SalesAccountsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all accounts for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "SalesAccount", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<SalesAccount>>> GetAccounts(
        [FromQuery] string? search = null,
        [FromQuery] string? accountType = null,
        [FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.SalesAccounts
                .AsNoTracking()
                .Include(a => a.ParentAccount)
                .Where(a => a.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(a => a.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(a =>
                    a.Name.ToLower().Contains(searchLower) ||
                    (a.Acronym != null && a.Acronym.ToLower().Contains(searchLower)));
            }

            if (!string.IsNullOrWhiteSpace(accountType))
                query = query.Where(a => a.AccountType == accountType);

            var accounts = await query
                .OrderBy(a => a.Name)
                .ToListAsync();

            return Ok(accounts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting accounts");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific account
    /// </summary>
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "SalesAccount", Action = PermissionAction.Read)]
    public async Task<ActionResult<SalesAccount>> GetAccount(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var account = await _context.SalesAccounts
                .Include(a => a.ParentAccount)
                .Include(a => a.ChildAccounts)
                .Include(a => a.Contacts)
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId.Value);

            if (account == null)
                return NotFound(new { message = "Account not found" });

            return Ok(account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting account {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new account
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "SalesAccount", Action = PermissionAction.Create)]
    public async Task<ActionResult<SalesAccount>> CreateAccount([FromBody] CreateAccountRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var account = new SalesAccount
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                Name = request.Name,
                Acronym = request.Acronym,
                Description = request.Description,
                ParentAccountId = request.ParentAccountId,
                AccountType = request.AccountType,
                FederalDepartment = request.FederalDepartment,
                Portfolio = request.Portfolio,
                Address = request.Address,
                City = request.City,
                State = request.State,
                PostalCode = request.PostalCode,
                Country = request.Country,
                Phone = request.Phone,
                Website = request.Website,
                Notes = request.Notes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesAccounts.Add(account);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating account");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update an account
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "SalesAccount", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateAccount(Guid id, [FromBody] UpdateAccountRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var account = await _context.SalesAccounts
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId.Value);

            if (account == null)
                return NotFound(new { message = "Account not found" });

            if (request.Name != null) account.Name = request.Name;
            if (request.Acronym != null) account.Acronym = request.Acronym;
            if (request.Description != null) account.Description = request.Description;
            if (request.ParentAccountId.HasValue) account.ParentAccountId = request.ParentAccountId;
            if (request.AccountType != null) account.AccountType = request.AccountType;
            if (request.FederalDepartment != null) account.FederalDepartment = request.FederalDepartment;
            if (request.Portfolio != null) account.Portfolio = request.Portfolio;
            if (request.Address != null) account.Address = request.Address;
            if (request.City != null) account.City = request.City;
            if (request.State != null) account.State = request.State;
            if (request.PostalCode != null) account.PostalCode = request.PostalCode;
            if (request.Country != null) account.Country = request.Country;
            if (request.Phone != null) account.Phone = request.Phone;
            if (request.Website != null) account.Website = request.Website;
            if (request.Notes != null) account.Notes = request.Notes;
            if (request.IsActive.HasValue) account.IsActive = request.IsActive.Value;

            account.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating account {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete an account (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "SalesAccount", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteAccount(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var account = await _context.SalesAccounts
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId.Value);

            if (account == null)
                return NotFound(new { message = "Account not found" });

            account.IsActive = false;
            account.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account {Id}", id);
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

public class CreateAccountRequest
{
    public required string Name { get; set; }
    public string? Acronym { get; set; }
    public string? Description { get; set; }
    public Guid? ParentAccountId { get; set; }
    public string? AccountType { get; set; }
    public string? FederalDepartment { get; set; }
    public string? Portfolio { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAccountRequest
{
    public string? Name { get; set; }
    public string? Acronym { get; set; }
    public string? Description { get; set; }
    public Guid? ParentAccountId { get; set; }
    public string? AccountType { get; set; }
    public string? FederalDepartment { get; set; }
    public string? Portfolio { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Notes { get; set; }
    public bool? IsActive { get; set; }
}
