using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Controller for opportunity-related entities: Notes, Team Members, Contact Roles, Field History
/// </summary>
[ApiController]
[Route("api/salesops/opportunities/{opportunityId}")]
public class OpportunityRelatedController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<OpportunityRelatedController> _logger;

    public OpportunityRelatedController(MySchedulingDbContext context, ILogger<OpportunityRelatedController> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Notes

    /// <summary>
    /// Get all notes for an opportunity
    /// </summary>
    [HttpGet("notes")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<OpportunityNoteDto>>> GetNotes(Guid opportunityId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Verify opportunity exists and belongs to tenant
            var opportunity = await _context.SalesOpportunities
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            var notes = await _context.OpportunityNotes
                .AsNoTracking()
                .Where(n => n.OpportunityId == opportunityId && n.TenantId == tenantId.Value)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new OpportunityNoteDto
                {
                    Id = n.Id,
                    Content = n.Content,
                    NoteType = n.NoteType,
                    CreatedAt = n.CreatedAt,
                    CreatedByUserId = n.CreatedByUserId,
                    CreatedByUserName = n.CreatedByUserId != null
                        ? _context.Users.Where(u => u.Id == n.CreatedByUserId).Select(u => u.DisplayName ?? u.Email).FirstOrDefault()
                        : null
                })
                .ToListAsync();

            return Ok(notes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notes for opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add a note to an opportunity
    /// </summary>
    [HttpPost("notes")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult<OpportunityNoteDto>> AddNote(Guid opportunityId, [FromBody] CreateNoteRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = TryGetCurrentUserId();
            if (!userId.HasValue)
                return BadRequest(new { message = "Invalid user context" });

            // Verify opportunity exists and belongs to tenant
            var opportunity = await _context.SalesOpportunities
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            var note = new OpportunityNote
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                OpportunityId = opportunityId,
                Content = request.Content,
                NoteType = request.NoteType,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId.Value
            };

            _context.OpportunityNotes.Add(note);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId.Value);

            return CreatedAtAction(nameof(GetNotes), new { opportunityId }, new OpportunityNoteDto
            {
                Id = note.Id,
                Content = note.Content,
                NoteType = note.NoteType,
                CreatedAt = note.CreatedAt,
                CreatedByUserId = note.CreatedByUserId,
                CreatedByUserName = user?.DisplayName ?? user?.Email
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding note to opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a note
    /// </summary>
    [HttpPut("notes/{noteId}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateNote(Guid opportunityId, Guid noteId, [FromBody] UpdateNoteRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var note = await _context.OpportunityNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.OpportunityId == opportunityId && n.TenantId == tenantId.Value);

            if (note == null)
                return NotFound(new { message = "Note not found" });

            note.Content = request.Content;
            note.NoteType = request.NoteType ?? note.NoteType;
            note.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating note {NoteId}", noteId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a note
    /// </summary>
    [HttpDelete("notes/{noteId}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> DeleteNote(Guid opportunityId, Guid noteId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var note = await _context.OpportunityNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.OpportunityId == opportunityId && n.TenantId == tenantId.Value);

            if (note == null)
                return NotFound(new { message = "Note not found" });

            _context.OpportunityNotes.Remove(note);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting note {NoteId}", noteId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Team Members

    /// <summary>
    /// Get all team members for an opportunity
    /// </summary>
    [HttpGet("team-members")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<TeamMemberDto>>> GetTeamMembers(Guid opportunityId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var opportunity = await _context.SalesOpportunities
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            var teamMembers = await _context.OpportunityTeamMembers
                .AsNoTracking()
                .Include(tm => tm.User)
                .Where(tm => tm.OpportunityId == opportunityId && tm.TenantId == tenantId.Value)
                .Select(tm => new TeamMemberDto
                {
                    Id = tm.Id,
                    UserId = tm.UserId,
                    UserName = tm.User.DisplayName ?? tm.User.Email,
                    UserEmail = tm.User.Email,
                    Role = tm.Role,
                    IsPrimary = tm.IsPrimary,
                    Notes = tm.Notes
                })
                .ToListAsync();

            return Ok(teamMembers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting team members for opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add a team member to an opportunity
    /// </summary>
    [HttpPost("team-members")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult<TeamMemberDto>> AddTeamMember(Guid opportunityId, [FromBody] CreateTeamMemberRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = TryGetCurrentUserId();

            var opportunity = await _context.SalesOpportunities
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            // Check if user is already a team member
            var existingMember = await _context.OpportunityTeamMembers
                .AnyAsync(tm => tm.OpportunityId == opportunityId && tm.UserId == request.UserId && tm.TenantId == tenantId.Value);

            if (existingMember)
                return BadRequest(new { message = "User is already a team member" });

            var teamMember = new OpportunityTeamMember
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                OpportunityId = opportunityId,
                UserId = request.UserId,
                Role = request.Role,
                IsPrimary = request.IsPrimary,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            // If this is set as primary, unset other primaries
            if (request.IsPrimary)
            {
                var existingPrimaries = await _context.OpportunityTeamMembers
                    .Where(tm => tm.OpportunityId == opportunityId && tm.IsPrimary && tm.TenantId == tenantId.Value)
                    .ToListAsync();

                foreach (var primary in existingPrimaries)
                {
                    primary.IsPrimary = false;
                }
            }

            _context.OpportunityTeamMembers.Add(teamMember);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(request.UserId);

            return CreatedAtAction(nameof(GetTeamMembers), new { opportunityId }, new TeamMemberDto
            {
                Id = teamMember.Id,
                UserId = teamMember.UserId,
                UserName = user?.DisplayName ?? user?.Email ?? "",
                UserEmail = user?.Email ?? "",
                Role = teamMember.Role,
                IsPrimary = teamMember.IsPrimary,
                Notes = teamMember.Notes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding team member to opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a team member
    /// </summary>
    [HttpPut("team-members/{teamMemberId}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateTeamMember(Guid opportunityId, Guid teamMemberId, [FromBody] UpdateTeamMemberRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var teamMember = await _context.OpportunityTeamMembers
                .FirstOrDefaultAsync(tm => tm.Id == teamMemberId && tm.OpportunityId == opportunityId && tm.TenantId == tenantId.Value);

            if (teamMember == null)
                return NotFound(new { message = "Team member not found" });

            if (request.Role != null) teamMember.Role = request.Role;
            if (request.Notes != null) teamMember.Notes = request.Notes;
            if (request.IsPrimary.HasValue)
            {
                if (request.IsPrimary.Value && !teamMember.IsPrimary)
                {
                    // Unset other primaries
                    var existingPrimaries = await _context.OpportunityTeamMembers
                        .Where(tm => tm.OpportunityId == opportunityId && tm.IsPrimary && tm.Id != teamMemberId && tm.TenantId == tenantId.Value)
                        .ToListAsync();

                    foreach (var primary in existingPrimaries)
                    {
                        primary.IsPrimary = false;
                    }
                }
                teamMember.IsPrimary = request.IsPrimary.Value;
            }

            teamMember.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating team member {TeamMemberId}", teamMemberId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Remove a team member from an opportunity
    /// </summary>
    [HttpDelete("team-members/{teamMemberId}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> RemoveTeamMember(Guid opportunityId, Guid teamMemberId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var teamMember = await _context.OpportunityTeamMembers
                .FirstOrDefaultAsync(tm => tm.Id == teamMemberId && tm.OpportunityId == opportunityId && tm.TenantId == tenantId.Value);

            if (teamMember == null)
                return NotFound(new { message = "Team member not found" });

            _context.OpportunityTeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing team member {TeamMemberId}", teamMemberId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Contact Roles

    /// <summary>
    /// Get all contact roles for an opportunity
    /// </summary>
    [HttpGet("contact-roles")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<ContactRoleDto>>> GetContactRoles(Guid opportunityId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var opportunity = await _context.SalesOpportunities
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            var contactRoles = await _context.OpportunityContactRoles
                .AsNoTracking()
                .Include(cr => cr.Contact)
                    .ThenInclude(c => c.Account)
                .Where(cr => cr.OpportunityId == opportunityId && cr.TenantId == tenantId.Value)
                .Select(cr => new ContactRoleDto
                {
                    Id = cr.Id,
                    ContactId = cr.ContactId,
                    ContactName = cr.Contact.FullName,
                    ContactEmail = cr.Contact.Email,
                    ContactPhone = cr.Contact.Phone,
                    ContactTitle = cr.Contact.Title,
                    AccountName = cr.Contact.Account != null ? cr.Contact.Account.Name : null,
                    Role = cr.Role,
                    IsPrimary = cr.IsPrimary,
                    Notes = cr.Notes
                })
                .ToListAsync();

            return Ok(contactRoles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting contact roles for opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add a contact role to an opportunity
    /// </summary>
    [HttpPost("contact-roles")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult<ContactRoleDto>> AddContactRole(Guid opportunityId, [FromBody] CreateContactRoleRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = TryGetCurrentUserId();

            var opportunity = await _context.SalesOpportunities
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            var contact = await _context.SalesContacts
                .Include(c => c.Account)
                .FirstOrDefaultAsync(c => c.Id == request.ContactId && c.TenantId == tenantId.Value);

            if (contact == null)
                return NotFound(new { message = "Contact not found" });

            // Check if contact already has this role
            var existingRole = await _context.OpportunityContactRoles
                .AnyAsync(cr => cr.OpportunityId == opportunityId && cr.ContactId == request.ContactId && cr.TenantId == tenantId.Value);

            if (existingRole)
                return BadRequest(new { message = "Contact is already associated with this opportunity" });

            var contactRole = new OpportunityContactRole
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                OpportunityId = opportunityId,
                ContactId = request.ContactId,
                Role = request.Role,
                IsPrimary = request.IsPrimary,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            // If this is set as primary, unset other primaries
            if (request.IsPrimary)
            {
                var existingPrimaries = await _context.OpportunityContactRoles
                    .Where(cr => cr.OpportunityId == opportunityId && cr.IsPrimary && cr.TenantId == tenantId.Value)
                    .ToListAsync();

                foreach (var primary in existingPrimaries)
                {
                    primary.IsPrimary = false;
                }
            }

            _context.OpportunityContactRoles.Add(contactRole);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContactRoles), new { opportunityId }, new ContactRoleDto
            {
                Id = contactRole.Id,
                ContactId = contactRole.ContactId,
                ContactName = contact.FullName,
                ContactEmail = contact.Email,
                ContactPhone = contact.Phone,
                ContactTitle = contact.Title,
                AccountName = contact.Account?.Name,
                Role = contactRole.Role,
                IsPrimary = contactRole.IsPrimary,
                Notes = contactRole.Notes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding contact role to opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a contact role
    /// </summary>
    [HttpPut("contact-roles/{contactRoleId}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateContactRole(Guid opportunityId, Guid contactRoleId, [FromBody] UpdateContactRoleRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var contactRole = await _context.OpportunityContactRoles
                .FirstOrDefaultAsync(cr => cr.Id == contactRoleId && cr.OpportunityId == opportunityId && cr.TenantId == tenantId.Value);

            if (contactRole == null)
                return NotFound(new { message = "Contact role not found" });

            if (request.Role != null) contactRole.Role = request.Role;
            if (request.Notes != null) contactRole.Notes = request.Notes;
            if (request.IsPrimary.HasValue)
            {
                if (request.IsPrimary.Value && !contactRole.IsPrimary)
                {
                    // Unset other primaries
                    var existingPrimaries = await _context.OpportunityContactRoles
                        .Where(cr => cr.OpportunityId == opportunityId && cr.IsPrimary && cr.Id != contactRoleId && cr.TenantId == tenantId.Value)
                        .ToListAsync();

                    foreach (var primary in existingPrimaries)
                    {
                        primary.IsPrimary = false;
                    }
                }
                contactRole.IsPrimary = request.IsPrimary.Value;
            }

            contactRole.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating contact role {ContactRoleId}", contactRoleId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Remove a contact role from an opportunity
    /// </summary>
    [HttpDelete("contact-roles/{contactRoleId}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> RemoveContactRole(Guid opportunityId, Guid contactRoleId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var contactRole = await _context.OpportunityContactRoles
                .FirstOrDefaultAsync(cr => cr.Id == contactRoleId && cr.OpportunityId == opportunityId && cr.TenantId == tenantId.Value);

            if (contactRole == null)
                return NotFound(new { message = "Contact role not found" });

            _context.OpportunityContactRoles.Remove(contactRole);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing contact role {ContactRoleId}", contactRoleId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Field History

    /// <summary>
    /// Get field history for an opportunity
    /// </summary>
    [HttpGet("field-history")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<FieldHistoryDto>>> GetFieldHistory(Guid opportunityId, [FromQuery] int take = 50)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var opportunity = await _context.SalesOpportunities
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            var history = await _context.OpportunityFieldHistories
                .AsNoTracking()
                .Include(h => h.ChangedByUser)
                .Where(h => h.OpportunityId == opportunityId)
                .OrderByDescending(h => h.ChangedAt)
                .Take(take)
                .Select(h => new FieldHistoryDto
                {
                    Id = h.Id,
                    FieldName = h.FieldName,
                    OldValue = h.OldValue,
                    NewValue = h.NewValue,
                    ChangedAt = h.ChangedAt,
                    ChangedByUserId = h.ChangedByUserId,
                    ChangedByUserName = h.ChangedByUser.DisplayName ?? h.ChangedByUser.Email
                })
                .ToListAsync();

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting field history for opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Activity Feed

    /// <summary>
    /// Get combined activity feed for an opportunity (notes + field history)
    /// </summary>
    [HttpGet("activity")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<ActivityFeedItemDto>>> GetActivityFeed(Guid opportunityId, [FromQuery] int take = 50)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var opportunity = await _context.SalesOpportunities
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            // Get notes as activity items
            var noteActivities = await _context.OpportunityNotes
                .AsNoTracking()
                .Where(n => n.OpportunityId == opportunityId && n.TenantId == tenantId.Value)
                .Select(n => new ActivityFeedItemDto
                {
                    Id = n.Id,
                    Type = "note",
                    Subtype = n.NoteType,
                    Content = n.Content,
                    Timestamp = n.CreatedAt,
                    UserId = n.CreatedByUserId,
                    UserName = n.CreatedByUserId != null
                        ? _context.Users.Where(u => u.Id == n.CreatedByUserId).Select(u => u.DisplayName ?? u.Email).FirstOrDefault()
                        : null
                })
                .ToListAsync();

            // Get field history as activity items
            var historyActivities = await _context.OpportunityFieldHistories
                .AsNoTracking()
                .Include(h => h.ChangedByUser)
                .Where(h => h.OpportunityId == opportunityId)
                .Select(h => new ActivityFeedItemDto
                {
                    Id = h.Id,
                    Type = "field_change",
                    Subtype = h.FieldName,
                    Content = $"Changed {h.FieldName} from \"{h.OldValue ?? "(empty)"}\" to \"{h.NewValue ?? "(empty)"}\"",
                    OldValue = h.OldValue,
                    NewValue = h.NewValue,
                    Timestamp = h.ChangedAt,
                    UserId = h.ChangedByUserId,
                    UserName = h.ChangedByUser.DisplayName ?? h.ChangedByUser.Email
                })
                .ToListAsync();

            // Combine and sort
            var allActivities = noteActivities
                .Concat(historyActivities)
                .OrderByDescending(a => a.Timestamp)
                .Take(take)
                .ToList();

            return Ok(allActivities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting activity feed for opportunity {OpportunityId}", opportunityId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

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

#region DTOs

public class OpportunityNoteDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? NoteType { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
}

public class CreateNoteRequest
{
    public required string Content { get; set; }
    public string? NoteType { get; set; }  // General, Call, Email, Meeting, etc.
}

public class UpdateNoteRequest
{
    public required string Content { get; set; }
    public string? NoteType { get; set; }
}

public class TeamMemberDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? Role { get; set; }
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }
}

public class CreateTeamMemberRequest
{
    public required Guid UserId { get; set; }
    public string? Role { get; set; }
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }
}

public class UpdateTeamMemberRequest
{
    public string? Role { get; set; }
    public bool? IsPrimary { get; set; }
    public string? Notes { get; set; }
}

public class ContactRoleDto
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactTitle { get; set; }
    public string? AccountName { get; set; }
    public string? Role { get; set; }
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }
}

public class CreateContactRoleRequest
{
    public required Guid ContactId { get; set; }
    public string? Role { get; set; }
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }
}

public class UpdateContactRoleRequest
{
    public string? Role { get; set; }
    public bool? IsPrimary { get; set; }
    public string? Notes { get; set; }
}

public class FieldHistoryDto
{
    public Guid Id { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime ChangedAt { get; set; }
    public Guid ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
}

public class ActivityFeedItemDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;  // "note" or "field_change"
    public string? Subtype { get; set; }  // Note type or field name
    public string Content { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
}

#endregion
