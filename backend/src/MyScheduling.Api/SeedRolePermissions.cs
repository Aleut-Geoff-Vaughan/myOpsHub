using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api;

public static class SeedRolePermissions
{
    /// <summary>
    /// Seeds role permission templates for the application.
    /// These define the default permissions for each role.
    /// </summary>
    public static async Task SeedRolePermissionTemplates(MySchedulingDbContext context)
    {
        Console.WriteLine("Checking role permission templates...");

        var existingTemplates = await context.RolePermissionTemplates.ToListAsync();
        var templatesToAdd = new List<RolePermissionTemplate>();

        // Get all templates we want to have
        var desiredTemplates = GetAllRolePermissionTemplates();

        foreach (var template in desiredTemplates)
        {
            // Check if this template already exists
            var exists = existingTemplates.Any(t =>
                t.Role == template.Role &&
                t.Resource == template.Resource &&
                t.Action == template.Action &&
                t.TenantId == template.TenantId);

            if (!exists)
            {
                template.Id = Guid.NewGuid();
                template.CreatedAt = DateTime.UtcNow;
                templatesToAdd.Add(template);
            }
        }

        if (templatesToAdd.Count > 0)
        {
            context.RolePermissionTemplates.AddRange(templatesToAdd);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {templatesToAdd.Count} role permission templates.");
        }
        else
        {
            Console.WriteLine("All role permission templates already exist.");
        }
    }

    private static List<RolePermissionTemplate> GetAllRolePermissionTemplates()
    {
        var templates = new List<RolePermissionTemplate>();

        // Employee role permissions - basic access for all users
        templates.AddRange(GetEmployeeTemplates());

        // FinanceLead role permissions - manages cost rates and financial forecasts
        templates.AddRange(GetFinanceLeadTemplates());

        // Executive role permissions - read-only access to financial data
        templates.AddRange(GetExecutiveTemplates());

        // ResourceManager role permissions
        templates.AddRange(GetResourceManagerTemplates());

        // ProjectManager role permissions
        templates.AddRange(GetProjectManagerTemplates());

        return templates;
    }

    private static List<RolePermissionTemplate> GetEmployeeTemplates()
    {
        return new List<RolePermissionTemplate>
        {
            // Delegation of Authority - Read/Create/Update own letters
            CreateTemplate(AppRole.Employee, "DelegationOfAuthority", PermissionAction.Read, PermissionScope.Owner,
                "View own DOA letters (as delegator or designee)"),
            CreateTemplate(AppRole.Employee, "DelegationOfAuthority", PermissionAction.Create, PermissionScope.Owner,
                "Create DOA letters"),
            CreateTemplate(AppRole.Employee, "DelegationOfAuthority", PermissionAction.Update, PermissionScope.Owner,
                "Update own DOA letters"),
            CreateTemplate(AppRole.Employee, "DelegationOfAuthority", PermissionAction.Delete, PermissionScope.Owner,
                "Delete own draft DOA letters"),
            CreateTemplate(AppRole.Employee, "DelegationOfAuthority", PermissionAction.Approve, PermissionScope.Owner,
                "Sign DOA letters where user is delegator or designee"),

            // Project Assignments - Read own assignments
            CreateTemplate(AppRole.Employee, "ProjectAssignment", PermissionAction.Read, PermissionScope.Owner,
                "View own project assignments"),

            // Work Locations - Basic access for scheduling
            CreateTemplate(AppRole.Employee, "WorkLocation", PermissionAction.Read, PermissionScope.Owner,
                "View own work location schedule"),
            CreateTemplate(AppRole.Employee, "WorkLocation", PermissionAction.Create, PermissionScope.Owner,
                "Create own work location entries"),
            CreateTemplate(AppRole.Employee, "WorkLocation", PermissionAction.Update, PermissionScope.Owner,
                "Update own work location entries"),
            CreateTemplate(AppRole.Employee, "WorkLocation", PermissionAction.Delete, PermissionScope.Owner,
                "Delete own work location entries"),

            // Templates - Basic access
            CreateTemplate(AppRole.Employee, "WorkLocationTemplate", PermissionAction.Read, PermissionScope.Owner,
                "View own work location templates"),
            CreateTemplate(AppRole.Employee, "WorkLocationTemplate", PermissionAction.Create, PermissionScope.Owner,
                "Create own work location templates"),
            CreateTemplate(AppRole.Employee, "WorkLocationTemplate", PermissionAction.Update, PermissionScope.Owner,
                "Update own work location templates"),
            CreateTemplate(AppRole.Employee, "WorkLocationTemplate", PermissionAction.Delete, PermissionScope.Owner,
                "Delete own work location templates"),

            // Bookings - Basic hoteling access
            CreateTemplate(AppRole.Employee, "Booking", PermissionAction.Read, PermissionScope.Owner,
                "View own desk/room bookings"),
            CreateTemplate(AppRole.Employee, "Booking", PermissionAction.Create, PermissionScope.Owner,
                "Create desk/room bookings"),
            CreateTemplate(AppRole.Employee, "Booking", PermissionAction.Update, PermissionScope.Owner,
                "Update own bookings"),
            CreateTemplate(AppRole.Employee, "Booking", PermissionAction.Delete, PermissionScope.Owner,
                "Cancel own bookings"),

            // Time Entries - Basic timesheet access
            CreateTemplate(AppRole.Employee, "TimeEntry", PermissionAction.Read, PermissionScope.Owner,
                "View own time entries"),
            CreateTemplate(AppRole.Employee, "TimeEntry", PermissionAction.Create, PermissionScope.Owner,
                "Create time entries"),
            CreateTemplate(AppRole.Employee, "TimeEntry", PermissionAction.Update, PermissionScope.Owner,
                "Update own time entries"),
            CreateTemplate(AppRole.Employee, "TimeEntry", PermissionAction.Delete, PermissionScope.Owner,
                "Delete own draft time entries"),

            // Profile - Self management
            CreateTemplate(AppRole.Employee, "UserProfile", PermissionAction.Read, PermissionScope.Owner,
                "View own profile"),
            CreateTemplate(AppRole.Employee, "UserProfile", PermissionAction.Update, PermissionScope.Owner,
                "Update own profile"),

            // Tenant - Read access to own tenant(s)
            CreateTemplate(AppRole.Employee, "Tenant", PermissionAction.Read, PermissionScope.Tenant,
                "View tenant information"),
        };
    }

