using System.Security.Cryptography;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Enums;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Infrastructure.Services;

public class AzureBlobStorageService : IFileStorageService
{
    private readonly MySchedulingDbContext _context;
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;
    private readonly ILogger<AzureBlobStorageService> _logger;

    public AzureBlobStorageService(
        MySchedulingDbContext context,
        IConfiguration configuration,
        ILogger<AzureBlobStorageService> logger)
    {
        _context = context;
        _logger = logger;

        // Check environment variable first, then fall back to config
        var connectionString = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING")
            ?? configuration["AzureStorage:ConnectionString"];

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Azure Storage connection string is not configured. Set AZURE_STORAGE_CONNECTION_STRING environment variable or AzureStorage:ConnectionString in appsettings.");
        }

        _containerName = configuration["AzureStorage:ContainerName"] ?? "myscheduling-files";

        _blobServiceClient = new BlobServiceClient(connectionString);
    }

    public async Task<StoredFile> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string entityType,
        Guid entityId,
        Guid tenantId,
        Guid uploadedByUserId,
        string? category = null)
    {
        // Generate unique file ID
        var fileId = Guid.NewGuid();

        // Compute file hash for deduplication
        fileStream.Position = 0;
        var hash = await ComputeHashAsync(fileStream);
        fileStream.Position = 0;

        // Build storage path: {tenantId}/{userId}/{category}/{fileId}_{filename}
        var categoryPath = string.IsNullOrEmpty(category) ? "files" : category.ToLowerInvariant();
        var storagePath = $"{tenantId}/{entityId}/{categoryPath}/{fileId}_{SanitizeFileName(fileName)}";

        // Get or create container
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

        // Upload blob
        var blobClient = containerClient.GetBlobClient(storagePath);
        var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };

        await blobClient.UploadAsync(fileStream, new BlobUploadOptions
        {
            HttpHeaders = blobHttpHeaders,
            Metadata = new Dictionary<string, string>
            {
                { "TenantId", tenantId.ToString() },
                { "EntityType", entityType },
                { "EntityId", entityId.ToString() },
                { "UploadedBy", uploadedByUserId.ToString() },
                { "OriginalFileName", fileName }
            }
        });

        // Create StoredFile entity
        var storedFile = new StoredFile
        {
            Id = fileId,
            TenantId = tenantId,
            FileName = $"{fileId}_{SanitizeFileName(fileName)}",
            OriginalFileName = fileName,
            ContentType = contentType,
            FileSizeBytes = fileStream.Length,
            FileHash = hash,
            StorageProvider = FileStorageProvider.AzureBlob,
            StorageProviderId = blobClient.Uri.ToString(),
            StoragePath = storagePath,
            EntityType = entityType,
            EntityId = entityId,
            Category = category,
            AccessLevel = FileAccessLevel.Private,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = uploadedByUserId
        };

        _context.StoredFiles.Add(storedFile);
        await _context.SaveChangesAsync();

        _logger.LogInformation("File uploaded: {FileName} to {StoragePath}", fileName, storagePath);

        return storedFile;
    }

    public async Task<Stream> DownloadFileAsync(Guid fileId, Guid userId)
    {
        var storedFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted)
            ?? throw new FileNotFoundException($"File not found: {fileId}");

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(storedFile.StoragePath);

        var download = await blobClient.DownloadStreamingAsync();

        // Log access
        await LogAccessAsync(fileId, userId, FileAccessType.Download);

        return download.Value.Content;
    }

    public async Task<bool> DeleteFileAsync(Guid fileId, Guid userId)
    {
        var storedFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted);

        if (storedFile == null)
            return false;

        // Soft delete in database
        storedFile.IsDeleted = true;
        storedFile.DeletedAt = DateTime.UtcNow;
        storedFile.DeletedByUserId = userId;

        // Optionally delete from blob storage (soft delete keeps file in DB)
        // Uncomment to hard delete:
        // var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        // var blobClient = containerClient.GetBlobClient(storedFile.StoragePath);
        // await blobClient.DeleteIfExistsAsync();

        await _context.SaveChangesAsync();

        _logger.LogInformation("File soft-deleted: {FileId} by {UserId}", fileId, userId);

        return true;
    }

    public async Task<StoredFile> CreateNewVersionAsync(
        Guid existingFileId,
        Stream fileStream,
        Guid userId)
    {
        var existingFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == existingFileId && !f.IsDeleted)
            ?? throw new FileNotFoundException($"File not found: {existingFileId}");

        // Upload new version
        var newFile = await UploadFileAsync(
            fileStream,
            existingFile.OriginalFileName,
            existingFile.ContentType,
            existingFile.EntityType,
            existingFile.EntityId,
            existingFile.TenantId,
            userId,
            existingFile.Category);

        // Link versions
        newFile.PreviousVersionId = existingFileId;
        newFile.Version = existingFile.Version + 1;

        await _context.SaveChangesAsync();

        return newFile;
    }

    public async Task<IEnumerable<StoredFile>> GetFileVersionsAsync(Guid fileId)
    {
        var versions = new List<StoredFile>();
        var currentFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == fileId);

        while (currentFile != null)
        {
            versions.Add(currentFile);
            if (currentFile.PreviousVersionId.HasValue)
            {
                currentFile = await _context.StoredFiles
                    .FirstOrDefaultAsync(f => f.Id == currentFile.PreviousVersionId);
            }
            else
            {
                currentFile = null;
            }
        }

        return versions;
    }

    public async Task<IEnumerable<StoredFile>> SearchFilesAsync(
        Guid tenantId,
        string? entityType = null,
        Guid? entityId = null,
        string? searchTerm = null)
    {
        var query = _context.StoredFiles
            .Where(f => f.TenantId == tenantId && !f.IsDeleted);

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(f => f.EntityType == entityType);

        if (entityId.HasValue)
            query = query.Where(f => f.EntityId == entityId.Value);

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(f => f.OriginalFileName.Contains(searchTerm) ||
                                     (f.Category != null && f.Category.Contains(searchTerm)));

        return await query.OrderByDescending(f => f.CreatedAt).ToListAsync();
    }

    public async Task<string> GenerateDownloadUrlAsync(Guid fileId, TimeSpan expiresIn)
    {
        var storedFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted)
            ?? throw new FileNotFoundException($"File not found: {fileId}");

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(storedFile.StoragePath);

        // Generate SAS token
        if (!blobClient.CanGenerateSasUri)
        {
            throw new InvalidOperationException("Cannot generate SAS URI. Ensure the connection string includes account key.");
        }

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _containerName,
            BlobName = storedFile.StoragePath,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5), // Allow for clock skew
            ExpiresOn = DateTimeOffset.UtcNow.Add(expiresIn),
            ContentDisposition = $"attachment; filename=\"{storedFile.OriginalFileName}\""
        };

        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUri = blobClient.GenerateSasUri(sasBuilder);

        return sasUri.ToString();
    }

    public async Task LogAccessAsync(
        Guid fileId,
        Guid userId,
        FileAccessType accessType,
        string? ipAddress = null,
        string? userAgent = null)
    {
        var accessLog = new FileAccessLog
        {
            Id = Guid.NewGuid(),
            StoredFileId = fileId,
            AccessedByUserId = userId,
            AccessedAt = DateTime.UtcNow,
            AccessType = accessType,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _context.Set<FileAccessLog>().Add(accessLog);
        await _context.SaveChangesAsync();
    }

    private static async Task<string> ComputeHashAsync(Stream stream)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(stream);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        return sanitized.Length > 200 ? sanitized[..200] : sanitized;
    }
}
