using System;
using System.Collections.Generic;
using Npgsql;

class Program
{
    static void Main()
    {
        var connectionString = "Host=myscheduling.postgres.database.azure.com;Port=5432;Database=myscheduling;Username=aleutstaffing_admin;Password=a7f3e9d2-4b8c-4e1f-9a5d-6c2b8f4e7a3c;SslMode=Require";

        Console.WriteLine("Connecting to database...");

        using var conn = new NpgsqlConnection(connectionString);
        conn.Open();
        Console.WriteLine("Connected!");

        // Get the first tenant and user
        Guid tenantId;
        Guid userId;

        using (var cmd = new NpgsqlCommand("SELECT id FROM tenants LIMIT 1", conn))
        {
            tenantId = (Guid)cmd.ExecuteScalar()!;
            Console.WriteLine($"Using Tenant: {tenantId}");
        }

        using (var cmd = new NpgsqlCommand("SELECT id FROM users LIMIT 1", conn))
        {
            userId = (Guid)cmd.ExecuteScalar()!;
            Console.WriteLine($"Using User: {userId}");
        }

        var now = DateTime.UtcNow;
        SeedAll(conn, tenantId, userId, now);
    }

    static void SeedAll(NpgsqlConnection conn, Guid tenantId, Guid userId, DateTime now)
    {
        var stageIds = SeedStages(conn, tenantId, now);
        var accountIds = SeedAccounts(conn, tenantId, now);
        var entityIds = SeedBiddingEntities(conn, tenantId, now);
        SeedContacts(conn, tenantId, accountIds, now);
        var vehicleIds = SeedContractVehicles(conn, tenantId, now);
        SeedOpportunities(conn, tenantId, userId, stageIds, accountIds, entityIds, vehicleIds, now);
        Console.WriteLine("\nSeed complete!");
    }

    static Dictionary<string, Guid> SeedStages(NpgsqlConnection conn, Guid tenantId, DateTime now)
    {
        var stageIds = new Dictionary<string, Guid>();

        int count;
        using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM sales_stages WHERE tenant_id = @tid", conn))
        {
            cmd.Parameters.AddWithValue("tid", tenantId);
            count = Convert.ToInt32(cmd.ExecuteScalar());
        }

        if (count > 0)
        {
            Console.WriteLine($"Stages exist ({count}), loading...");
            using var cmd = new NpgsqlCommand("SELECT id, code FROM sales_stages WHERE tenant_id = @tid", conn);
            cmd.Parameters.AddWithValue("tid", tenantId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read()) stageIds[reader.GetString(1)] = reader.GetGuid(0);
            return stageIds;
        }

        Console.WriteLine("Seeding Sales Stages...");
        var stages = new (string name, string code, int prob, string color, int order, bool won, bool lost, bool closed)[]
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

        foreach (var s in stages)
        {
            var id = Guid.NewGuid();
            stageIds[s.code] = id;
            using var cmd = new NpgsqlCommand(@"INSERT INTO sales_stages (id, tenant_id, name, code, default_probability, color, sort_order, is_active, is_won_stage, is_lost_stage, is_closed_stage, is_deleted, created_at) VALUES (@id, @tid, @name, @code, @prob, @color, @order, true, @won, @lost, @closed, false, @now)", conn);
            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("tid", tenantId);
            cmd.Parameters.AddWithValue("name", s.name);
            cmd.Parameters.AddWithValue("code", s.code);
            cmd.Parameters.AddWithValue("prob", s.prob);
            cmd.Parameters.AddWithValue("color", s.color);
            cmd.Parameters.AddWithValue("order", s.order);
            cmd.Parameters.AddWithValue("won", s.won);
            cmd.Parameters.AddWithValue("lost", s.lost);
            cmd.Parameters.AddWithValue("closed", s.closed);
            cmd.Parameters.AddWithValue("now", now);
            cmd.ExecuteNonQuery();
        }
        Console.WriteLine($"  Created {stages.Length} stages");
        return stageIds;
    }

