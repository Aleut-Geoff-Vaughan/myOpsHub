using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api;

public static class SeedFacilitiesData
{
    public static async Task SeedSpacesForAllOffices(MySchedulingDbContext context)
    {
        // Get all offices
        var allOffices = await context.Offices.ToListAsync();

        if (!allOffices.Any())
        {
            Console.WriteLine("No offices found. Skipping facilities seed.");
            return;
        }

        // Seed floors for offices that don't have floors
        var officesWithoutFloors = allOffices
            .Where(o => !context.Floors.Any(f => f.OfficeId == o.Id))
            .ToList();

        foreach (var office in officesWithoutFloors)
        {
            Console.WriteLine($"Creating floors for office: {office.Name}");
            await SeedFloorsForOffice(context, office);
        }
        await context.SaveChangesAsync();

        // Get all offices that don't have spaces yet
        var officesWithoutSpaces = allOffices
            .Where(o => !context.Spaces.Any(s => s.OfficeId == o.Id))
            .ToList();

        foreach (var office in officesWithoutSpaces)
        {
            Console.WriteLine($"Creating spaces for office: {office.Name}");
            await SeedSpacesForOffice(context, office);
        }

        await context.SaveChangesAsync();
        Console.WriteLine($"Seeded floors for {officesWithoutFloors.Count} offices and spaces for {officesWithoutSpaces.Count} offices.");
    }

    private static async Task SeedFloorsForOffice(MySchedulingDbContext context, Office office)
    {
        var floors = new List<Floor>
        {
            new Floor
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = "Ground Floor",
                Level = 0,
                SquareFootage = 5000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Floor
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = "1st Floor",
                Level = 1,
                SquareFootage = 6000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Floor
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = "2nd Floor",
                Level = 2,
                SquareFootage = 6000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Floors.AddRangeAsync(floors);
        await context.SaveChangesAsync();

        // Now add zones for each floor
        foreach (var floor in floors)
        {
            var zones = new List<Zone>
            {
                new Zone
                {
                    Id = Guid.NewGuid(),
                    TenantId = office.TenantId,
                    FloorId = floor.Id,
                    Name = $"{floor.Name} - North Wing",
                    Description = "North side workspace area",
                    Color = "#3B82F6", // Blue
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Zone
                {
                    Id = Guid.NewGuid(),
                    TenantId = office.TenantId,
                    FloorId = floor.Id,
                    Name = $"{floor.Name} - South Wing",
                    Description = "South side workspace area",
                    Color = "#10B981", // Green
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Zones.AddRangeAsync(zones);
        }
    }

    private static async Task SeedSpacesForOffice(MySchedulingDbContext context, Office office)
    {
        var spaces = new List<Space>();

        // Hot Desks (10)
        for (int i = 1; i <= 10; i++)
        {
            spaces.Add(new Space
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = $"D-{i:D3}",
                Type = SpaceType.HotDesk,
                Capacity = 1,
                IsActive = true,
                RequiresApproval = false,
                AvailabilityType = SpaceAvailabilityType.Shared, // Hot desks are shared
                Equipment = "Monitor, Keyboard, Mouse",
                Features = i <= 3 ? "Window View" : i <= 6 ? "Near Kitchen" : "Quiet Zone",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Private Offices (5)
        for (int i = 1; i <= 5; i++)
        {
            spaces.Add(new Space
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = $"O-{i:D3}",
                Type = SpaceType.Office,
                Capacity = 1,
                IsActive = true,
                RequiresApproval = true, // Private offices require approval
                AvailabilityType = SpaceAvailabilityType.Reservable,
                Equipment = "Monitor, Keyboard, Mouse, Phone",
                Features = "Private, Lockable",
                DailyCost = 25.00m,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Conference Rooms (3)
        var crNames = new[] { "CR-1A", "CR-1B", "CR-2A" };
        var crCapacities = new[] { 8, 12, 20 };
        for (int i = 0; i < 3; i++)
        {
            spaces.Add(new Space
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = crNames[i],
                Type = SpaceType.ConferenceRoom,
                Capacity = crCapacities[i],
                IsActive = true,
                RequiresApproval = false,
                AvailabilityType = SpaceAvailabilityType.Reservable,
                Equipment = "TV/Display, Video Conferencing, Whiteboard",
                Features = crCapacities[i] >= 12 ? "Large Room, Video Conferencing" : "Standard Room",
                MaxBookingDays = 1, // Max 1 day booking for conference rooms
                CreatedAt = DateTime.UtcNow
            });
        }

        // Huddle Rooms (2)
        for (int i = 1; i <= 2; i++)
        {
            spaces.Add(new Space
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = $"HR-{i}",
                Type = SpaceType.HuddleRoom,
                Capacity = 4,
                IsActive = true,
                RequiresApproval = false,
                AvailabilityType = SpaceAvailabilityType.Shared,
                Equipment = "Display, Whiteboard",
                Features = "Quick Meetings",
                MaxBookingDays = 1,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Phone Booths (2)
        for (int i = 1; i <= 2; i++)
        {
            spaces.Add(new Space
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = $"PH-{i}",
                Type = SpaceType.PhoneBooth,
                Capacity = 1,
                IsActive = true,
                RequiresApproval = false,
                AvailabilityType = SpaceAvailabilityType.Shared,
                Equipment = "None",
                Features = "Soundproof, Private Calls",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Training Room (1)
        spaces.Add(new Space
        {
            Id = Guid.NewGuid(),
            TenantId = office.TenantId,
            OfficeId = office.Id,
            Name = "TR-1",
            Type = SpaceType.TrainingRoom,
            Capacity = 30,
            IsActive = true,
            RequiresApproval = true,
            AvailabilityType = SpaceAvailabilityType.Reservable,
            Equipment = "Projector, Whiteboard, Podium, Laptop Connections",
            Features = "Training Setup, Presentation Ready",
            DailyCost = 100.00m,
            MaxBookingDays = 5,
            CreatedAt = DateTime.UtcNow
        });

        // Break Room (1)
        spaces.Add(new Space
        {
            Id = Guid.NewGuid(),
            TenantId = office.TenantId,
            OfficeId = office.Id,
            Name = "BR-1",
            Type = SpaceType.BreakRoom,
            Capacity = 20,
            IsActive = true,
            RequiresApproval = false,
            AvailabilityType = SpaceAvailabilityType.Shared,
            Equipment = "Kitchen Appliances, Seating",
            Features = "Kitchen, Relaxation Area",
            CreatedAt = DateTime.UtcNow
        });

        // Parking Spots (5)
        for (int i = 1; i <= 5; i++)
        {
            spaces.Add(new Space
            {
                Id = Guid.NewGuid(),
                TenantId = office.TenantId,
                OfficeId = office.Id,
                Name = $"P-{i:D3}",
                Type = SpaceType.ParkingSpot,
                Capacity = 1,
                IsActive = true,
                RequiresApproval = false,
                AvailabilityType = SpaceAvailabilityType.Reservable,
                Equipment = i == 1 ? "EV Charger" : "None",
                Features = i == 1 ? "EV Charging, Covered" : i <= 3 ? "Covered" : "Open",
                DailyCost = i == 1 ? 10.00m : 5.00m,
                CreatedAt = DateTime.UtcNow
            });
        }

        await context.Spaces.AddRangeAsync(spaces);
    }
}
