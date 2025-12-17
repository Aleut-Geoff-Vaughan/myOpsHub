using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/opportunities")]
public class SalesOpportunitiesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesOpportunitiesController> _logger;

    public SalesOpportunitiesController(MySchedulingDbContext context, ILogger<SalesOpportunitiesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all opportunities for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<OpportunityListDto>>> GetOpportunities(
        [FromQuery] Guid? stageId = null,
        [FromQuery] Guid? accountId = null,
        [FromQuery] Guid? ownerId = null,
        [FromQuery] OpportunityResult? result = null,
        [FromQuery] string? search = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.SalesOpportunities
                .AsNoTracking()
                .Include(o => o.Account)
                .Include(o => o.Stage)
                .Include(o => o.Owner)
                .Include(o => o.BiddingEntity)
                .Where(o => o.TenantId == tenantId.Value);

            if (stageId.HasValue)
                query = query.Where(o => o.StageId == stageId.Value);

            if (accountId.HasValue)
                query = query.Where(o => o.AccountId == accountId.Value);

            if (ownerId.HasValue)
                query = query.Where(o => o.OwnerId == ownerId.Value);

            if (result.HasValue)
                query = query.Where(o => o.Result == result.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(o =>
                    o.Name.ToLower().Contains(searchLower) ||
                    o.OpportunityNumber.ToLower().Contains(searchLower) ||
                    (o.Account != null && o.Account.Name.ToLower().Contains(searchLower)));
            }

            var total = await query.CountAsync();
            var opportunities = await query
                .OrderByDescending(o => o.CloseDate)
                .Skip(skip)
                .Take(take)
                .Select(o => new OpportunityListDto
                {
                    Id = o.Id,
                    OpportunityNumber = o.OpportunityNumber,
                    Name = o.Name,
                    AccountName = o.Account != null ? o.Account.Name : null,
                    AccountId = o.AccountId,
                    StageName = o.Stage.Name,
                    StageId = o.StageId,
                    StageColor = o.Stage.Color,
                    OwnerName = o.Owner.DisplayName ?? o.Owner.Email,
                    OwnerId = o.OwnerId,
                    Amount = o.Amount,
                    TotalContractValue = o.TotalContractValue,
                    ProbabilityPercent = o.ProbabilityPercent,
                    WeightedAmount = o.Amount * o.ProbabilityPercent / 100m,
                    CloseDate = o.CloseDate,
                    CloseFiscalYear = o.CloseFiscalYear,
                    Type = o.Type,
                    Result = o.Result,
                    BiddingEntityName = o.BiddingEntity != null ? o.BiddingEntity.Name : null,
                    // Key dates for calendar
                    PlannedRfiSubmissionDate = o.PlannedRfiSubmissionDate,
                    ActualRfiSubmissionDate = o.ActualRfiSubmissionDate,
                    PlannedRfpReleaseDate = o.PlannedRfpReleaseDate,
                    ActualRfpReleaseDate = o.ActualRfpReleaseDate,
                    PlannedProposalSubmissionDate = o.PlannedProposalSubmissionDate,
                    ActualProposalSubmissionDate = o.ActualProposalSubmissionDate,
                    ProjectStartDate = o.ProjectStartDate,
                    ProjectFinishDate = o.ProjectFinishDate
                })
                .ToListAsync();

            return Ok(new { items = opportunities, total });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting opportunities");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a single opportunity with full details
    /// </summary>
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult<SalesOpportunity>> GetOpportunity(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var opportunity = await _context.SalesOpportunities
                .Include(o => o.Account)
                .Include(o => o.Stage)
                .Include(o => o.Owner)
                .Include(o => o.BiddingEntity)
                .Include(o => o.ContractVehicle)
                .Include(o => o.PrimaryContact)
                .Include(o => o.LossReason)
                .Include(o => o.TeamMembers).ThenInclude(tm => tm.User)
                .Include(o => o.ContactRoles).ThenInclude(cr => cr.Contact)
                .Include(o => o.Capabilities)
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            return Ok(opportunity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting opportunity {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new opportunity
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Create)]
    public async Task<ActionResult<SalesOpportunity>> CreateOpportunity([FromBody] CreateOpportunityRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = TryGetCurrentUserId();
            if (!userId.HasValue)
                return BadRequest(new { message = "Invalid user context" });

            // Generate opportunity number
            var lastNumber = await _context.SalesOpportunities
                .Where(o => o.TenantId == tenantId.Value)
                .MaxAsync(o => (int?)int.Parse(o.OpportunityNumber.Replace("OPP-", ""))) ?? 0;
            var opportunityNumber = $"OPP-{(lastNumber + 1):D6}";

            var opportunity = new SalesOpportunity
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                OpportunityNumber = opportunityNumber,
                Name = request.Name,
                Description = request.Description,
                AccountId = request.AccountId,
                BiddingEntityId = request.BiddingEntityId,
                ContractVehicleId = request.ContractVehicleId,
                PrimaryContactId = request.PrimaryContactId,
                OwnerId = request.OwnerId ?? userId.Value,
                StageId = request.StageId,
                Type = request.Type,
                GrowthType = request.GrowthType,
                AcquisitionType = request.AcquisitionType,
                ContractType = request.ContractType,
                OpportunityStatus = request.OpportunityStatus,
                Portfolio = request.Portfolio,
                Amount = request.Amount,
                TotalContractValue = request.TotalContractValue,
                ProbabilityPercent = request.ProbabilityPercent,
                CloseDate = request.CloseDate,
                CloseFiscalYear = request.CloseFiscalYear,
                CloseFiscalQuarter = request.CloseFiscalQuarter,
                IncludedInForecast = request.IncludedInForecast,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId.Value
            };

            _context.SalesOpportunities.Add(opportunity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOpportunity), new { id = opportunity.Id }, opportunity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating opportunity");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update an opportunity
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateOpportunity(Guid id, [FromBody] UpdateOpportunityRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = TryGetCurrentUserId();

            var opportunity = await _context.SalesOpportunities
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            // Update fields if provided
            if (request.Name != null) opportunity.Name = request.Name;
            if (request.Description != null) opportunity.Description = request.Description;
            if (request.AccountId.HasValue) opportunity.AccountId = request.AccountId;
            if (request.BiddingEntityId.HasValue) opportunity.BiddingEntityId = request.BiddingEntityId;
            if (request.ContractVehicleId.HasValue) opportunity.ContractVehicleId = request.ContractVehicleId;
            if (request.PrimaryContactId.HasValue) opportunity.PrimaryContactId = request.PrimaryContactId;
            if (request.OwnerId.HasValue) opportunity.OwnerId = request.OwnerId.Value;
            if (request.StageId.HasValue) opportunity.StageId = request.StageId.Value;
            if (request.Type.HasValue) opportunity.Type = request.Type.Value;
            if (request.GrowthType.HasValue) opportunity.GrowthType = request.GrowthType.Value;
            if (request.AcquisitionType != null) opportunity.AcquisitionType = request.AcquisitionType;
            if (request.ContractType != null) opportunity.ContractType = request.ContractType;
            if (request.OpportunityStatus != null) opportunity.OpportunityStatus = request.OpportunityStatus;
            if (request.Portfolio != null) opportunity.Portfolio = request.Portfolio;
            if (request.Amount.HasValue) opportunity.Amount = request.Amount.Value;
            if (request.TotalContractValue.HasValue) opportunity.TotalContractValue = request.TotalContractValue.Value;
            if (request.ProbabilityPercent.HasValue) opportunity.ProbabilityPercent = request.ProbabilityPercent.Value;
            if (request.CloseDate.HasValue) opportunity.CloseDate = request.CloseDate.Value;
            if (request.CloseFiscalYear != null) opportunity.CloseFiscalYear = request.CloseFiscalYear;
            if (request.CloseFiscalQuarter != null) opportunity.CloseFiscalQuarter = request.CloseFiscalQuarter;
            if (request.IncludedInForecast.HasValue) opportunity.IncludedInForecast = request.IncludedInForecast.Value;
            if (request.Result.HasValue) opportunity.Result = request.Result;
            if (request.LossReasonId.HasValue) opportunity.LossReasonId = request.LossReasonId;
            if (request.CustomerFeedback != null) opportunity.CustomerFeedback = request.CustomerFeedback;

            opportunity.UpdatedAt = DateTime.UtcNow;
            if (userId.HasValue)
                opportunity.UpdatedByUserId = userId.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating opportunity {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete an opportunity (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteOpportunity(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var opportunity = await _context.SalesOpportunities
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId.Value);

            if (opportunity == null)
                return NotFound(new { message = "Opportunity not found" });

            opportunity.IsDeleted = true;
            opportunity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting opportunity {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get pipeline summary by stage
    /// </summary>
    [HttpGet("pipeline-summary")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Read)]
    public async Task<ActionResult> GetPipelineSummary()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var summary = await _context.SalesOpportunities
                .Where(o => o.TenantId == tenantId.Value && o.Result == null)
                .GroupBy(o => new { o.StageId, o.Stage.Name, o.Stage.SortOrder, o.Stage.Color })
                .Select(g => new
                {
                    StageId = g.Key.StageId,
                    StageName = g.Key.Name,
                    SortOrder = g.Key.SortOrder,
                    Color = g.Key.Color,
                    Count = g.Count(),
                    TotalAmount = g.Sum(o => o.Amount),
                    WeightedAmount = g.Sum(o => o.Amount * o.ProbabilityPercent / 100m),
                    TotalTcv = g.Sum(o => o.TotalContractValue)
                })
                .OrderBy(s => s.SortOrder)
                .ToListAsync();

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pipeline summary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Seed comprehensive test data for Sales Ops module
    /// </summary>
    [HttpPost("seed-test-data")]
    [RequiresPermission(Resource = "SalesOpportunity", Action = PermissionAction.Create)]
    public async Task<ActionResult> SeedTestData()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = TryGetCurrentUserId();
            if (!userId.HasValue)
                return BadRequest(new { message = "Invalid user context" });

            var now = DateTime.UtcNow;
            var results = new Dictionary<string, int>();

            // 1. Seed Stages (if not exist)
            var stagesExist = await _context.SalesStages.AnyAsync(s => s.TenantId == tenantId.Value);
            List<SalesStage> stages;
            if (!stagesExist)
            {
                stages = new List<SalesStage>
                {
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Lead", Code = "LEAD", DefaultProbability = 10, Color = "#94a3b8", SortOrder = 0, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Qualified", Code = "QUAL", DefaultProbability = 25, Color = "#3b82f6", SortOrder = 1, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Active Capture", Code = "CAPTURE", DefaultProbability = 50, Color = "#8b5cf6", SortOrder = 2, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Proposal", Code = "PROP", DefaultProbability = 60, Color = "#f59e0b", SortOrder = 3, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Proposal Submitted", Code = "SUBM", DefaultProbability = 70, Color = "#10b981", SortOrder = 4, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Negotiation", Code = "NEGO", DefaultProbability = 85, Color = "#06b6d4", SortOrder = 5, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Closed Won", Code = "WON", DefaultProbability = 100, Color = "#22c55e", SortOrder = 6, IsActive = true, IsWonStage = true, IsClosedStage = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Closed Lost", Code = "LOST", DefaultProbability = 0, Color = "#ef4444", SortOrder = 7, IsActive = true, IsLostStage = true, IsClosedStage = true, CreatedAt = now },
                };
                _context.SalesStages.AddRange(stages);
                results["stages"] = stages.Count;
            }
            else
            {
                stages = await _context.SalesStages.Where(s => s.TenantId == tenantId.Value).ToListAsync();
            }

            // 2. Seed Accounts
            var accountsExist = await _context.SalesAccounts.AnyAsync(a => a.TenantId == tenantId.Value);
            List<SalesAccount> accounts;
            if (!accountsExist)
            {
                accounts = new List<SalesAccount>
                {
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Department of Defense", Acronym = "DoD", AccountType = "Federal", FederalDepartment = "DoD", Portfolio = "Defense", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Department of Homeland Security", Acronym = "DHS", AccountType = "Federal", FederalDepartment = "DHS", Portfolio = "Civilian", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Department of Health and Human Services", Acronym = "HHS", AccountType = "Federal", FederalDepartment = "HHS", Portfolio = "Civilian", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Department of Veterans Affairs", Acronym = "VA", AccountType = "Federal", FederalDepartment = "VA", Portfolio = "Civilian", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "General Services Administration", Acronym = "GSA", AccountType = "Federal", FederalDepartment = "GSA", Portfolio = "Civilian", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "US Army", Acronym = "Army", AccountType = "Federal", FederalDepartment = "DoD", Portfolio = "Defense", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "US Navy", Acronym = "Navy", AccountType = "Federal", FederalDepartment = "DoD", Portfolio = "Defense", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "US Air Force", Acronym = "USAF", AccountType = "Federal", FederalDepartment = "DoD", Portfolio = "Defense", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Centers for Medicare & Medicaid Services", Acronym = "CMS", AccountType = "Federal", FederalDepartment = "HHS", Portfolio = "Civilian", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Defense Information Systems Agency", Acronym = "DISA", AccountType = "Federal", FederalDepartment = "DoD", Portfolio = "Defense", IsActive = true, CreatedAt = now },
                };
                _context.SalesAccounts.AddRange(accounts);
                results["accounts"] = accounts.Count;
            }
            else
            {
                accounts = await _context.SalesAccounts.Where(a => a.TenantId == tenantId.Value).ToListAsync();
            }

            // 3. Seed Bidding Entities
            var entitiesExist = await _context.BiddingEntities.AnyAsync(e => e.TenantId == tenantId.Value);
            List<BiddingEntity> biddingEntities;
            if (!entitiesExist)
            {
                biddingEntities = new List<BiddingEntity>
                {
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Primary Corp", LegalName = "Primary Corporation LLC", ShortName = "PC", CageCode = "1ABC2", UeiNumber = "ABC123456789", Is8a = true, SbaEntryDate = now.AddYears(-3), SbaExpirationDate = now.AddYears(6), IsSmallBusiness = true, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Tech Solutions Inc", LegalName = "Tech Solutions Incorporated", ShortName = "TSI", CageCode = "2DEF3", UeiNumber = "DEF234567890", Is8a = false, IsSmallBusiness = true, IsSDVOSB = true, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Federal Services Group", LegalName = "Federal Services Group LLC", ShortName = "FSG", CageCode = "3GHI4", UeiNumber = "GHI345678901", Is8a = false, IsSmallBusiness = false, IsActive = true, CreatedAt = now },
                };
                _context.BiddingEntities.AddRange(biddingEntities);
                results["biddingEntities"] = biddingEntities.Count;
            }
            else
            {
                biddingEntities = await _context.BiddingEntities.Where(e => e.TenantId == tenantId.Value).ToListAsync();
            }

            // 4. Seed Contacts
            var contactsExist = await _context.SalesContacts.AnyAsync(c => c.TenantId == tenantId.Value);
            List<SalesContact> contacts;
            if (!contactsExist)
            {
                contacts = new List<SalesContact>
                {
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[0].Id, FirstName = "John", LastName = "Smith", Title = "Contracting Officer", Email = "john.smith@dod.gov", Phone = "703-555-0101", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[0].Id, FirstName = "Sarah", LastName = "Johnson", Title = "Program Manager", Email = "sarah.johnson@dod.gov", Phone = "703-555-0102", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[1].Id, FirstName = "Michael", LastName = "Williams", Title = "COR", Email = "michael.williams@dhs.gov", Phone = "202-555-0201", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[2].Id, FirstName = "Emily", LastName = "Brown", Title = "Technical Lead", Email = "emily.brown@hhs.gov", Phone = "301-555-0301", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[3].Id, FirstName = "David", LastName = "Davis", Title = "IT Director", Email = "david.davis@va.gov", Phone = "202-555-0401", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[4].Id, FirstName = "Jennifer", LastName = "Miller", Title = "Contracting Specialist", Email = "jennifer.miller@gsa.gov", Phone = "202-555-0501", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[5].Id, FirstName = "Robert", LastName = "Wilson", Title = "G6 Chief", Email = "robert.wilson@army.mil", Phone = "571-555-0601", IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, AccountId = accounts[6].Id, FirstName = "Lisa", LastName = "Anderson", Title = "SPAWAR PM", Email = "lisa.anderson@navy.mil", Phone = "619-555-0701", IsActive = true, CreatedAt = now },
                };
                _context.SalesContacts.AddRange(contacts);
                results["contacts"] = contacts.Count;
            }
            else
            {
                contacts = await _context.SalesContacts.Where(c => c.TenantId == tenantId.Value).ToListAsync();
            }

            // 5. Seed Contract Vehicles
            var vehiclesExist = await _context.ContractVehicles.AnyAsync(v => v.TenantId == tenantId.Value);
            List<ContractVehicle> vehicles;
            if (!vehiclesExist)
            {
                vehicles = new List<ContractVehicle>
                {
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "SEWP V", ContractNumber = "NNG15SD00B", VehicleType = "GWAC", IssuingAgency = "NASA", AwardDate = now.AddYears(-5), ExpirationDate = now.AddYears(5), CeilingValue = 20000000000m, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Alliant 2", ContractNumber = "47QTCA18D00XX", VehicleType = "GWAC", IssuingAgency = "GSA", AwardDate = now.AddYears(-4), ExpirationDate = now.AddYears(6), CeilingValue = 50000000000m, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "GSA IT Schedule 70", ContractNumber = "GS-35F-XXXX", VehicleType = "GSA Schedule", IssuingAgency = "GSA", AwardDate = now.AddYears(-3), ExpirationDate = now.AddYears(2), IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "CIO-SP3 SB", ContractNumber = "75N98120DXXXX", VehicleType = "GWAC", IssuingAgency = "NIH", AwardDate = now.AddYears(-2), ExpirationDate = now.AddYears(8), CeilingValue = 20000000000m, BiddingEntityId = biddingEntities[0].Id, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "OASIS SB Pool 1", ContractNumber = "47QRAA20DXXXX", VehicleType = "IDIQ", IssuingAgency = "GSA", AwardDate = now.AddYears(-3), ExpirationDate = now.AddYears(7), CeilingValue = 60000000000m, BiddingEntityId = biddingEntities[0].Id, IsActive = true, CreatedAt = now },
                    new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "T4NG", ContractNumber = "VA118-16-D-XXXX", VehicleType = "IDIQ", IssuingAgency = "VA", AwardDate = now.AddYears(-4), ExpirationDate = now.AddYears(1), CeilingValue = 22500000000m, IsActive = true, CreatedAt = now },
                };
                _context.ContractVehicles.AddRange(vehicles);
                results["contractVehicles"] = vehicles.Count;
            }
            else
            {
                vehicles = await _context.ContractVehicles.Where(v => v.TenantId == tenantId.Value).ToListAsync();
            }

            await _context.SaveChangesAsync();

            // 6. Seed Opportunities (only if we have stages, accounts, and entities)
            var oppsExist = await _context.SalesOpportunities.AnyAsync(o => o.TenantId == tenantId.Value);
            if (!oppsExist && stages.Count > 0 && accounts.Count > 0)
            {
                var random = new Random(42); // Deterministic for repeatability
                var opportunityNames = new[]
                {
                    "Enterprise IT Modernization", "Cloud Migration Support", "Cybersecurity Assessment",
                    "Data Analytics Platform", "Help Desk Support Services", "Network Infrastructure Upgrade",
                    "Software Development Support", "AI/ML Implementation", "DevSecOps Transformation",
                    "Zero Trust Architecture", "Digital Transformation Initiative", "IT Service Management",
                    "Application Modernization", "Identity Management System", "Endpoint Security Solution",
                    "Managed Security Services", "Business Process Automation", "Data Center Consolidation",
                    "Unified Communications", "Agile Development Support"
                };

                var opportunities = new List<SalesOpportunity>();
                var openStages = stages.Where(s => !s.IsClosedStage).ToList();
                var wonStage = stages.FirstOrDefault(s => s.IsWonStage);
                var lostStage = stages.FirstOrDefault(s => s.IsLostStage);

                for (int i = 0; i < opportunityNames.Length; i++)
                {
                    var account = accounts[random.Next(accounts.Count)];
                    var stage = openStages[random.Next(openStages.Count)];
                    var entity = biddingEntities.Count > 0 ? biddingEntities[random.Next(biddingEntities.Count)] : null;
                    var vehicle = vehicles.Count > 0 && random.Next(3) > 0 ? vehicles[random.Next(vehicles.Count)] : null;
                    var contact = contacts.Where(c => c.AccountId == account.Id).FirstOrDefault();

                    var amount = random.Next(50, 500) * 10000m; // 500K to 5M
                    var tcv = amount * random.Next(3, 8); // 3-7 year contract
                    var daysToClose = random.Next(30, 365);

                    // Some opportunities should be Won or Lost
                    OpportunityResult? result = null;
                    if (i < 3 && wonStage != null)
                    {
                        stage = wonStage;
                        result = OpportunityResult.Won;
                        daysToClose = -random.Next(30, 180); // Closed in the past
                    }
                    else if (i >= 3 && i < 5 && lostStage != null)
                    {
                        stage = lostStage;
                        result = OpportunityResult.Lost;
                        daysToClose = -random.Next(30, 180);
                    }

                    opportunities.Add(new SalesOpportunity
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId.Value,
                        OpportunityNumber = $"OPP-{(i + 1):D6}",
                        Name = opportunityNames[i],
                        Description = $"Federal contract opportunity for {opportunityNames[i].ToLower()} services at {account.Acronym}.",
                        AccountId = account.Id,
                        BiddingEntityId = entity?.Id,
                        ContractVehicleId = vehicle?.Id,
                        PrimaryContactId = contact?.Id,
                        OwnerId = userId.Value,
                        StageId = stage.Id,
                        Type = (OpportunityType)random.Next(5),
                        GrowthType = (GrowthType)random.Next(3),
                        AcquisitionType = new[] { "Full and Open", "8(a) Set-Aside", "Small Business", "SDVOSB" }[random.Next(4)],
                        ContractType = new[] { "FFP", "T&M", "Cost Plus", "IDIQ" }[random.Next(4)],
                        Amount = amount,
                        TotalContractValue = tcv,
                        ProbabilityPercent = stage.DefaultProbability,
                        CloseDate = now.AddDays(daysToClose),
                        CloseFiscalYear = $"FY{now.AddDays(daysToClose).Year - (now.AddDays(daysToClose).Month < 10 ? 1 : 0) + 1}",
                        IncludedInForecast = true,
                        Result = result,
                        PlannedRfpReleaseDate = now.AddDays(daysToClose - 90),
                        PlannedProposalSubmissionDate = now.AddDays(daysToClose - 30),
                        ProjectStartDate = now.AddDays(daysToClose + 30),
                        DurationMonths = random.Next(36, 84),
                        SolicitationNumber = $"SOL-{random.Next(100000, 999999)}",
                        Priority = new[] { "Standard", "High", "Critical" }[random.Next(3)],
                        NextStep = $"Follow up with {contact?.FirstName ?? "POC"} on technical requirements",
                        CreatedAt = now.AddDays(-random.Next(30, 180)),
                        CreatedByUserId = userId.Value
                    });
                }

                _context.SalesOpportunities.AddRange(opportunities);
                await _context.SaveChangesAsync();
                results["opportunities"] = opportunities.Count;
            }

            _logger.LogInformation("Seeded Sales Ops test data for tenant {TenantId}: {@Results}", tenantId.Value, results);
            return Ok(new { message = "Test data seeded successfully", seeded = results });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding test data");
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
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

#region DTOs

public class OpportunityListDto
{
    public Guid Id { get; set; }
    public string OpportunityNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AccountName { get; set; }
    public Guid? AccountId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public string? StageColor { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public decimal Amount { get; set; }
    public decimal TotalContractValue { get; set; }
    public int ProbabilityPercent { get; set; }
    public decimal WeightedAmount { get; set; }
    public DateTime CloseDate { get; set; }
    public string? CloseFiscalYear { get; set; }
    public OpportunityType Type { get; set; }
    public OpportunityResult? Result { get; set; }
    public string? BiddingEntityName { get; set; }

    // Key dates for calendar view
    public DateTime? PlannedRfiSubmissionDate { get; set; }
    public DateTime? ActualRfiSubmissionDate { get; set; }
    public DateTime? PlannedRfpReleaseDate { get; set; }
    public DateTime? ActualRfpReleaseDate { get; set; }
    public DateTime? PlannedProposalSubmissionDate { get; set; }
    public DateTime? ActualProposalSubmissionDate { get; set; }
    public DateTime? ProjectStartDate { get; set; }
    public DateTime? ProjectFinishDate { get; set; }
}

public class CreateOpportunityRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public Guid? AccountId { get; set; }
    public Guid? BiddingEntityId { get; set; }
    public Guid? ContractVehicleId { get; set; }
    public Guid? PrimaryContactId { get; set; }
    public Guid? OwnerId { get; set; }
    public required Guid StageId { get; set; }
    public OpportunityType Type { get; set; }
    public GrowthType GrowthType { get; set; }
    public string? AcquisitionType { get; set; }  // Dynamic picklist value
    public string? ContractType { get; set; }     // Dynamic picklist value
    public string? OpportunityStatus { get; set; } // Dynamic picklist value
    public string? Portfolio { get; set; }         // Dynamic picklist value
    public decimal Amount { get; set; }
    public decimal TotalContractValue { get; set; }
    public int ProbabilityPercent { get; set; }
    public required DateTime CloseDate { get; set; }
    public string? CloseFiscalYear { get; set; }
    public string? CloseFiscalQuarter { get; set; }
    public bool IncludedInForecast { get; set; }
}

public class UpdateOpportunityRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? AccountId { get; set; }
    public Guid? BiddingEntityId { get; set; }
    public Guid? ContractVehicleId { get; set; }
    public Guid? PrimaryContactId { get; set; }
    public Guid? OwnerId { get; set; }
    public Guid? StageId { get; set; }
    public OpportunityType? Type { get; set; }
    public GrowthType? GrowthType { get; set; }
    public string? AcquisitionType { get; set; }   // Dynamic picklist value
    public string? ContractType { get; set; }      // Dynamic picklist value
    public string? OpportunityStatus { get; set; } // Dynamic picklist value
    public string? Portfolio { get; set; }         // Dynamic picklist value
    public decimal? Amount { get; set; }
    public decimal? TotalContractValue { get; set; }
    public int? ProbabilityPercent { get; set; }
    public DateTime? CloseDate { get; set; }
    public string? CloseFiscalYear { get; set; }
    public string? CloseFiscalQuarter { get; set; }
    public bool? IncludedInForecast { get; set; }
    public OpportunityResult? Result { get; set; }
    public Guid? LossReasonId { get; set; }
    public string? CustomerFeedback { get; set; }
}

#endregion