    static List<Guid> SeedAccounts(NpgsqlConnection conn, Guid tenantId, DateTime now)
    {
        var ids = new List<Guid>();

        int count;
        using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM sales_accounts WHERE tenant_id = @tid", conn))
        {
            cmd.Parameters.AddWithValue("tid", tenantId);
            count = Convert.ToInt32(cmd.ExecuteScalar());
        }

        if (count > 0)
        {
            Console.WriteLine($"Accounts exist ({count}), loading...");
            using var cmd = new NpgsqlCommand("SELECT id FROM sales_accounts WHERE tenant_id = @tid", conn);
            cmd.Parameters.AddWithValue("tid", tenantId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read()) ids.Add(reader.GetGuid(0));
            return ids;
        }

        Console.WriteLine("Seeding Sales Accounts...");
        var accounts = new (string name, string acronym, string type, string dept, string portfolio)[]
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

        foreach (var a in accounts)
        {
            var id = Guid.NewGuid();
            ids.Add(id);
            using var cmd = new NpgsqlCommand(@"INSERT INTO sales_accounts (id, tenant_id, name, acronym, account_type, federal_department, portfolio, is_active, is_deleted, created_at) VALUES (@id, @tid, @name, @acronym, @type, @dept, @portfolio, true, false, @now)", conn);
            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("tid", tenantId);
            cmd.Parameters.AddWithValue("name", a.name);
            cmd.Parameters.AddWithValue("acronym", a.acronym);
            cmd.Parameters.AddWithValue("type", a.type);
            cmd.Parameters.AddWithValue("dept", a.dept);
            cmd.Parameters.AddWithValue("portfolio", a.portfolio);
            cmd.Parameters.AddWithValue("now", now);
            cmd.ExecuteNonQuery();
        }
        Console.WriteLine($"  Created {accounts.Length} accounts");
        return ids;
    }

    static List<Guid> SeedBiddingEntities(NpgsqlConnection conn, Guid tenantId, DateTime now)
    {
        var ids = new List<Guid>();

        int count;
        using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM bidding_entities WHERE tenant_id = @tid", conn))
        {
            cmd.Parameters.AddWithValue("tid", tenantId);
            count = Convert.ToInt32(cmd.ExecuteScalar());
        }

        if (count > 0)
        {
            Console.WriteLine($"Bidding entities exist ({count}), loading...");
            using var cmd = new NpgsqlCommand("SELECT id FROM bidding_entities WHERE tenant_id = @tid", conn);
            cmd.Parameters.AddWithValue("tid", tenantId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read()) ids.Add(reader.GetGuid(0));
            return ids;
        }

        Console.WriteLine("Seeding Bidding Entities...");
        var entities = new (string name, string legal, string shortName, string cage, string uei, bool is8a, bool isSB, bool isSDVOSB)[]
        {
            ("Primary Corp", "Primary Corporation LLC", "PC", "1ABC2", "ABC123456789", true, true, false),
            ("Tech Solutions Inc", "Tech Solutions Incorporated", "TSI", "2DEF3", "DEF234567890", false, true, true),
            ("Federal Services Group", "Federal Services Group LLC", "FSG", "3GHI4", "GHI345678901", false, false, false),
        };

        foreach (var e in entities)
        {
            var id = Guid.NewGuid();
            ids.Add(id);
            using var cmd = new NpgsqlCommand(@"INSERT INTO bidding_entities (id, tenant_id, name, legal_name, short_name, cage_code, uei_number, is8a, is_small_business, is_sdvosb, is_vosb, is_wosb, is_edwosb, is_hubzone, is_sdb, is_active, is_deleted, created_at) VALUES (@id, @tid, @name, @legal, @short, @cage, @uei, @is8a, @isSB, @isSDVOSB, false, false, false, false, false, true, false, @now)", conn);
            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("tid", tenantId);
            cmd.Parameters.AddWithValue("name", e.name);
            cmd.Parameters.AddWithValue("legal", e.legal);
            cmd.Parameters.AddWithValue("short", e.shortName);
            cmd.Parameters.AddWithValue("cage", e.cage);
            cmd.Parameters.AddWithValue("uei", e.uei);
            cmd.Parameters.AddWithValue("is8a", e.is8a);
            cmd.Parameters.AddWithValue("isSB", e.isSB);
            cmd.Parameters.AddWithValue("isSDVOSB", e.isSDVOSB);
            cmd.Parameters.AddWithValue("now", now);
            cmd.ExecuteNonQuery();
        }
        Console.WriteLine($"  Created {entities.Length} bidding entities");
        return ids;
    }

