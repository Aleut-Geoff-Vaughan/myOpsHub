// Run with: dotnet script seed-salesops.csx
// Or use: dotnet run in MyScheduling.Api with SEED_SALESOPS=true

#r "nuget: Npgsql, 8.0.0"

using System;
using System.Collections.Generic;
using Npgsql;

var connectionString = "Host=myscheduling.postgres.database.azure.com;Port=5432;Database=myscheduling;Username=aleutstaffing_admin;Password=a7f3e9d2-4b8c-4e1f-9a5d-6c2b8f4e7a3c;SslMode=Require";

Console.WriteLine("Connecting to database...");

using var conn = new NpgsqlConnection(connectionString);
conn.Open();
Console.WriteLine("Connected!");

// Get the first tenant and user
Guid tenantId;
Guid userId;

using (var cmd = new NpgsqlCommand("SELECT \"Id\" FROM \"Tenants\" LIMIT 1", conn))
{
    tenantId = (Guid)cmd.ExecuteScalar()!;
    Console.WriteLine($"Using Tenant: {tenantId}");
}

using (var cmd = new NpgsqlCommand("SELECT \"Id\" FROM \"Users\" LIMIT 1", conn))
{
    userId = (Guid)cmd.ExecuteScalar()!;
    Console.WriteLine($"Using User: {userId}");
}

var now = DateTime.UtcNow;

// Check if stages exist
int stageCount;
using (var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"SalesStages\" WHERE \"TenantId\" = @tid", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    stageCount = Convert.ToInt32(cmd.ExecuteScalar());
}

var stageIds = new Dictionary<string, Guid>();

