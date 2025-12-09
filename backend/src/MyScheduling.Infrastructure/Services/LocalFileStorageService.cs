using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Enums;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Infrastructure.Services;

/// <summary>
/// Local file system storage implementation for development and testing.
/// Files are stored in a local directory structure.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly MySchedulingDbContext _context;
    private readonly string _basePath;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(
        MySchedulingDbContext context,
        IConfiguration configuration,
        ILogger<LocalFileStorageService> logger)
    {
        _context = context;
        _logger = logger;

        _basePath = configuration["FileStorage:LocalPath"] ?? "./uploads";

        // Ensure base directory exists
        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
        }
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

        // Build storage path: {basePath}/{tenantId}/{entityId}/{category}/{fileId}_{filename}
        var categoryPath = string.IsNullOrEmpty(category) ? "files" : category.ToLowerInvariant();
        var relativeDir = Path.Combine(tenantId.ToString(), entityId.ToString(), categoryPath);
        var fullDir = Path.Combine(_basePath, relativeDir);

        // Ensure directory exists
        if (!Directory.Exists(fullDir))
        {
            Directory.CreateDirectory(fullDir);
        }

        var sanitizedFileName = SanitizeFileName(fileName);
        var storedFileName = $"{fileId}_{sanitizedFileName}";
        var storagePath = Path.Combine(relativeDir, storedFileName);
        var fullPath = Path.Combine(_basePath, storagePath);

        // Write file to disk
        using (var fileOutput = File.Create(fullPath))
        {
            await fileStream.CopyToAsync(fileOutput);
        }

        // Create StoredFile entity
        var storedFile = new StoredFile
        {
            Id = fileId,
            TenantId = tenantId,
            FileName = storedFileName,
            OriginalFileName = fileName,
            ContentType = contentType,
            FileSizeBytes = fileStream.Length,
            FileHash = hash,
            StorageProvider = FileStorageProvider.LocalFileSystem,
            StorageProviderId = fullPath,
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

        _logger.LogInformation("File uploaded locally: {FileName} to {StoragePath}", fileName, storagePath);

        return storedFile;
    }

    public async Task<Stream> DownloadFileAsync(Guid fileId, Guid userId)
    {
        var storedFile = await _context.StoredFiles
            .FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted)
            ?? throw new FileNotFoundException($"File not found: {fileId}");

        var fullPath = Path.Combine(_basePath, storedFile.StoragePath);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Physical file not found: {fullPath}");
        }

        // Log access
        await LogAccessAsync(fileId, userId, FileAccessType.Download);

        // Return file stream (caller is responsible for disposing)
        return new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
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

        // Optionally delete physical file (soft delete keeps file on disk)
        // Uncomment to hard delete:
        // var fullPath = Path.Combine(_basePath, storedFile.StoragePath);
        // if (File.Exists(fullPath))
        // {
        //     File.Delete(fullPath);
        // }

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

    public Task<string> GenerateDownloadUrlAsync(Guid fileId, TimeSpan expiresIn)
    {
        // For local storage, we return a relative API path
        // The actual download will go through the FilesController
        return Task.FromResult($"/api/files/{fileId}/download");
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