    static void SeedContacts(NpgsqlConnection conn, Guid tenantId, List<Guid> accountIds, DateTime now)
    {
        int count;
        using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM sales_contacts WHERE tenant_id = @tid", conn))
        {
            cmd.Parameters.AddWithValue("tid", tenantId);
            count = Convert.ToInt32(cmd.ExecuteScalar());
        }

        if (count > 0 || accountIds.Count == 0)
        {
            Console.WriteLine($"Contacts exist ({count})");
            return;
        }

        Console.WriteLine("Seeding Sales Contacts...");
        var contacts = new (int accIdx, string first, string last, string title, string email, string phone)[]
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

        foreach (var c in contacts)
        {
            using var cmd = new NpgsqlCommand(@"INSERT INTO sales_contacts (id, tenant_id, account_id, first_name, last_name, title, email, phone, is_active, is_deleted, created_at) VALUES (@id, @tid, @acc, @first, @last, @title, @email, @phone, true, false, @now)", conn);
            cmd.Parameters.AddWithValue("id", Guid.NewGuid());
            cmd.Parameters.AddWithValue("tid", tenantId);
            cmd.Parameters.AddWithValue("acc", accountIds[c.accIdx]);
            cmd.Parameters.AddWithValue("first", c.first);
            cmd.Parameters.AddWithValue("last", c.last);
            cmd.Parameters.AddWithValue("title", c.title);
            cmd.Parameters.AddWithValue("email", c.email);
            cmd.Parameters.AddWithValue("phone", c.phone);
            cmd.Parameters.AddWithValue("now", now);
            cmd.ExecuteNonQuery();
        }
        Console.WriteLine($"  Created {contacts.Length} contacts");
    }

    static List<Guid> SeedContractVehicles(NpgsqlConnection conn, Guid tenantId, DateTime now)
    {
        var ids = new List<Guid>();

        int count;
        using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM contract_vehicles WHERE tenant_id = @tid", conn))
        {
            cmd.Parameters.AddWithValue("tid", tenantId);
            count = Convert.ToInt32(cmd.ExecuteScalar());
        }

        if (count > 0)
        {
            Console.WriteLine($"Contract vehicles exist ({count}), loading...");
            using var cmd = new NpgsqlCommand("SELECT id FROM contract_vehicles WHERE tenant_id = @tid", conn);
            cmd.Parameters.AddWithValue("tid", tenantId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read()) ids.Add(reader.GetGuid(0));
            return ids;
        }

        Console.WriteLine("Seeding Contract Vehicles...");
        var vehicles = new (string name, string contract, string type, string agency, decimal ceiling)[]
        {
            ("SEWP V", "NNG15SD00B", "GWAC", "NASA", 20000000000m),
            ("Alliant 2", "47QTCA18D00XX", "GWAC", "GSA", 50000000000m),
            ("GSA IT Schedule 70", "GS-35F-XXXX", "GSA Schedule", "GSA", 0m),
            ("CIO-SP3 SB", "75N98120DXXXX", "GWAC", "NIH", 20000000000m),
            ("OASIS SB Pool 1", "47QRAA20DXXXX", "IDIQ", "GSA", 60000000000m),
            ("T4NG", "VA118-16-D-XXXX", "IDIQ", "VA", 22500000000m),
        };

        foreach (var v in vehicles)
        {
            var id = Guid.NewGuid();
            ids.Add(id);
            using var cmd = new NpgsqlCommand(@"INSERT INTO contract_vehicles (id, tenant_id, name, contract_number, vehicle_type, issuing_agency, ceiling_value, is_active, is_deleted, created_at) VALUES (@id, @tid, @name, @contract, @type, @agency, @ceiling, true, false, @now)", conn);
            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("tid", tenantId);
            cmd.Parameters.AddWithValue("name", v.name);
            cmd.Parameters.AddWithValue("contract", v.contract);
            cmd.Parameters.AddWithValue("type", v.type);
            cmd.Parameters.AddWithValue("agency", v.agency);
            cmd.Parameters.AddWithValue("ceiling", v.ceiling > 0 ? v.ceiling : DBNull.Value);
            cmd.Parameters.AddWithValue("now", now);
            cmd.ExecuteNonQuery();
        }
        Console.WriteLine($"  Created {vehicles.Length} contract vehicles");
        return ids;
    }

