using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api;

public static class SeedNonLaborCostTypes
{
    public static async Task SeedCostTypesForAllTenants(MySchedulingDbContext context, bool forceRefresh = false)
    {
        // Get all tenants
        var tenants = await context.Tenants.ToListAsync();

        if (!tenants.Any())
        {
            Console.WriteLine("No tenants found. Skipping non-labor cost type seeding.");
            return;
        }

        Console.WriteLine($"Seeding non-labor cost types for {tenants.Count} tenant(s)...");

        foreach (var tenant in tenants)
        {
            await SeedCostTypesForTenant(context, tenant.Id, forceRefresh);
        }

        Console.WriteLine("Non-labor cost type seeding complete.");
    }

    public static async Task SeedCostTypesForTenant(MySchedulingDbContext context, Guid tenantId, bool forceRefresh = false)
    {
        var tenantName = await context.Tenants
            .Where(t => t.Id == tenantId)
            .Select(t => t.Name)
            .FirstOrDefaultAsync() ?? "Unknown";

        // Check if cost types already exist for this tenant
        var existingCount = await context.NonLaborCostTypes
            .CountAsync(c => c.TenantId == tenantId);

        if (existingCount > 0)
        {
            if (forceRefresh)
            {
                Console.WriteLine($"Force refresh enabled. Clearing existing cost types for tenant '{tenantName}'...");

                // Delete forecasts first (FK constraint)
                var forecasts = await context.NonLaborForecasts
                    .Where(f => f.TenantId == tenantId)
                    .ToListAsync();
                context.NonLaborForecasts.RemoveRange(forecasts);

                // Delete budget lines (FK constraint)
                var budgetLines = await context.NonLaborBudgetLines
                    .Where(b => b.TenantId == tenantId)
                    .ToListAsync();
                context.NonLaborBudgetLines.RemoveRange(budgetLines);

                // Delete actual costs (FK constraint)
                var actuals = await context.ActualNonLaborCosts
                    .Where(a => a.TenantId == tenantId)
                    .ToListAsync();
                context.ActualNonLaborCosts.RemoveRange(actuals);

                await context.SaveChangesAsync();

                // Now delete cost types
                var existingTypes = await context.NonLaborCostTypes
                    .Where(c => c.TenantId == tenantId)
                    .ToListAsync();
                context.NonLaborCostTypes.RemoveRange(existingTypes);
                await context.SaveChangesAsync();

                Console.WriteLine($"Cleared {existingTypes.Count} cost types for tenant '{tenantName}'.");
            }
            else
            {
                Console.WriteLine($"Non-labor cost types already exist for tenant '{tenantName}' ({existingCount} types). Skipping. Use SEED_NONLABOR_FORCE=true to refresh.");
                return;
            }
        }

        Console.WriteLine($"Seeding non-labor cost types for tenant '{tenantName}'...");

        var costTypes = GetDefaultCostTypes(tenantId);

        await context.NonLaborCostTypes.AddRangeAsync(costTypes);
        await context.SaveChangesAsync();

        Console.WriteLine($"Seeded {costTypes.Count} non-labor cost types for tenant '{tenantName}'.");
    }