    private static List<RolePermissionTemplate> GetFinanceLeadTemplates()
    {
        return new List<RolePermissionTemplate>
        {
            // Cost Rates - Full CRUD + Import/Export
            CreateTemplate(AppRole.FinanceLead, "EmployeeCostRate", PermissionAction.Manage, PermissionScope.Tenant,
                "Full access to employee cost rates including import/export"),
            CreateTemplate(AppRole.FinanceLead, "EmployeeCostRate", PermissionAction.Import, PermissionScope.Tenant,
                "Import employee cost rates from CSV/Excel"),
            CreateTemplate(AppRole.FinanceLead, "EmployeeCostRate", PermissionAction.Export, PermissionScope.Tenant,
                "Export employee cost rates to CSV/Excel"),

            // Non-Labor Cost Types - Full CRUD
            CreateTemplate(AppRole.FinanceLead, "NonLaborCostType", PermissionAction.Manage, PermissionScope.Tenant,
                "Manage non-labor cost type configurations"),

            // Non-Labor Forecasts - Full CRUD
            CreateTemplate(AppRole.FinanceLead, "NonLaborForecast", PermissionAction.Manage, PermissionScope.Tenant,
                "Manage non-labor cost forecasts"),

            // Non-Labor Budget Lines - Full CRUD
            CreateTemplate(AppRole.FinanceLead, "NonLaborBudgetLine", PermissionAction.Manage, PermissionScope.Tenant,
                "Manage non-labor budget lines"),

            // Actual Non-Labor Costs - Full CRUD
            CreateTemplate(AppRole.FinanceLead, "ActualNonLaborCost", PermissionAction.Manage, PermissionScope.Tenant,
                "Manage actual non-labor cost records"),

            // Forecasts - Read and financial views
            CreateTemplate(AppRole.FinanceLead, "Forecast", PermissionAction.Read, PermissionScope.Tenant,
                "View labor forecasts"),
            CreateTemplate(AppRole.FinanceLead, "ForecastFinancial", PermissionAction.Read, PermissionScope.Tenant,
                "View financial forecast data with cost calculations"),

            // Budgets - Read access
            CreateTemplate(AppRole.FinanceLead, "ProjectBudget", PermissionAction.Read, PermissionScope.Tenant,
                "View project budgets"),

            // Staffing Reports - Read financial reports
            CreateTemplate(AppRole.FinanceLead, "StaffingReport", PermissionAction.Read, PermissionScope.Tenant,
                "View staffing and financial reports"),

            // Tenant Settings - Read for fiscal year config
            CreateTemplate(AppRole.FinanceLead, "TenantSettings", PermissionAction.Read, PermissionScope.Tenant,
                "View tenant settings including fiscal year configuration"),
        };
    }

