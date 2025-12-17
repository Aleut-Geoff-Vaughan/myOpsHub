using Npgsql;
using BCrypt.Net;

// Connection string for Azure PostgreSQL
var connectionString = "Host=myscheduling.postgres.database.azure.com;Port=5432;Database=myscheduling;Username=myadmin;Password=MyStr0ng!Pass#2024;SslMode=Require";

Console.WriteLine("Checking and resetting admin password...");

using var conn = new NpgsqlConnection(connectionString);
conn.Open();

// Check admin user status
using var checkCmd = new NpgsqlCommand(@"
    SELECT id, email, is_active, is_locked_out, failed_login_attempts, locked_out_until,
           password_hash IS NOT NULL as has_password,
           LEFT(password_hash, 30) as hash_preview
    FROM users
    WHERE email = 'admin@admin.com'", conn);

using var reader = checkCmd.ExecuteReader();
if (reader.Read())
{
    Console.WriteLine($"User found:");
    Console.WriteLine($"  ID: {reader.GetGuid(0)}");
    Console.WriteLine($"  Email: {reader.GetString(1)}");
    Console.WriteLine($"  IsActive: {reader.GetBoolean(2)}");
    Console.WriteLine($"  IsLockedOut: {reader.GetBoolean(3)}");
    Console.WriteLine($"  FailedLoginAttempts: {reader.GetInt32(4)}");
    Console.WriteLine($"  LockedOutUntil: {(reader.IsDBNull(5) ? "null" : reader.GetDateTime(5).ToString())}");
    Console.WriteLine($"  HasPassword: {reader.GetBoolean(6)}");
    Console.WriteLine($"  HashPreview: {(reader.IsDBNull(7) ? "null" : reader.GetString(7))}...");
}
else
{
    Console.WriteLine("Admin user not found!");
    return;
}
reader.Close();

// Reset password and unlock
var newPassword = "admin";
var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);

using var resetCmd = new NpgsqlCommand(@"
    UPDATE users
    SET password_hash = @hash,
        failed_login_attempts = 0,
        is_locked_out = false,
        locked_out_until = NULL,
        updated_at = @now
    WHERE email = 'admin@admin.com'", conn);
resetCmd.Parameters.AddWithValue("hash", newHash);
resetCmd.Parameters.AddWithValue("now", DateTime.UtcNow);

var rows = resetCmd.ExecuteNonQuery();
Console.WriteLine($"\nReset {rows} user(s)");
Console.WriteLine($"New password: {newPassword}");
Console.WriteLine("Done!");
