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

    // Allowed file extensions (whitelist approach for security)
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        // Documents
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".odt", ".ods", ".odp",
        // Images
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico",
        // Data files
        ".csv", ".json", ".xml",
        // Archives (limited)
        ".zip"
    };

    // MIME type to extension mapping for validation
    private static readonly Dictionary<string, HashSet<string>> MimeTypeExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { "application/pdf", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".pdf" } },
        { "application/msword", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".doc" } },
        { "application/vnd.openxmlformats-officedocument.wordprocessingml.document", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".docx" } },
        { "application/vnd.ms-excel", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".xls" } },
        { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".xlsx" } },
        { "application/vnd.ms-powerpoint", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".ppt" } },
        { "application/vnd.openxmlformats-officedocument.presentationml.presentation", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".pptx" } },
        { "text/plain", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".txt" } },
        { "text/csv", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".csv" } },
        { "application/json", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".json" } },
        { "application/xml", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".xml" } },
        { "text/xml", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".xml" } },
        { "image/jpeg", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg" } },
        { "image/png", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".png" } },
        { "image/gif", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".gif" } },
        { "image/bmp", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".bmp" } },
        { "image/webp", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".webp" } },
        { "image/svg+xml", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".svg" } },
        { "application/zip", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".zip" } },
        { "application/x-zip-compressed", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".zip" } },
    };

    // Dangerous extensions that should never be allowed (blocklist as extra safety)
    private static readonly HashSet<string> BlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".bat", ".cmd", ".ps1", ".sh", ".vbs", ".js", ".jar", ".msi", ".com", ".scr",
        ".php", ".asp", ".aspx", ".jsp", ".cgi", ".pl", ".py", ".rb", ".htaccess", ".htpasswd"
    };

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
        // Validate file before upload
        ValidateFile(fileName, contentType);

        // Generate unique file ID
        var fileId = Guid.NewGuid();

        // Compute file hash for deduplication
        fileStream.Position = 0;
        var hash = await ComputeHashAsync(fileStream);
        fileStream.Position = 0;

        // Build storage path: {tenantId}/{userId}/{category}/{fileId}_{filename}
        var categoryPath = string.IsNullOrEmpty(category) ? "files" : category.ToLowerInvariant();
        var storagePath = $"{tenantId}/{entityId}/{categoryPath}/{fileId}_{SanitizeFileName(fileName)}";

        try
        {
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

            _logger.LogInformation("File uploaded: {FileName} to {StoragePath} by user {UserId}", fileName, storagePath, uploadedByUserId);

            return storedFile;
        }
        catch (Azure.RequestFailedException ex)
        {
            _logger.LogError(ex,
                "Azure Blob upload failed for {FileName}. Status: {Status}, ErrorCode: {ErrorCode}, TenantId: {TenantId}, UserId: {UserId}",
                fileName, ex.Status, ex.ErrorCode, tenantId, uploadedByUserId);
            throw new InvalidOperationException($"Failed to upload file to Azure Blob Storage: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error uploading file {FileName} for tenant {TenantId}", fileName, tenantId);
            throw;
        }
    }

    public async Task<Stream> DownloadFileAsync(Guid fileId, Guid userId)
    {
        var storedFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted)
            ?? throw new FileNotFoundException($"File not found: {fileId}");

        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(storedFile.StoragePath);

            var download = await blobClient.DownloadStreamingAsync();

            // Log access
            await LogAccessAsync(fileId, userId, FileAccessType.Download);

            return download.Value.Content;
        }
        catch (Azure.RequestFailedException ex)
        {
            _logger.LogError(ex,
                "Azure Blob download failed for file {FileId}. Status: {Status}, ErrorCode: {ErrorCode}, StoragePath: {StoragePath}",
                fileId, ex.Status, ex.ErrorCode, storedFile.StoragePath);
            throw new InvalidOperationException($"Failed to download file from Azure Blob Storage: {ex.Message}", ex);
        }
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

    /// <summary>
    /// Validates file extension and MIME type before upload.
    /// Throws ArgumentException if validation fails.
    /// </summary>
    private void ValidateFile(string fileName, string contentType)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("File name cannot be empty.", nameof(fileName));
        }

        var extension = Path.GetExtension(fileName);

        // Check if extension is in blocklist (dangerous files)
        if (BlockedExtensions.Contains(extension))
        {
            _logger.LogWarning("Blocked file upload attempt: {FileName} (blocked extension)", fileName);
            throw new ArgumentException($"File type '{extension}' is not allowed for security reasons.", nameof(fileName));
        }

        // Check if extension is in whitelist
        if (!AllowedExtensions.Contains(extension))
        {
            _logger.LogWarning("Rejected file upload: {FileName} (extension not in whitelist)", fileName);
            throw new ArgumentException($"File type '{extension}' is not supported. Allowed types: PDF, Word, Excel, PowerPoint, images, CSV, JSON, XML, ZIP.", nameof(fileName));
        }

        // Validate MIME type matches extension (prevent disguised files)
        if (!string.IsNullOrEmpty(contentType) && MimeTypeExtensions.TryGetValue(contentType, out var expectedExtensions))
        {
            if (!expectedExtensions.Contains(extension))
            {
                _logger.LogWarning("MIME type mismatch for {FileName}: ContentType={ContentType}, Extension={Extension}",
                    fileName, contentType, extension);
                throw new ArgumentException($"File content type '{contentType}' does not match file extension '{extension}'.", nameof(contentType));
            }
        }

        // Check for double extensions (e.g., file.pdf.exe)
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
        var innerExtension = Path.GetExtension(fileNameWithoutExtension);
        if (!string.IsNullOrEmpty(innerExtension) && BlockedExtensions.Contains(innerExtension))
        {
            _logger.LogWarning("Blocked double extension file: {FileName}", fileName);
            throw new ArgumentException("File appears to have a suspicious double extension.", nameof(fileName));
        }

        _logger.LogDebug("File validation passed: {FileName}, ContentType={ContentType}", fileName, contentType);
    }
}