    static void SeedOpportunities(NpgsqlConnection conn, Guid tenantId, Guid userId, Dictionary<string, Guid> stageIds, List<Guid> accountIds, List<Guid> entityIds, List<Guid> vehicleIds, DateTime now)
    {
        int count;
        using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM sales_opportunities WHERE tenant_id = @tid", conn))
        {
            cmd.Parameters.AddWithValue("tid", tenantId);
            count = Convert.ToInt32(cmd.ExecuteScalar());
        }

        if (count > 0 || stageIds.Count == 0 || accountIds.Count == 0)
        {
            Console.WriteLine($"Opportunities exist ({count})");
            return;
        }

        Console.WriteLine("Seeding Opportunities...");
        var random = new Random(42);
        var names = new[] {
            "Enterprise IT Modernization", "Cloud Migration Support", "Cybersecurity Assessment",
            "Data Analytics Platform", "Help Desk Support Services", "Network Infrastructure Upgrade",
            "Software Development Support", "AI/ML Implementation", "DevSecOps Transformation",
            "Zero Trust Architecture", "Digital Transformation Initiative", "IT Service Management",
            "Application Modernization", "Identity Management System", "Endpoint Security Solution",
            "Managed Security Services", "Business Process Automation", "Data Center Consolidation",
            "Unified Communications", "Agile Development Support"
        };
        var openCodes = new[] { "LEAD", "QUAL", "CAPTURE", "PROP", "SUBM", "NEGO" };
        // AcquisitionType: FullAndOpen=0, SmallBusiness=1, EightASetAside=2, SDVOSB=3, WOSB=4, HUBZone=5
        var acqTypes = new[] { 0, 1, 2, 3 };
        // SalesContractType: FirmFixedPrice=0, TimeAndMaterials=1, CostPlus=2, CostPlusFixedFee=3, CPIF=4, CPAF=5, IDIQ=6
        var contractTypes = new[] { 0, 1, 2, 6 };
        var priorities = new[] { "Standard", "High", "Critical" };

        for (int i = 0; i < names.Length; i++)
        {
            var code = openCodes[random.Next(openCodes.Length)];
            int? result = null;
            int days = random.Next(30, 365);
            if (i < 3) { code = "WON"; result = 0; days = -random.Next(30, 180); }
            else if (i < 5) { code = "LOST"; result = 1; days = -random.Next(30, 180); }

            var stageId = stageIds[code];
            var accountId = accountIds[random.Next(accountIds.Count)];
            var entityId = entityIds.Count > 0 ? entityIds[random.Next(entityIds.Count)] : (Guid?)null;
            var vehicleId = vehicleIds.Count > 0 && random.Next(3) > 0 ? vehicleIds[random.Next(vehicleIds.Count)] : (Guid?)null;
            var amount = random.Next(50, 500) * 10000m;
            var tcv = amount * random.Next(3, 8);
            var prob = code switch { "LEAD" => 10, "QUAL" => 25, "CAPTURE" => 50, "PROP" => 60, "SUBM" => 70, "NEGO" => 85, "WON" => 100, _ => 0 };

            using var cmd = new NpgsqlCommand(@"INSERT INTO sales_opportunities (id, tenant_id, opportunity_number, name, description, account_id, bidding_entity_id, contract_vehicle_id, owner_id, stage_id, type, growth_type, acquisition_type, contract_type, bid_decision, rfi_status, is_direct_award, is_front_door, amount, total_contract_value, probability_percent, close_date, included_in_forecast, result, priority, is_deleted, created_at, created_by_user_id) VALUES (@id, @tid, @num, @name, @desc, @acc, @entity, @vehicle, @owner, @stage, @type, @growth, @acq, @contract, @bidDecision, @rfiStatus, false, false, @amount, @tcv, @prob, @close, true, @result, @priority, false, @created, @by)", conn);
            cmd.Parameters.AddWithValue("id", Guid.NewGuid());
            cmd.Parameters.AddWithValue("tid", tenantId);
            cmd.Parameters.AddWithValue("num", $"OPP-{(i + 1):D6}");
            cmd.Parameters.AddWithValue("name", names[i]);
            cmd.Parameters.AddWithValue("desc", $"Federal contract opportunity for {names[i].ToLower()} services.");
            cmd.Parameters.AddWithValue("acc", accountId);
            cmd.Parameters.AddWithValue("entity", entityId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("vehicle", vehicleId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("owner", userId);
            cmd.Parameters.AddWithValue("stage", stageId);
            cmd.Parameters.AddWithValue("type", random.Next(5));
            cmd.Parameters.AddWithValue("growth", random.Next(3));
            cmd.Parameters.AddWithValue("acq", acqTypes[random.Next(acqTypes.Length)]);
            cmd.Parameters.AddWithValue("contract", contractTypes[random.Next(contractTypes.Length)]);
            // BidDecision: Pending=0, Bid=1, NoBid=2
            cmd.Parameters.AddWithValue("bidDecision", code == "WON" || code == "LOST" ? 1 : random.Next(3));
            // RfiStatus: NotRequired=0, Required=1, Responded=2
            cmd.Parameters.AddWithValue("rfiStatus", random.Next(3));
            cmd.Parameters.AddWithValue("amount", amount);
            cmd.Parameters.AddWithValue("tcv", tcv);
            cmd.Parameters.AddWithValue("prob", prob);
            cmd.Parameters.AddWithValue("close", now.AddDays(days));
            cmd.Parameters.AddWithValue("result", result ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("priority", priorities[random.Next(priorities.Length)]);
            cmd.Parameters.AddWithValue("created", now.AddDays(-random.Next(30, 180)));
            cmd.Parameters.AddWithValue("by", userId);
            cmd.ExecuteNonQuery();
        }
        Console.WriteLine($"  Created {names.Length} opportunities");
    }
}