    private static List<NonLaborCostType> GetDefaultCostTypes(Guid tenantId)
    {
        var now = DateTime.UtcNow;
        var costTypes = new List<NonLaborCostType>();
        var sortOrder = 0;

        // Travel Category
        AddCostType("Airfare", "AIR", NonLaborCostCategory.Travel, "Commercial airfare for project travel");
        AddCostType("Ground Transportation", "GRND", NonLaborCostCategory.Travel, "Rental cars, taxis, rideshare for project travel");
        AddCostType("Lodging", "LODG", NonLaborCostCategory.Travel, "Hotels and accommodations for project travel");
        AddCostType("Per Diem", "PERD", NonLaborCostCategory.Travel, "Daily allowance for meals and incidentals during travel");
        AddCostType("Mileage Reimbursement", "MILE", NonLaborCostCategory.Travel, "Personal vehicle mileage reimbursement");

        // Meals Category
        AddCostType("Team Meals", "MEAL", NonLaborCostCategory.Meals, "Team meals and working lunches");
        AddCostType("Client Entertainment", "CLNT", NonLaborCostCategory.Meals, "Client meals and entertainment");
        AddCostType("Conference Meals", "CONF", NonLaborCostCategory.Meals, "Meals during conferences and events");

        // Equipment Category
        AddCostType("Computer Equipment", "COMP", NonLaborCostCategory.Equipment, "Laptops, monitors, peripherals");
        AddCostType("Specialized Hardware", "HWRE", NonLaborCostCategory.Equipment, "Project-specific hardware and devices");
        AddCostType("Software Licenses", "SOFT", NonLaborCostCategory.Equipment, "Software licenses and subscriptions");
        AddCostType("Cloud Services", "CLUD", NonLaborCostCategory.Equipment, "AWS, Azure, GCP and other cloud costs");
        AddCostType("Testing Equipment", "TEST", NonLaborCostCategory.Equipment, "Testing tools and equipment");

        // Supplies Category
        AddCostType("Office Supplies", "OFSP", NonLaborCostCategory.Supplies, "General office supplies");
        AddCostType("Project Materials", "MATL", NonLaborCostCategory.Supplies, "Project-specific materials and supplies");
        AddCostType("Printing & Reproduction", "PRNT", NonLaborCostCategory.Supplies, "Printing, copying, and reproduction costs");

        // Subcontracts Category
        AddCostType("Consulting Services", "CONS", NonLaborCostCategory.Subcontracts, "Third-party consulting services");
        AddCostType("Professional Services", "PROF", NonLaborCostCategory.Subcontracts, "Legal, accounting, and other professional services");
        AddCostType("Technical Subcontractors", "TSUB", NonLaborCostCategory.Subcontracts, "Technical subcontractor labor");
        AddCostType("Staffing Augmentation", "STAF", NonLaborCostCategory.Subcontracts, "Temporary staffing and contractors");

        // Training Category
        AddCostType("Training Courses", "TRNG", NonLaborCostCategory.Training, "External training courses and classes");
        AddCostType("Certifications", "CERT", NonLaborCostCategory.Training, "Professional certification costs");
        AddCostType("Conference Registration", "CREG", NonLaborCostCategory.Training, "Conference and seminar registration fees");
        AddCostType("Training Materials", "TMAT", NonLaborCostCategory.Training, "Books, courses, and training materials");

        // Communications Category
        AddCostType("Mobile Services", "MOBL", NonLaborCostCategory.Communications, "Cell phones and mobile data plans");
        AddCostType("Telecom Services", "TELE", NonLaborCostCategory.Communications, "Phone lines and telecom services");
        AddCostType("Internet Services", "INET", NonLaborCostCategory.Communications, "Internet connectivity costs");
        AddCostType("Video Conferencing", "VCON", NonLaborCostCategory.Communications, "Video conferencing tools and services");

        // Facilities Category
        AddCostType("Office Space Rental", "RENT", NonLaborCostCategory.Facilities, "Project-specific office space rental");
        AddCostType("Meeting Room Rental", "MEET", NonLaborCostCategory.Facilities, "External meeting room rentals");
        AddCostType("Utilities", "UTIL", NonLaborCostCategory.Facilities, "Project-allocated utilities");
        AddCostType("Security Services", "SECU", NonLaborCostCategory.Facilities, "Security and access control costs");

        // Other Category
        AddCostType("Shipping & Freight", "SHIP", NonLaborCostCategory.Other, "Shipping and freight costs");
        AddCostType("Insurance", "INSR", NonLaborCostCategory.Other, "Project-specific insurance costs");
        AddCostType("Miscellaneous", "MISC", NonLaborCostCategory.Other, "Other non-labor costs");

        return costTypes;

        void AddCostType(string name, string code, NonLaborCostCategory category, string description)
        {
            costTypes.Add(new NonLaborCostType
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = name,
                Code = code,
                Category = category,
                Description = description,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
    }
}