if (stageCount == 0)
{
    Console.WriteLine("Seeding Sales Stages...");
    var stages = new[]
    {
        ("Lead", "LEAD", 10, "#94a3b8", 0, false, false, false),
        ("Qualified", "QUAL", 25, "#3b82f6", 1, false, false, false),
        ("Active Capture", "CAPTURE", 50, "#8b5cf6", 2, false, false, false),
        ("Proposal", "PROP", 60, "#f59e0b", 3, false, false, false),
        ("Proposal Submitted", "SUBM", 70, "#10b981", 4, false, false, false),
        ("Negotiation", "NEGO", 85, "#06b6d4", 5, false, false, false),
        ("Closed Won", "WON", 100, "#22c55e", 6, true, false, true),
        ("Closed Lost", "LOST", 0, "#ef4444", 7, false, true, true),
    };

    foreach (var (name, code, prob, color, order, isWon, isLost, isClosed) in stages)
    {
        var id = Guid.NewGuid();
        stageIds[code] = id;
        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""SalesStages"" (""Id"", ""TenantId"", ""Name"", ""Code"", ""DefaultProbability"", ""Color"", ""SortOrder"", ""IsActive"", ""IsWonStage"", ""IsLostStage"", ""IsClosedStage"", ""CreatedAt"")
            VALUES (@id, @tid, @name, @code, @prob, @color, @order, true, @won, @lost, @closed, @now)", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("tid", tenantId);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("code", code);
        cmd.Parameters.AddWithValue("prob", prob);
        cmd.Parameters.AddWithValue("color", color);
        cmd.Parameters.AddWithValue("order", order);
        cmd.Parameters.AddWithValue("won", isWon);
        cmd.Parameters.AddWithValue("lost", isLost);
        cmd.Parameters.AddWithValue("closed", isClosed);
        cmd.Parameters.AddWithValue("now", now);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine($"  Created {stages.Length} stages");
}
else
{
    Console.WriteLine($"Stages already exist ({stageCount}), loading...");
    using var cmd = new NpgsqlCommand($"SELECT \"Id\", \"Code\" FROM \"SalesStages\" WHERE \"TenantId\" = @tid", conn);
    cmd.Parameters.AddWithValue("tid", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read())
    {
        stageIds[reader.GetString(1)] = reader.GetGuid(0);
    }
}

// Seed Accounts
int accountCount;
using (var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"SalesAccounts\" WHERE \"TenantId\" = @tid", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    accountCount = Convert.ToInt32(cmd.ExecuteScalar());
}

var accountIds = new List<Guid>();

if (accountCount == 0)
{
    Console.WriteLine("Seeding Sales Accounts...");
    var accounts = new[]
    {
        ("Department of Defense", "DoD", "Federal", "DoD", "Defense"),
        ("Department of Homeland Security", "DHS", "Federal", "DHS", "Civilian"),
        ("Department of Health and Human Services", "HHS", "Federal", "HHS", "Civilian"),
        ("Department of Veterans Affairs", "VA", "Federal", "VA", "Civilian"),
        ("General Services Administration", "GSA", "Federal", "GSA", "Civilian"),
        ("US Army", "Army", "Federal", "DoD", "Defense"),
        ("US Navy", "Navy", "Federal", "DoD", "Defense"),
        ("US Air Force", "USAF", "Federal", "DoD", "Defense"),
        ("Centers for Medicare & Medicaid Services", "CMS", "Federal", "HHS", "Civilian"),
        ("Defense Information Systems Agency", "DISA", "Federal", "DoD", "Defense"),
    };

    foreach (var (name, acronym, type, dept, portfolio) in accounts)
    {
        var id = Guid.NewGuid();
        accountIds.Add(id);
        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""SalesAccounts"" (""Id"", ""TenantId"", ""Name"", ""Acronym"", ""AccountType"", ""FederalDepartment"", ""Portfolio"", ""IsActive"", ""CreatedAt"")
            VALUES (@id, @tid, @name, @acronym, @type, @dept, @portfolio, true, @now)", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("tid", tenantId);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("acronym", acronym);
        cmd.Parameters.AddWithValue("type", type);
        cmd.Parameters.AddWithValue("dept", dept);
        cmd.Parameters.AddWithValue("portfolio", portfolio);
        cmd.Parameters.AddWithValue("now", now);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine($"  Created {accounts.Length} accounts");
}
else
{
    Console.WriteLine($"Accounts already exist ({accountCount}), loading...");
    using var cmd = new NpgsqlCommand($"SELECT \"Id\" FROM \"SalesAccounts\" WHERE \"TenantId\" = @tid", conn);
    cmd.Parameters.AddWithValue("tid", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read()) accountIds.Add(reader.GetGuid(0));
}

// Seed Bidding Entities
int entityCount;
using (var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"BiddingEntities\" WHERE \"TenantId\" = @tid", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    entityCount = Convert.ToInt32(cmd.ExecuteScalar());
}

var entityIds = new List<Guid>();

if (entityCount == 0)
{
    Console.WriteLine("Seeding Bidding Entities...");
    var entities = new[]
    {
        ("Primary Corp", "Primary Corporation LLC", "PC", "1ABC2", "ABC123456789", true, true),
        ("Tech Solutions Inc", "Tech Solutions Incorporated", "TSI", "2DEF3", "DEF234567890", false, true),
        ("Federal Services Group", "Federal Services Group LLC", "FSG", "3GHI4", "GHI345678901", false, false),
    };

    foreach (var (name, legal, shortName, cage, uei, is8a, isSB) in entities)
    {
        var id = Guid.NewGuid();
        entityIds.Add(id);
        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""BiddingEntities"" (""Id"", ""TenantId"", ""Name"", ""LegalName"", ""ShortName"", ""CageCode"", ""UeiNumber"", ""Is8a"", ""IsSmallBusiness"", ""IsActive"", ""CreatedAt"")
            VALUES (@id, @tid, @name, @legal, @short, @cage, @uei, @is8a, @isSB, true, @now)", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("tid", tenantId);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("legal", legal);
        cmd.Parameters.AddWithValue("short", shortName);
        cmd.Parameters.AddWithValue("cage", cage);
        cmd.Parameters.AddWithValue("uei", uei);
        cmd.Parameters.AddWithValue("is8a", is8a);
        cmd.Parameters.AddWithValue("isSB", isSB);
        cmd.Parameters.AddWithValue("now", now);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine($"  Created {entities.Length} bidding entities");
}
else
{
    Console.WriteLine($"Bidding entities already exist ({entityCount}), loading...");
    using var cmd = new NpgsqlCommand($"SELECT \"Id\" FROM \"BiddingEntities\" WHERE \"TenantId\" = @tid", conn);
    cmd.Parameters.AddWithValue("tid", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read()) entityIds.Add(reader.GetGuid(0));
}

// Seed Contacts
int contactCount;
using (var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"SalesContacts\" WHERE \"TenantId\" = @tid", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    contactCount = Convert.ToInt32(cmd.ExecuteScalar());
}

if (contactCount == 0 && accountIds.Count > 0)
{
    Console.WriteLine("Seeding Sales Contacts...");
    var contacts = new[]
    {
        (0, "John", "Smith", "Contracting Officer", "john.smith@dod.gov", "703-555-0101"),
        (0, "Sarah", "Johnson", "Program Manager", "sarah.johnson@dod.gov", "703-555-0102"),
        (1, "Michael", "Williams", "COR", "michael.williams@dhs.gov", "202-555-0201"),
        (2, "Emily", "Brown", "Technical Lead", "emily.brown@hhs.gov", "301-555-0301"),
        (3, "David", "Davis", "IT Director", "david.davis@va.gov", "202-555-0401"),
        (4, "Jennifer", "Miller", "Contracting Specialist", "jennifer.miller@gsa.gov", "202-555-0501"),
        (5, "Robert", "Wilson", "G6 Chief", "robert.wilson@army.mil", "571-555-0601"),
        (6, "Lisa", "Anderson", "SPAWAR PM", "lisa.anderson@navy.mil", "619-555-0701"),
    };

    foreach (var (accIdx, first, last, title, email, phone) in contacts)
    {
        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""SalesContacts"" (""Id"", ""TenantId"", ""AccountId"", ""FirstName"", ""LastName"", ""Title"", ""Email"", ""Phone"", ""IsActive"", ""CreatedAt"")
            VALUES (@id, @tid, @acc, @first, @last, @title, @email, @phone, true, @now)", conn);
        cmd.Parameters.AddWithValue("id", Guid.NewGuid());
        cmd.Parameters.AddWithValue("tid", tenantId);
        cmd.Parameters.AddWithValue("acc", accountIds[accIdx]);
        cmd.Parameters.AddWithValue("first", first);
        cmd.Parameters.AddWithValue("last", last);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("email", email);
        cmd.Parameters.AddWithValue("phone", phone);
        cmd.Parameters.AddWithValue("now", now);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine($"  Created {contacts.Length} contacts");
}
else
{
    Console.WriteLine($"Contacts already exist ({contactCount})");
}

// Seed Contract Vehicles
int vehicleCount;
using (var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"ContractVehicles\" WHERE \"TenantId\" = @tid", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    vehicleCount = Convert.ToInt32(cmd.ExecuteScalar());
}

var vehicleIds = new List<Guid>();

if (vehicleCount == 0)
{
    Console.WriteLine("Seeding Contract Vehicles...");
    var vehicles = new[]
    {
        ("SEWP V", "NNG15SD00B", "GWAC", "NASA", 20000000000m),
        ("Alliant 2", "47QTCA18D00XX", "GWAC", "GSA", 50000000000m),
        ("GSA IT Schedule 70", "GS-35F-XXXX", "GSA Schedule", "GSA", 0m),
        ("CIO-SP3 SB", "75N98120DXXXX", "GWAC", "NIH", 20000000000m),
        ("OASIS SB Pool 1", "47QRAA20DXXXX", "IDIQ", "GSA", 60000000000m),
        ("T4NG", "VA118-16-D-XXXX", "IDIQ", "VA", 22500000000m),
    };

    foreach (var (name, contractNum, type, agency, ceiling) in vehicles)
    {
        var id = Guid.NewGuid();
        vehicleIds.Add(id);
        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""ContractVehicles"" (""Id"", ""TenantId"", ""Name"", ""ContractNumber"", ""VehicleType"", ""IssuingAgency"", ""CeilingValue"", ""IsActive"", ""CreatedAt"")
            VALUES (@id, @tid, @name, @contract, @type, @agency, @ceiling, true, @now)", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("tid", tenantId);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("contract", contractNum);
        cmd.Parameters.AddWithValue("type", type);
        cmd.Parameters.AddWithValue("agency", agency);
        cmd.Parameters.AddWithValue("ceiling", ceiling > 0 ? ceiling : DBNull.Value);
        cmd.Parameters.AddWithValue("now", now);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine($"  Created {vehicles.Length} contract vehicles");
}
else
{
    Console.WriteLine($"Contract vehicles already exist ({vehicleCount}), loading...");
    using var cmd = new NpgsqlCommand($"SELECT \"Id\" FROM \"ContractVehicles\" WHERE \"TenantId\" = @tid", conn);
    cmd.Parameters.AddWithValue("tid", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read()) vehicleIds.Add(reader.GetGuid(0));
}

// Seed Opportunities
int oppCount;
using (var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"SalesOpportunities\" WHERE \"TenantId\" = @tid", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    oppCount = Convert.ToInt32(cmd.ExecuteScalar());
}

if (oppCount == 0 && stageIds.Count > 0 && accountIds.Count > 0)
{
    Console.WriteLine("Seeding Opportunities...");
    var random = new Random(42);
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

    var openStageCodes = new[] { "LEAD", "QUAL", "CAPTURE", "PROP", "SUBM", "NEGO" };
    var acqTypes = new[] { "Full and Open", "8(a) Set-Aside", "Small Business", "SDVOSB" };
    var contractTypes = new[] { "FFP", "T&M", "Cost Plus", "IDIQ" };
    var priorities = new[] { "Standard", "High", "Critical" };

    for (int i = 0; i < opportunityNames.Length; i++)
    {
        var stageCode = openStageCodes[random.Next(openStageCodes.Length)];
        int? result = null;
        int daysToClose = random.Next(30, 365);

        if (i < 3) { stageCode = "WON"; result = 0; daysToClose = -random.Next(30, 180); }
        else if (i < 5) { stageCode = "LOST"; result = 1; daysToClose = -random.Next(30, 180); }

        var stageId = stageIds[stageCode];
        var accountId = accountIds[random.Next(accountIds.Count)];
        var entityId = entityIds.Count > 0 ? entityIds[random.Next(entityIds.Count)] : (Guid?)null;
        var vehicleId = vehicleIds.Count > 0 && random.Next(3) > 0 ? vehicleIds[random.Next(vehicleIds.Count)] : (Guid?)null;
        var amount = random.Next(50, 500) * 10000m;
        var tcv = amount * random.Next(3, 8);
        var prob = stageCode switch { "LEAD" => 10, "QUAL" => 25, "CAPTURE" => 50, "PROP" => 60, "SUBM" => 70, "NEGO" => 85, "WON" => 100, _ => 0 };

        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""SalesOpportunities"" (
                ""Id"", ""TenantId"", ""OpportunityNumber"", ""Name"", ""Description"", ""AccountId"", ""BiddingEntityId"",
                ""ContractVehicleId"", ""OwnerId"", ""StageId"", ""Type"", ""GrowthType"", ""AcquisitionType"",
                ""ContractType"", ""Amount"", ""TotalContractValue"", ""ProbabilityPercent"", ""CloseDate"",
                ""IncludedInForecast"", ""Result"", ""Priority"", ""CreatedAt"", ""CreatedByUserId""
            ) VALUES (
                @id, @tid, @oppNum, @name, @desc, @acc, @entity,
                @vehicle, @owner, @stage, @type, @growth, @acq,
                @contract, @amount, @tcv, @prob, @close,
                true, @result, @priority, @now, @createdBy
            )", conn);

        cmd.Parameters.AddWithValue("id", Guid.NewGuid());
        cmd.Parameters.AddWithValue("tid", tenantId);
        cmd.Parameters.AddWithValue("oppNum", $"OPP-{(i + 1):D6}");
        cmd.Parameters.AddWithValue("name", opportunityNames[i]);
        cmd.Parameters.AddWithValue("desc", $"Federal contract opportunity for {opportunityNames[i].ToLower()} services.");
        cmd.Parameters.AddWithValue("acc", accountId);
        cmd.Parameters.AddWithValue("entity", entityId ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("vehicle", vehicleId ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("owner", userId);
        cmd.Parameters.AddWithValue("stage", stageId);
        cmd.Parameters.AddWithValue("type", random.Next(5));
        cmd.Parameters.AddWithValue("growth", random.Next(3));
        cmd.Parameters.AddWithValue("acq", acqTypes[random.Next(acqTypes.Length)]);
        cmd.Parameters.AddWithValue("contract", contractTypes[random.Next(contractTypes.Length)]);
        cmd.Parameters.AddWithValue("amount", amount);
        cmd.Parameters.AddWithValue("tcv", tcv);
        cmd.Parameters.AddWithValue("prob", prob);
        cmd.Parameters.AddWithValue("close", now.AddDays(daysToClose));
        cmd.Parameters.AddWithValue("result", result ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("priority", priorities[random.Next(priorities.Length)]);
        cmd.Parameters.AddWithValue("now", now.AddDays(-random.Next(30, 180)));
        cmd.Parameters.AddWithValue("createdBy", userId);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine($"  Created {opportunityNames.Length} opportunities");
}
else
{
    Console.WriteLine($"Opportunities already exist ({oppCount})");
}

Console.WriteLine("\nSeed complete!");
