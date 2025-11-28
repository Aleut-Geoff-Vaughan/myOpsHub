using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Infrastructure.Services;

public interface IFacilitiesExcelService
{
    // Export methods
    Task<byte[]> ExportOfficesToExcelAsync(Guid tenantId);
    Task<byte[]> ExportSpacesToExcelAsync(Guid tenantId, Guid? officeId = null);
    Task<byte[]> ExportFloorsToExcelAsync(Guid tenantId, Guid? officeId = null);
    Task<byte[]> ExportZonesToExcelAsync(Guid tenantId, Guid? officeId = null);
    Task<byte[]> ExportSpaceAssignmentsToExcelAsync(Guid tenantId);
    Task<byte[]> ExportBookingRulesToExcelAsync(Guid tenantId);

    // Import methods
    Task<ImportResult> ImportOfficesFromExcelAsync(Guid tenantId, Stream fileStream);
    Task<ImportResult> ImportSpacesFromExcelAsync(Guid tenantId, Stream fileStream);
    Task<ImportResult> ImportFloorsFromExcelAsync(Guid tenantId, Stream fileStream);
    Task<ImportResult> ImportZonesFromExcelAsync(Guid tenantId, Stream fileStream);
    Task<ImportResult> ImportSpaceAssignmentsFromExcelAsync(Guid tenantId, Stream fileStream);

    // Template methods
    byte[] GetOfficesTemplate();
    byte[] GetSpacesTemplate();
    byte[] GetFloorsTemplate();
    byte[] GetZonesTemplate();
    byte[] GetSpaceAssignmentsTemplate();
}

