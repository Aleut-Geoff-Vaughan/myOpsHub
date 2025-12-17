using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Api.Models;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Enums;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly IFileStorageService _fileStorageService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FilesController> _logger;

    private const long DefaultMaxFileSize = 26214400; // 25MB

    public FilesController(
        MySchedulingDbContext context,
        IFileStorageService fileStorageService,
        IConfiguration configuration,
        ILogger<FilesController> logger)
    {
        _context = context;
        _fileStorageService = fileStorageService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Upload a file with optional category
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(26214400)] // 25MB
    public async Task<ActionResult<FileUploadResponse>> UploadFile(
        IFormFile file,
        [FromForm] string? category = "Resume")
    {
        try
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            // Validate file
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file provided" });
            }

            var maxFileSize = _configuration.GetValue<long>("FileStorage:MaxFileSizeBytes", DefaultMaxFileSize);
            if (file.Length > maxFileSize)
            {
                return BadRequest(new { message = $"File size exceeds maximum allowed size of {maxFileSize / 1024 / 1024}MB" });
            }

            // Upload file
            using var stream = file.OpenReadStream();
            var storedFile = await _fileStorageService.UploadFileAsync(
                stream,
                file.FileName,
                file.ContentType,
                "UserAttachment",
                userId, // EntityId = user's own files
                tenantId.Value,
                userId,
                category);

            _logger.LogInformation("File uploaded: {FileName} by user {UserId}", file.FileName, userId);

            return Created($"/api/files/{storedFile.Id}", new FileUploadResponse
            {
                Id = storedFile.Id,
                FileName = storedFile.FileName,
                OriginalFileName = storedFile.OriginalFileName,
                ContentType = storedFile.ContentType,
                FileSizeBytes = storedFile.FileSizeBytes,
                Category = storedFile.Category,
                CreatedAt = storedFile.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, new { message = "An error occurred while uploading the file" });
        }
    }

    /// <summary>
    /// List user's files, optionally filtered by category
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<FileListResponse>> ListFiles(
        [FromQuery] string? category = null,
        [FromQuery] string? entityType = null,
        [FromQuery] Guid? entityId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            // Default to user's own files
            var effectiveEntityType = entityType ?? "UserAttachment";
            var effectiveEntityId = entityId ?? userId;

            var query = _context.StoredFiles
                .Where(f => f.TenantId == tenantId.Value &&
                           f.EntityType == effectiveEntityType &&
                           f.EntityId == effectiveEntityId &&
                           !f.IsDeleted);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(f => f.Category == category);
            }

            var files = await query
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FileItemResponse
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    OriginalFileName = f.OriginalFileName,
                    ContentType = f.ContentType,
                    FileSizeBytes = f.FileSizeBytes,
                    Category = f.Category,
                    CreatedAt = f.CreatedAt
                })
                .ToListAsync();

            return Ok(new FileListResponse
            {
                Items = files,
                TotalCount = files.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing files");
            return StatusCode(500, new { message = "An error occurred while listing files" });
        }
    }

    /// <summary>
    /// Get file metadata by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FileItemResponse>> GetFile(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            var file = await _context.StoredFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (file == null)
            {
                return NotFound(new { message = "File not found" });
            }

            // Verify access: must be same tenant and either owner or admin
            if (file.TenantId != tenantId.Value)
            {
                return NotFound(new { message = "File not found" });
            }

            if (file.EntityType == "UserAttachment" && file.EntityId != userId && !IsSystemAdmin())
            {
                return ForbiddenWithLog(_logger, $"File:{id}", "Read",
                    $"User {userId} attempted to access file owned by {file.EntityId}");
            }

            return Ok(new FileItemResponse
            {
                Id = file.Id,
                FileName = file.FileName,
                OriginalFileName = file.OriginalFileName,
                ContentType = file.ContentType,
                FileSizeBytes = file.FileSizeBytes,
                Category = file.Category,
                CreatedAt = file.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting file {FileId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get download URL for a file (returns signed URL for Azure, direct download for local)
    /// </summary>
    [HttpGet("{id:guid}/download")]
    public async Task<ActionResult<FileDownloadResponse>> GetDownloadUrl(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            var file = await _context.StoredFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (file == null)
            {
                return NotFound(new { message = "File not found" });
            }

            // Verify access
            if (file.TenantId != tenantId.Value)
            {
                return NotFound(new { message = "File not found" });
            }

            if (file.EntityType == "UserAttachment" && file.EntityId != userId && !IsSystemAdmin())
            {
                return ForbiddenWithLog(_logger, $"File:{id}", "Download",
                    $"User {userId} attempted to download file owned by {file.EntityId}");
            }

            // For local storage, stream the file directly
            if (file.StorageProvider == FileStorageProvider.LocalFileSystem)
            {
                var stream = await _fileStorageService.DownloadFileAsync(id, userId);
                return File(stream, file.ContentType, file.OriginalFileName);
            }

            // For Azure, generate signed URL
            var expiresIn = TimeSpan.FromHours(1);
            var downloadUrl = await _fileStorageService.GenerateDownloadUrlAsync(id, expiresIn);

            return Ok(new FileDownloadResponse
            {
                DownloadUrl = downloadUrl,
                ExpiresAt = DateTime.UtcNow.Add(expiresIn)
            });
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogWarning("File not found during download: FileId={FileId}, UserId={UserId}, Message={Message}",
                id, GetCurrentUserId(), ex.Message);
            return NotFound(CreateErrorResponse("File not found", ApiErrorCodes.NotFound));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file {FileId}", id);
            return InternalServerError("An error occurred while downloading the file");
        }
    }

    /// <summary>
    /// Delete a file (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFile(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            var file = await _context.StoredFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (file == null)
            {
                return NotFound(new { message = "File not found" });
            }

            // Verify access: must be same tenant and either owner or admin
            if (file.TenantId != tenantId.Value)
            {
                return NotFound(new { message = "File not found" });
            }

            if (file.EntityType == "UserAttachment" && file.EntityId != userId && !IsSystemAdmin())
            {
                return ForbiddenWithLog(_logger, $"File:{id}", "Delete",
                    $"User {userId} attempted to delete file owned by {file.EntityId}");
            }

            await _fileStorageService.DeleteFileAsync(id, userId);

            _logger.LogInformation("File deleted: {FileId} by user {UserId}", id, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FileId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the file" });
        }
    }

    #region Helper Methods

    private Guid? GetCurrentTenantId()
    {
        // Check X-Tenant-Id header first (set by frontend when workspace selected)
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            // Verify user has access to this tenant
            var userTenantIds = GetUserTenantIds();
            if (userTenantIds.Contains(parsedHeaderTenantId))
                return parsedHeaderTenantId;
        }

        // Fallback to first TenantId claim
        var tenantIds = GetUserTenantIds();
        return tenantIds.FirstOrDefault();
    }

    #endregion
}

#region DTOs

public class FileUploadResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Category { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FileListResponse
{
    public List<FileItemResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
}

public class FileItemResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Category { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FileDownloadResponse
{
    public string DownloadUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

#endregion