    private static List<RolePermissionTemplate> GetExecutiveTemplates()
    {
        return new List<RolePermissionTemplate>
        {
            // Cost Rates - Read only
            CreateTemplate(AppRole.Executive, "EmployeeCostRate", PermissionAction.Read, PermissionScope.Tenant,
                "View employee cost rates"),

            // Non-Labor Costs - Read only
            CreateTemplate(AppRole.Executive, "NonLaborCostType", PermissionAction.Read, PermissionScope.Tenant,
                "View non-labor cost types"),
            CreateTemplate(AppRole.Executive, "NonLaborForecast", PermissionAction.Read, PermissionScope.Tenant,
                "View non-labor forecasts"),
            CreateTemplate(AppRole.Executive, "NonLaborBudgetLine", PermissionAction.Read, PermissionScope.Tenant,
                "View non-labor budget lines"),
            CreateTemplate(AppRole.Executive, "ActualNonLaborCost", PermissionAction.Read, PermissionScope.Tenant,
                "View actual non-labor costs"),

            // Forecasts - Full read including financial
            CreateTemplate(AppRole.Executive, "Forecast", PermissionAction.Read, PermissionScope.Tenant,
                "View labor forecasts"),
            CreateTemplate(AppRole.Executive, "ForecastFinancial", PermissionAction.Read, PermissionScope.Tenant,
                "View financial forecast data with cost calculations"),

            // Budgets - Read
            CreateTemplate(AppRole.Executive, "ProjectBudget", PermissionAction.Read, PermissionScope.Tenant,
                "View project budgets"),

            // Reports - Read
            CreateTemplate(AppRole.Executive, "StaffingReport", PermissionAction.Read, PermissionScope.Tenant,
                "View staffing and financial reports"),
        };
    }

    private static List<RolePermissionTemplate> GetResourceManagerTemplates()
    {
        return new List<RolePermissionTemplate>
        {
            // Resource managers can see cost data for resource planning
            CreateTemplate(AppRole.ResourceManager, "EmployeeCostRate", PermissionAction.Read, PermissionScope.Tenant,
                "View employee cost rates for resource planning"),
            CreateTemplate(AppRole.ResourceManager, "ForecastFinancial", PermissionAction.Read, PermissionScope.Tenant,
                "View financial forecast data for resource planning"),

            // Non-Labor - Read only for planning
            CreateTemplate(AppRole.ResourceManager, "NonLaborForecast", PermissionAction.Read, PermissionScope.Tenant,
                "View non-labor forecasts"),
        };
    }

    private static List<RolePermissionTemplate> GetProjectManagerTemplates()
    {
        return new List<RolePermissionTemplate>
        {
            // Project managers can create/update non-labor forecasts for their projects
            CreateTemplate(AppRole.ProjectManager, "NonLaborForecast", PermissionAction.Create, PermissionScope.Owner,
                "Create non-labor forecasts for owned projects"),
            CreateTemplate(AppRole.ProjectManager, "NonLaborForecast", PermissionAction.Update, PermissionScope.Owner,
                "Update non-labor forecasts for owned projects"),
            CreateTemplate(AppRole.ProjectManager, "NonLaborForecast", PermissionAction.Read, PermissionScope.Tenant,
                "View all non-labor forecasts"),

            // Read access to cost types for forecasting
            CreateTemplate(AppRole.ProjectManager, "NonLaborCostType", PermissionAction.Read, PermissionScope.Tenant,
                "View non-labor cost types for forecasting"),

            // Limited financial view for their projects
            CreateTemplate(AppRole.ProjectManager, "ForecastFinancial", PermissionAction.Read, PermissionScope.Owner,
                "View financial data for owned projects"),
        };
    }

    private static RolePermissionTemplate CreateTemplate(
        AppRole role,
        string resource,
        PermissionAction action,
        PermissionScope scope,
        string description)
    {
        return new RolePermissionTemplate
        {
            Role = role,
            Resource = resource,
            Action = action,
            DefaultScope = scope,
            Description = description,
            IsSystemTemplate = true,
            TenantId = null // System-wide template
        };
    }
}