public class ImportResult
{
    public bool Success { get; set; }
    public int RowsProcessed { get; set; }
    public int RowsSucceeded { get; set; }
    public int RowsFailed { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

public class ImportError
{
    public int Row { get; set; }
    public string Column { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class FacilitiesExcelService : IFacilitiesExcelService
{
    private readonly MySchedulingDbContext _context;

    public FacilitiesExcelService(MySchedulingDbContext context)
    {
        _context = context;
    }

    #region Export Methods

    public async Task<byte[]> ExportOfficesToExcelAsync(Guid tenantId)
    {
        var offices = await _context.Offices
            .Where(o => o.TenantId == tenantId && !o.IsDeleted)
            .OrderBy(o => o.Name)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Offices");

        // Headers
        var headers = new[] { "Name", "Address", "Address2", "City", "StateCode", "CountryCode", "Timezone", "Status", "IsClientSite", "IconUrl", "Latitude", "Longitude" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Data
        int row = 2;
        foreach (var office in offices)
        {
            worksheet.Cell(row, 1).Value = office.Name;
            worksheet.Cell(row, 2).Value = office.Address ?? "";
            worksheet.Cell(row, 3).Value = office.Address2 ?? "";
            worksheet.Cell(row, 4).Value = office.City ?? "";
            worksheet.Cell(row, 5).Value = office.StateCode ?? "";
            worksheet.Cell(row, 6).Value = office.CountryCode ?? "";
            worksheet.Cell(row, 7).Value = office.Timezone ?? "";
            worksheet.Cell(row, 8).Value = office.Status.ToString();
            worksheet.Cell(row, 9).Value = office.IsClientSite;
            worksheet.Cell(row, 10).Value = office.IconUrl ?? "";
            worksheet.Cell(row, 11).Value = office.Latitude?.ToString() ?? "";
            worksheet.Cell(row, 12).Value = office.Longitude?.ToString() ?? "";
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportSpacesToExcelAsync(Guid tenantId, Guid? officeId = null)
    {
        var query = _context.Spaces
            .Include(s => s.Office)
            .Include(s => s.Floor)
            .Include(s => s.Zone)
            .Where(s => s.TenantId == tenantId && !s.IsDeleted);

        if (officeId.HasValue)
        {
            query = query.Where(s => s.OfficeId == officeId.Value);
        }

        var spaces = await query.OrderBy(s => s.Office.Name).ThenBy(s => s.Name).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Spaces");

        // Headers
        var headers = new[] { "OfficeName", "FloorName", "ZoneName", "Name", "Type", "Capacity", "RequiresApproval", "IsActive", "Equipment", "Features", "DailyCost", "MaxBookingDays", "AvailabilityType" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Data
        int row = 2;
        foreach (var space in spaces)
        {
            worksheet.Cell(row, 1).Value = space.Office?.Name ?? "";
            worksheet.Cell(row, 2).Value = space.Floor?.Name ?? "";
            worksheet.Cell(row, 3).Value = space.Zone?.Name ?? "";
            worksheet.Cell(row, 4).Value = space.Name;
            worksheet.Cell(row, 5).Value = space.Type.ToString();
            worksheet.Cell(row, 6).Value = space.Capacity;
            worksheet.Cell(row, 7).Value = space.RequiresApproval;
            worksheet.Cell(row, 8).Value = space.IsActive;
            worksheet.Cell(row, 9).Value = space.Equipment ?? "";
            worksheet.Cell(row, 10).Value = space.Features ?? "";
            worksheet.Cell(row, 11).Value = space.DailyCost?.ToString() ?? "";
            worksheet.Cell(row, 12).Value = space.MaxBookingDays?.ToString() ?? "";
            worksheet.Cell(row, 13).Value = space.AvailabilityType.ToString();
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportFloorsToExcelAsync(Guid tenantId, Guid? officeId = null)
    {
        var query = _context.Floors
            .Include(f => f.Office)
            .Where(f => f.TenantId == tenantId && !f.IsDeleted);

        if (officeId.HasValue)
        {
            query = query.Where(f => f.OfficeId == officeId.Value);
        }

        var floors = await query.OrderBy(f => f.Office.Name).ThenBy(f => f.Level).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Floors");

        // Headers
        var headers = new[] { "OfficeName", "Name", "Level", "SquareFootage", "FloorPlanUrl", "IsActive" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Data
        int row = 2;
        foreach (var floor in floors)
        {
            worksheet.Cell(row, 1).Value = floor.Office?.Name ?? "";
            worksheet.Cell(row, 2).Value = floor.Name;
            worksheet.Cell(row, 3).Value = floor.Level;
            worksheet.Cell(row, 4).Value = floor.SquareFootage?.ToString() ?? "";
            worksheet.Cell(row, 5).Value = floor.FloorPlanUrl ?? "";
            worksheet.Cell(row, 6).Value = floor.IsActive;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportZonesToExcelAsync(Guid tenantId, Guid? officeId = null)
    {
        var query = _context.Zones
            .Include(z => z.Floor)
            .ThenInclude(f => f.Office)
            .Where(z => z.TenantId == tenantId && !z.IsDeleted);

        if (officeId.HasValue)
        {
            query = query.Where(z => z.Floor.OfficeId == officeId.Value);
        }

        var zones = await query.OrderBy(z => z.Floor.Office.Name).ThenBy(z => z.Floor.Name).ThenBy(z => z.Name).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Zones");

        // Headers
        var headers = new[] { "OfficeName", "FloorName", "Name", "Description", "Color", "IsActive" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Data
        int row = 2;
        foreach (var zone in zones)
        {
            worksheet.Cell(row, 1).Value = zone.Floor?.Office?.Name ?? "";
            worksheet.Cell(row, 2).Value = zone.Floor?.Name ?? "";
            worksheet.Cell(row, 3).Value = zone.Name;
            worksheet.Cell(row, 4).Value = zone.Description ?? "";
            worksheet.Cell(row, 5).Value = zone.Color ?? "";
            worksheet.Cell(row, 6).Value = zone.IsActive;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportSpaceAssignmentsToExcelAsync(Guid tenantId)
    {
        var assignments = await _context.SpaceAssignments
            .Include(a => a.Space)
            .ThenInclude(s => s.Office)
            .Include(a => a.User)
            .Where(a => a.TenantId == tenantId && !a.IsDeleted)
            .OrderBy(a => a.Space.Office.Name)
            .ThenBy(a => a.Space.Name)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("SpaceAssignments");

        // Headers
        var headers = new[] { "OfficeName", "SpaceName", "UserEmail", "StartDate", "EndDate", "Type", "Status", "Notes" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Data
        int row = 2;
        foreach (var assignment in assignments)
        {
            worksheet.Cell(row, 1).Value = assignment.Space?.Office?.Name ?? "";
            worksheet.Cell(row, 2).Value = assignment.Space?.Name ?? "";
            worksheet.Cell(row, 3).Value = assignment.User?.Email ?? "";
            worksheet.Cell(row, 4).Value = assignment.StartDate.ToString("yyyy-MM-dd");
            worksheet.Cell(row, 5).Value = assignment.EndDate?.ToString("yyyy-MM-dd") ?? "";
            worksheet.Cell(row, 6).Value = assignment.Type.ToString();
            worksheet.Cell(row, 7).Value = assignment.Status.ToString();
            worksheet.Cell(row, 8).Value = assignment.Notes ?? "";
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportBookingRulesToExcelAsync(Guid tenantId)
    {
        var rules = await _context.BookingRules
            .Include(r => r.Office)
            .Include(r => r.Space)
            .Where(r => r.TenantId == tenantId && !r.IsDeleted)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.Name)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("BookingRules");

        // Headers
        var headers = new[] { "Name", "Description", "OfficeName", "SpaceName", "SpaceType", "MinDurationMinutes", "MaxDurationMinutes", "MaxAdvanceBookingDays", "EarliestStartTime", "LatestEndTime", "AllowRecurring", "RequiresApproval", "Priority", "IsActive" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Data
        int row = 2;
        foreach (var rule in rules)
        {
            worksheet.Cell(row, 1).Value = rule.Name;
            worksheet.Cell(row, 2).Value = rule.Description ?? "";
            worksheet.Cell(row, 3).Value = rule.Office?.Name ?? "(All Offices)";
            worksheet.Cell(row, 4).Value = rule.Space?.Name ?? "(All Spaces)";
            worksheet.Cell(row, 5).Value = rule.SpaceType?.ToString() ?? "(All Types)";
            worksheet.Cell(row, 6).Value = rule.MinDurationMinutes?.ToString() ?? "";
            worksheet.Cell(row, 7).Value = rule.MaxDurationMinutes?.ToString() ?? "";
            worksheet.Cell(row, 8).Value = rule.MaxAdvanceBookingDays?.ToString() ?? "";
            worksheet.Cell(row, 9).Value = rule.EarliestStartTime?.ToString() ?? "";
            worksheet.Cell(row, 10).Value = rule.LatestEndTime?.ToString() ?? "";
            worksheet.Cell(row, 11).Value = rule.AllowRecurring;
            worksheet.Cell(row, 12).Value = rule.RequiresApproval;
            worksheet.Cell(row, 13).Value = rule.Priority;
            worksheet.Cell(row, 14).Value = rule.IsActive;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    #endregion

    #region Import Methods

    public async Task<ImportResult> ImportOfficesFromExcelAsync(Guid tenantId, Stream fileStream)
    {
        var result = new ImportResult();

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1); // Skip header row

        foreach (var row in rows)
        {
            result.RowsProcessed++;
            try
            {
                var name = row.Cell(1).GetString().Trim();
                if (string.IsNullOrEmpty(name))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "Name", Message = "Name is required" });
                    result.RowsFailed++;
                    continue;
                }

                // Check for existing office with same name
                var existing = await _context.Offices.FirstOrDefaultAsync(o => o.TenantId == tenantId && o.Name == name && !o.IsDeleted);

                if (existing != null)
                {
                    // Update existing
                    existing.Address = row.Cell(2).GetString();
                    existing.Address2 = row.Cell(3).GetString();
                    existing.City = row.Cell(4).GetString();
                    existing.StateCode = row.Cell(5).GetString();
                    existing.CountryCode = row.Cell(6).GetString();
                    existing.Timezone = row.Cell(7).GetString();
                    existing.Status = Enum.TryParse<OfficeStatus>(row.Cell(8).GetString(), true, out var status) ? status : OfficeStatus.Active;
                    existing.IsClientSite = row.Cell(9).GetString().Equals("true", StringComparison.OrdinalIgnoreCase);
                    existing.IconUrl = row.Cell(10).GetString();
                    existing.Latitude = double.TryParse(row.Cell(11).GetString(), out var lat) ? lat : null;
                    existing.Longitude = double.TryParse(row.Cell(12).GetString(), out var lng) ? lng : null;
                }
                else
                {
                    // Create new
                    var office = new Office
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = name,
                        Address = row.Cell(2).GetString(),
                        Address2 = row.Cell(3).GetString(),
                        City = row.Cell(4).GetString(),
                        StateCode = row.Cell(5).GetString(),
                        CountryCode = row.Cell(6).GetString(),
                        Timezone = row.Cell(7).GetString(),
                        Status = Enum.TryParse<OfficeStatus>(row.Cell(8).GetString(), true, out var status) ? status : OfficeStatus.Active,
                        IsClientSite = row.Cell(9).GetString().Equals("true", StringComparison.OrdinalIgnoreCase),
                        IconUrl = row.Cell(10).GetString(),
                        Latitude = double.TryParse(row.Cell(11).GetString(), out var lat) ? lat : null,
                        Longitude = double.TryParse(row.Cell(12).GetString(), out var lng) ? lng : null
                    };
                    _context.Offices.Add(office);
                }

                result.RowsSucceeded++;
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "General", Message = ex.Message });
                result.RowsFailed++;
            }
        }

        await _context.SaveChangesAsync();
        result.Success = result.RowsFailed == 0;
        return result;
    }

    public async Task<ImportResult> ImportSpacesFromExcelAsync(Guid tenantId, Stream fileStream)
    {
        var result = new ImportResult();

        // Pre-load offices, floors, and zones for lookup
        var offices = await _context.Offices.Where(o => o.TenantId == tenantId && !o.IsDeleted).ToDictionaryAsync(o => o.Name, o => o.Id);
        var floors = await _context.Floors.Where(f => f.TenantId == tenantId && !f.IsDeleted).ToDictionaryAsync(f => $"{f.Office.Name}|{f.Name}", f => f.Id);
        var zones = await _context.Zones.Include(z => z.Floor).ThenInclude(f => f.Office).Where(z => z.TenantId == tenantId && !z.IsDeleted).ToDictionaryAsync(z => $"{z.Floor.Office.Name}|{z.Floor.Name}|{z.Name}", z => z.Id);

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1);

        foreach (var row in rows)
        {
            result.RowsProcessed++;
            try
            {
                var officeName = row.Cell(1).GetString().Trim();
                var spaceName = row.Cell(4).GetString().Trim();

                if (string.IsNullOrEmpty(officeName) || string.IsNullOrEmpty(spaceName))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName/Name", Message = "OfficeName and Name are required" });
                    result.RowsFailed++;
                    continue;
                }

                if (!offices.TryGetValue(officeName, out var officeId))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName", Message = $"Office '{officeName}' not found" });
                    result.RowsFailed++;
                    continue;
                }

                // Parse floor and zone
                Guid? floorId = null;
                Guid? zoneId = null;
                var floorName = row.Cell(2).GetString().Trim();
                var zoneName = row.Cell(3).GetString().Trim();

                if (!string.IsNullOrEmpty(floorName) && floors.TryGetValue($"{officeName}|{floorName}", out var fId))
                {
                    floorId = fId;
                    if (!string.IsNullOrEmpty(zoneName) && zones.TryGetValue($"{officeName}|{floorName}|{zoneName}", out var zId))
                    {
                        zoneId = zId;
                    }
                }

                // Parse space type
                var typeString = row.Cell(5).GetString().Trim();
                if (!Enum.TryParse<SpaceType>(typeString, true, out var spaceType))
                {
                    spaceType = SpaceType.HotDesk;
                }

                // Parse availability type
                var availString = row.Cell(13).GetString().Trim();
                if (!Enum.TryParse<SpaceAvailabilityType>(availString, true, out var availType))
                {
                    availType = SpaceAvailabilityType.Shared;
                }

                // Check for existing space with same name in same office
                var existing = await _context.Spaces.FirstOrDefaultAsync(s => s.TenantId == tenantId && s.OfficeId == officeId && s.Name == spaceName && !s.IsDeleted);

                if (existing != null)
                {
                    // Update existing
                    existing.FloorId = floorId;
                    existing.ZoneId = zoneId;
                    existing.Type = spaceType;
                    existing.Capacity = int.TryParse(row.Cell(6).GetString(), out var cap) ? cap : 1;
                    existing.RequiresApproval = row.Cell(7).GetString().Equals("true", StringComparison.OrdinalIgnoreCase);
                    existing.IsActive = row.Cell(8).GetString().Equals("true", StringComparison.OrdinalIgnoreCase);
                    existing.Equipment = row.Cell(9).GetString();
                    existing.Features = row.Cell(10).GetString();
                    existing.DailyCost = decimal.TryParse(row.Cell(11).GetString(), out var cost) ? cost : null;
                    existing.MaxBookingDays = int.TryParse(row.Cell(12).GetString(), out var days) ? days : null;
                    existing.AvailabilityType = availType;
                }
                else
                {
                    var space = new Space
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        OfficeId = officeId,
                        FloorId = floorId,
                        ZoneId = zoneId,
                        Name = spaceName,
                        Type = spaceType,
                        Capacity = int.TryParse(row.Cell(6).GetString(), out var cap) ? cap : 1,
                        RequiresApproval = row.Cell(7).GetString().Equals("true", StringComparison.OrdinalIgnoreCase),
                        IsActive = !row.Cell(8).GetString().Equals("false", StringComparison.OrdinalIgnoreCase),
                        Equipment = row.Cell(9).GetString(),
                        Features = row.Cell(10).GetString(),
                        DailyCost = decimal.TryParse(row.Cell(11).GetString(), out var cost) ? cost : null,
                        MaxBookingDays = int.TryParse(row.Cell(12).GetString(), out var days) ? days : null,
                        AvailabilityType = availType
                    };
                    _context.Spaces.Add(space);
                }

                result.RowsSucceeded++;
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "General", Message = ex.Message });
                result.RowsFailed++;
            }
        }

        await _context.SaveChangesAsync();
        result.Success = result.RowsFailed == 0;
        return result;
    }

    public async Task<ImportResult> ImportFloorsFromExcelAsync(Guid tenantId, Stream fileStream)
    {
        var result = new ImportResult();

        var offices = await _context.Offices.Where(o => o.TenantId == tenantId && !o.IsDeleted).ToDictionaryAsync(o => o.Name, o => o.Id);

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1);

        foreach (var row in rows)
        {
            result.RowsProcessed++;
            try
            {
                var officeName = row.Cell(1).GetString().Trim();
                var floorName = row.Cell(2).GetString().Trim();

                if (string.IsNullOrEmpty(officeName) || string.IsNullOrEmpty(floorName))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName/Name", Message = "OfficeName and Name are required" });
                    result.RowsFailed++;
                    continue;
                }

                if (!offices.TryGetValue(officeName, out var officeId))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName", Message = $"Office '{officeName}' not found" });
                    result.RowsFailed++;
                    continue;
                }

                var existing = await _context.Floors.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.OfficeId == officeId && f.Name == floorName && !f.IsDeleted);

                if (existing != null)
                {
                    existing.Level = int.TryParse(row.Cell(3).GetString(), out var level) ? level : 1;
                    existing.SquareFootage = decimal.TryParse(row.Cell(4).GetString(), out var sqft) ? sqft : null;
                    existing.FloorPlanUrl = row.Cell(5).GetString();
                    existing.IsActive = !row.Cell(6).GetString().Equals("false", StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    var floor = new Floor
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        OfficeId = officeId,
                        Name = floorName,
                        Level = int.TryParse(row.Cell(3).GetString(), out var level) ? level : 1,
                        SquareFootage = decimal.TryParse(row.Cell(4).GetString(), out var sqft) ? sqft : null,
                        FloorPlanUrl = row.Cell(5).GetString(),
                        IsActive = !row.Cell(6).GetString().Equals("false", StringComparison.OrdinalIgnoreCase)
                    };
                    _context.Floors.Add(floor);
                }

                result.RowsSucceeded++;
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "General", Message = ex.Message });
                result.RowsFailed++;
            }
        }

        await _context.SaveChangesAsync();
        result.Success = result.RowsFailed == 0;
        return result;
    }

    public async Task<ImportResult> ImportZonesFromExcelAsync(Guid tenantId, Stream fileStream)
    {
        var result = new ImportResult();

        var floors = await _context.Floors.Include(f => f.Office).Where(f => f.TenantId == tenantId && !f.IsDeleted)
            .ToDictionaryAsync(f => $"{f.Office.Name}|{f.Name}", f => f.Id);

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1);

        foreach (var row in rows)
        {
            result.RowsProcessed++;
            try
            {
                var officeName = row.Cell(1).GetString().Trim();
                var floorName = row.Cell(2).GetString().Trim();
                var zoneName = row.Cell(3).GetString().Trim();

                if (string.IsNullOrEmpty(officeName) || string.IsNullOrEmpty(floorName) || string.IsNullOrEmpty(zoneName))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName/FloorName/Name", Message = "OfficeName, FloorName, and Name are required" });
                    result.RowsFailed++;
                    continue;
                }

                if (!floors.TryGetValue($"{officeName}|{floorName}", out var floorId))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName/FloorName", Message = $"Floor '{floorName}' in office '{officeName}' not found" });
                    result.RowsFailed++;
                    continue;
                }

                var existing = await _context.Zones.FirstOrDefaultAsync(z => z.TenantId == tenantId && z.FloorId == floorId && z.Name == zoneName && !z.IsDeleted);

                if (existing != null)
                {
                    existing.Description = row.Cell(4).GetString();
                    existing.Color = row.Cell(5).GetString();
                    existing.IsActive = !row.Cell(6).GetString().Equals("false", StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    var zone = new Zone
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        FloorId = floorId,
                        Name = zoneName,
                        Description = row.Cell(4).GetString(),
                        Color = row.Cell(5).GetString(),
                        IsActive = !row.Cell(6).GetString().Equals("false", StringComparison.OrdinalIgnoreCase)
                    };
                    _context.Zones.Add(zone);
                }

                result.RowsSucceeded++;
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "General", Message = ex.Message });
                result.RowsFailed++;
            }
        }

        await _context.SaveChangesAsync();
        result.Success = result.RowsFailed == 0;
        return result;
    }

    public async Task<ImportResult> ImportSpaceAssignmentsFromExcelAsync(Guid tenantId, Stream fileStream)
    {
        var result = new ImportResult();

        var spaces = await _context.Spaces.Include(s => s.Office).Where(s => s.TenantId == tenantId && !s.IsDeleted)
            .ToDictionaryAsync(s => $"{s.Office.Name}|{s.Name}", s => s.Id);
        var users = await _context.Users.ToDictionaryAsync(u => u.Email.ToLower(), u => u.Id);

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1);

        foreach (var row in rows)
        {
            result.RowsProcessed++;
            try
            {
                var officeName = row.Cell(1).GetString().Trim();
                var spaceName = row.Cell(2).GetString().Trim();
                var userEmail = row.Cell(3).GetString().Trim().ToLower();
                var startDateStr = row.Cell(4).GetString().Trim();

                if (string.IsNullOrEmpty(officeName) || string.IsNullOrEmpty(spaceName) || string.IsNullOrEmpty(userEmail) || string.IsNullOrEmpty(startDateStr))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "Required", Message = "OfficeName, SpaceName, UserEmail, and StartDate are required" });
                    result.RowsFailed++;
                    continue;
                }

                if (!spaces.TryGetValue($"{officeName}|{spaceName}", out var spaceId))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "OfficeName/SpaceName", Message = $"Space '{spaceName}' in office '{officeName}' not found" });
                    result.RowsFailed++;
                    continue;
                }

                if (!users.TryGetValue(userEmail, out var userId))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "UserEmail", Message = $"User with email '{userEmail}' not found" });
                    result.RowsFailed++;
                    continue;
                }

                if (!DateOnly.TryParse(startDateStr, out var startDate))
                {
                    result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "StartDate", Message = "Invalid date format for StartDate" });
                    result.RowsFailed++;
                    continue;
                }

                DateOnly? endDate = null;
                var endDateStr = row.Cell(5).GetString().Trim();
                if (!string.IsNullOrEmpty(endDateStr) && DateOnly.TryParse(endDateStr, out var ed))
                {
                    endDate = ed;
                }

                if (!Enum.TryParse<SpaceAssignmentType>(row.Cell(6).GetString(), true, out var assignmentType))
                {
                    assignmentType = SpaceAssignmentType.Permanent;
                }

                var assignment = new SpaceAssignment
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    SpaceId = spaceId,
                    UserId = userId,
                    StartDate = startDate,
                    EndDate = endDate,
                    Type = assignmentType,
                    Status = SpaceAssignmentStatus.Active,
                    Notes = row.Cell(8).GetString()
                };
                _context.SpaceAssignments.Add(assignment);

                result.RowsSucceeded++;
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError { Row = result.RowsProcessed + 1, Column = "General", Message = ex.Message });
                result.RowsFailed++;
            }
        }

        await _context.SaveChangesAsync();
        result.Success = result.RowsFailed == 0;
        return result;
    }

    #endregion

    #region Template Methods

    public byte[] GetOfficesTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Offices");

        var headers = new[] { "Name*", "Address", "Address2", "City", "StateCode", "CountryCode", "Timezone", "Status", "IsClientSite" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Sample row
        worksheet.Cell(2, 1).Value = "Example Office";
        worksheet.Cell(2, 2).Value = "123 Main Street";
        worksheet.Cell(2, 3).Value = "Suite 100";
        worksheet.Cell(2, 4).Value = "Denver";
        worksheet.Cell(2, 5).Value = "CO";
        worksheet.Cell(2, 6).Value = "US";
        worksheet.Cell(2, 7).Value = "America/Denver";
        worksheet.Cell(2, 8).Value = "Active";
        worksheet.Cell(2, 9).Value = "false";

        // Style sample row differently
        for (int i = 1; i <= headers.Length; i++)
        {
            worksheet.Cell(2, i).Style.Font.Italic = true;
            worksheet.Cell(2, i).Style.Font.FontColor = XLColor.Gray;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] GetSpacesTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Spaces");

        var headers = new[] { "OfficeName*", "FloorName", "ZoneName", "Name*", "Type*", "Capacity", "RequiresApproval", "IsActive", "Equipment", "Features", "DailyCost", "MaxBookingDays", "AvailabilityType" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Sample row
        worksheet.Cell(2, 1).Value = "National Headquarters";
        worksheet.Cell(2, 2).Value = "1st Floor";
        worksheet.Cell(2, 3).Value = "East Wing";
        worksheet.Cell(2, 4).Value = "HD-001";
        worksheet.Cell(2, 5).Value = "HotDesk";
        worksheet.Cell(2, 6).Value = "1";
        worksheet.Cell(2, 7).Value = "false";
        worksheet.Cell(2, 8).Value = "true";
        worksheet.Cell(2, 9).Value = "Monitor,Keyboard";
        worksheet.Cell(2, 10).Value = "Window view";
        worksheet.Cell(2, 11).Value = "25.00";
        worksheet.Cell(2, 12).Value = "30";
        worksheet.Cell(2, 13).Value = "Shared";

        for (int i = 1; i <= headers.Length; i++)
        {
            worksheet.Cell(2, i).Style.Font.Italic = true;
            worksheet.Cell(2, i).Style.Font.FontColor = XLColor.Gray;
        }

        // Add data validation notes
        var typeCell = worksheet.Cell(3, 5);
        typeCell.Value = "Valid types: Desk, HotDesk, Office, Cubicle, Room, ConferenceRoom, HuddleRoom, PhoneBooth, TrainingRoom, BreakRoom, ParkingSpot";
        typeCell.Style.Font.FontSize = 9;
        typeCell.Style.Font.FontColor = XLColor.DarkBlue;

        var availCell = worksheet.Cell(4, 13);
        availCell.Value = "Valid types: Shared, Assigned, Reservable, Restricted";
        availCell.Style.Font.FontSize = 9;
        availCell.Style.Font.FontColor = XLColor.DarkBlue;

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] GetFloorsTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Floors");

        var headers = new[] { "OfficeName*", "Name*", "Level*", "SquareFootage", "FloorPlanUrl", "IsActive" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        worksheet.Cell(2, 1).Value = "National Headquarters";
        worksheet.Cell(2, 2).Value = "1st Floor";
        worksheet.Cell(2, 3).Value = "1";
        worksheet.Cell(2, 4).Value = "15000";
        worksheet.Cell(2, 5).Value = "";
        worksheet.Cell(2, 6).Value = "true";

        for (int i = 1; i <= headers.Length; i++)
        {
            worksheet.Cell(2, i).Style.Font.Italic = true;
            worksheet.Cell(2, i).Style.Font.FontColor = XLColor.Gray;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] GetZonesTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Zones");

        var headers = new[] { "OfficeName*", "FloorName*", "Name*", "Description", "Color", "IsActive" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        worksheet.Cell(2, 1).Value = "National Headquarters";
        worksheet.Cell(2, 2).Value = "1st Floor";
        worksheet.Cell(2, 3).Value = "East Wing";
        worksheet.Cell(2, 4).Value = "Engineering area";
        worksheet.Cell(2, 5).Value = "#4F46E5";
        worksheet.Cell(2, 6).Value = "true";

        for (int i = 1; i <= headers.Length; i++)
        {
            worksheet.Cell(2, i).Style.Font.Italic = true;
            worksheet.Cell(2, i).Style.Font.FontColor = XLColor.Gray;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] GetSpaceAssignmentsTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("SpaceAssignments");

        var headers = new[] { "OfficeName*", "SpaceName*", "UserEmail*", "StartDate*", "EndDate", "Type*", "Notes" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        worksheet.Cell(2, 1).Value = "National Headquarters";
        worksheet.Cell(2, 2).Value = "PO-001";
        worksheet.Cell(2, 3).Value = "john@example.com";
        worksheet.Cell(2, 4).Value = "2025-01-01";
        worksheet.Cell(2, 5).Value = "";
        worksheet.Cell(2, 6).Value = "Permanent";
        worksheet.Cell(2, 7).Value = "CEO office";

        for (int i = 1; i <= headers.Length; i++)
        {
            worksheet.Cell(2, i).Style.Font.Italic = true;
            worksheet.Cell(2, i).Style.Font.FontColor = XLColor.Gray;
        }

        var typeCell = worksheet.Cell(3, 6);
        typeCell.Value = "Valid types: Permanent, LongTerm, Temporary, Visitor";
        typeCell.Style.Font.FontSize = 9;
        typeCell.Style.Font.FontColor = XLColor.DarkBlue;

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    #endregion
}
