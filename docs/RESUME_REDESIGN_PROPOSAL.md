# Resume Redesign - Final Design & Development Plan

## Status: APPROVED - READY FOR IMPLEMENTATION

---

## Design Decisions Summary

| Decision | Answer |
|----------|--------|
| Version tile click action | Navigate to full editor (`/resumes/{versionId}`) |
| Version tile content | Simple: Name, Active badge, Date only (no snapshot summary) |
| File types allowed | No restrictions |
| Max file size | 25MB |
| Attachment limit | Unlimited |
| Attachment scope | User-level with `Category` field for extensibility (not tied to versions) |
| Expiring certs location | Both MyHub dashboard AND Resume page |
| Expiry threshold | 90 days (tenant-configurable) |
| Email notifications | Yes, build now |
| Storage configuration | Environment variables for prod, appsettings for localhost |

---

## Final Design

### 1. Simplified Resume Home Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  My Resume                                              [+ New Version]
│  Manage your professional resume versions
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │
│  │  📄 v1        │  │  📄 v2        │  │  📄 v3        │            │
│  │  "Federal"    │  │  "Commercial" │  │  "Technical"  │            │
│  │               │  │               │  │               │            │
│  │  ✓ Active     │  │               │  │               │            │
│  │               │  │               │  │               │            │
│  │  Jan 15, 2025 │  │  Feb 1, 2025  │  │  Feb 10, 2025 │            │
│  └───────────────┘  └───────────────┘  └───────────────┘            │
│                                                                       │
│  (Click tile to open full editor for that version)                  │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  ⚠️ Expiring Certifications                                          │
├─────────────────────────────────────────────────────────────────────┤
│  🔴 AWS Solutions Architect       Expires in 15 days (Mar 25)       │
│  🟡 PMP Certification             Expires in 45 days (Apr 24)       │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  My Attachments                                        [+ Upload]    │
├─────────────────────────────────────────────────────────────────────┤
│  📎 MyResume_Federal_2025.pdf      PDF • 245 KB       [⬇] [🗑]     │
│  📎 MyResume_Commercial.docx       Word • 128 KB      [⬇] [🗑]     │
│  📎 Clearance_Letter.pdf           PDF • 89 KB        [⬇] [🗑]     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. MyHub Dashboard - Expiring Certifications Widget

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ Expiring Certifications                           [View All →]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔴 AWS Solutions Architect          Expires in 15 days              │
│     Amazon Web Services              Mar 25, 2025                     │
│                                                                       │
│  🟡 PMP Certification                Expires in 45 days              │
│     Project Management Institute     Apr 24, 2025                     │
│                                                                       │
│  🟢 CISSP                            Expires in 90 days              │
│     (ISC)²                           Jun 8, 2025                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Color coding:**
- 🔴 Red: Expires within 30 days
- 🟡 Yellow: Expires within 60 days
- 🟢 Green: Expires within 90 days
- Hidden: More than 90 days out (configurable per tenant)

### 3. Extensible File Storage Architecture

**Database Design - StoredFile Entity (existing, with usage pattern):**
```
StoredFile
├── EntityType = "UserAttachment"       // Generic user file storage
├── EntityId = User.Id                  // Tied to user, not resume
├── Category = "Resume" | "ProfilePhoto" | "OfficeLease" | "Other"  // Extensible
├── FileName, OriginalFileName, ContentType, FileSizeBytes
├── StorageProvider = "AzureBlob"
├── StoragePath = "{tenantId}/{userId}/{category}/{fileId}_{filename}"
├── TenantId                            // Multi-tenant isolation
└── AccessLevel = "Private"             // User's own files
```

**Storage Structure (Azure Blob):**
```
Container: myscheduling-files
└── {tenantId}/
    └── {userId}/
        ├── resume/
        │   ├── {fileId}_MyResume_Federal.pdf
        │   └── {fileId}_MyResume_Commercial.docx
        ├── profile/
        │   └── {fileId}_headshot.jpg
        └── documents/
            └── {fileId}_clearance_letter.pdf
```

**API Design:**
```
Generic File Storage Controller: /api/files

POST   /api/files/upload                    # Upload with category param
GET    /api/files?category=Resume           # List user's files by category
GET    /api/files/{fileId}/download         # Download file (signed URL)
DELETE /api/files/{fileId}                  # Soft delete

Query params:
  - category: "Resume" | "ProfilePhoto" | "OfficeLease" | etc.
  - entityType: optional override (default: UserAttachment)
  - entityId: optional override (default: current user ID)
```

### 4. Tenant Settings Extension

Add to `TenantSettings`:
```csharp
// Certification Expiry Notification Settings
public int CertificationExpiryWarningDays { get; set; } = 90;  // Show in UI
public int CertificationExpiryEmailDays { get; set; } = 30;    // Send email
public bool EnableCertificationExpiryEmails { get; set; } = true;
```

### 5. Email Notification Service

**Certification Expiry Email:**
- Triggered daily via background job
- Sends when certification expires within `CertificationExpiryEmailDays`
- One email per certification (not batched) for clarity
- Template includes: cert name, issuer, expiry date, days remaining, renewal link

---

## Development Plan

### Phase 1: Backend - Azure Blob Storage Service
**Estimated files: 3 new, 2 modified**

1. **Create `AzureBlobStorageService.cs`** implementing `IFileStorageService`
   - Upload file to blob with path structure
   - Generate SAS token download URLs (expiring)
   - Delete blob (soft delete via StoredFile entity)
   - List files by tenant/user/category
   - Support local file system fallback for localhost

2. **Create `LocalFileStorageService.cs`** for development
   - Store in `{project}/uploads/{tenantId}/{userId}/...`
   - Same interface as Azure implementation

3. **Update `Program.cs`**
   - Register storage service based on configuration
   - Add Azure.Storage.Blobs NuGet package

4. **Add configuration**
   - `appsettings.json`: LocalFileSystem path for dev
   - `appsettings.Production.json`: Azure connection string reference

### Phase 2: Backend - File Storage API
**Estimated files: 1 new controller**

1. **Create `FilesController.cs`**
   ```
   POST   /api/files/upload
   GET    /api/files
   GET    /api/files/{id}
   GET    /api/files/{id}/download
   DELETE /api/files/{id}
   ```

2. **Validation**
   - Max 25MB file size
   - Validate user owns file for download/delete
   - Require authentication
   - Multi-tenant isolation via TenantId claim

### Phase 3: Backend - Expiring Certifications API
**Estimated files: 1 modified**

1. **Add to `CertificationsController.cs`**
   ```
   GET /api/certifications/expiring           # Current user's expiring certs
   GET /api/certifications/expiring/team      # Manager's team (requires ManageResumes)
   ```

2. **Query logic**
   - Filter by `ExpiryDate` within configurable days
   - Return days remaining, urgency level (red/yellow/green)
   - Sort by expiry date ascending

### Phase 4: Backend - Tenant Settings & Email
**Estimated files: 2 modified, 1 new**

1. **Update `TenantSettings.cs`**
   - Add certification expiry configuration fields

2. **Create EF Migration**
   - Add new columns with defaults

3. **Create `CertificationExpiryNotificationService.cs`**
   - Query expiring certifications
   - Send email via existing email service
   - Track sent notifications (avoid duplicates)

4. **Add Hangfire/BackgroundService job**
   - Daily check at 8 AM tenant timezone
   - Process all tenants with feature enabled

### Phase 5: Frontend - Resume Page Rewrite
**Estimated files: 2 new, 1 major rewrite**

1. **Create `ResumeVersionTile.tsx`**
   - Card component with version info
   - Active badge styling
   - Click navigates to `/resumes/{versionId}`

2. **Create `ResumeVersionGrid.tsx`**
   - Grid layout for version tiles
   - "+ New Version" card/button
   - Empty state for no versions

3. **Rewrite `ResumesPage.tsx`**
   - Version grid section
   - Expiring certifications section (compact)
   - Attachments section
   - Create resume prompt if none exists

### Phase 6: Frontend - File Attachments UI
**Estimated files: 4 new**

1. **Create `useFileStorage.ts` hook**
   - Upload mutation with progress
   - List query with category filter
   - Delete mutation
   - Download helper (open signed URL)

2. **Create `fileStorageService.ts`**
   - API client functions

3. **Create `FileAttachmentList.tsx`**
   - Display file list with icons
   - Download/delete actions
   - File size formatting

4. **Create `FileUploadModal.tsx`**
   - Drag-and-drop zone
   - File type/size validation (client-side)
   - Upload progress indicator
   - Category selector (for future extensibility)

### Phase 7: Frontend - Expiring Certifications
**Estimated files: 3 new, 1 modified**

1. **Create `useExpiringCertifications.ts` hook**
   - Query with refetch interval
   - Transform to UI model with urgency level

2. **Create `ExpiringCertificationsWidget.tsx`**
   - For MyHub dashboard (full view)
   - Shows all expiring with details

3. **Create `ExpiringCertificationsCompact.tsx`**
   - For Resume page (compact list)
   - Shows count + top 3

4. **Update `MyHubPage.tsx`**
   - Add widget to dashboard grid

### Phase 8: Testing & Polish
**Estimated: Integration testing, edge cases**

1. Test file upload/download flow end-to-end
2. Test expiring certifications with various dates
3. Test email notifications (dev environment)
4. Handle edge cases:
   - No certifications
   - No versions
   - Large file uploads
   - Slow network conditions

---

## Files to Create/Modify Summary

### Backend - New Files (6)
- `Infrastructure/Services/AzureBlobStorageService.cs`
- `Infrastructure/Services/LocalFileStorageService.cs`
- `Infrastructure/Services/CertificationExpiryNotificationService.cs`
- `Api/Controllers/FilesController.cs`
- `Infrastructure/Migrations/{timestamp}_AddCertificationExpirySettings.cs`
- Email template for certification expiry

### Backend - Modified Files (4)
- `Core/Entities/TenantSettings.cs` - Add expiry config fields
- `Api/Controllers/CertificationsController.cs` - Add expiring endpoint
- `Api/Program.cs` - Register services, add Hangfire job
- `appsettings.json` / `appsettings.Development.json` - Storage config

### Frontend - New Files (9)
- `components/resume/ResumeVersionTile.tsx`
- `components/resume/ResumeVersionGrid.tsx`
- `components/resume/FileAttachmentList.tsx`
- `components/resume/FileUploadModal.tsx`
- `components/dashboard/ExpiringCertificationsWidget.tsx`
- `components/dashboard/ExpiringCertificationsCompact.tsx`
- `hooks/useFileStorage.ts`
- `hooks/useExpiringCertifications.ts`
- `services/fileStorageService.ts`

### Frontend - Modified Files (3)
- `pages/ResumesPage.tsx` - Complete rewrite
- `pages/MyHubPage.tsx` - Add certifications widget
- `types/api.ts` - Add file storage types

---

## API Contracts

### File Storage

**Upload File**
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: <binary>
category: "Resume" | "ProfilePhoto" | "Document"

Response 201:
{
  "id": "guid",
  "fileName": "MyResume.pdf",
  "originalFileName": "MyResume.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 245000,
  "category": "Resume",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**List Files**
```http
GET /api/files?category=Resume

Response 200:
{
  "items": [
    {
      "id": "guid",
      "fileName": "MyResume_Federal.pdf",
      "originalFileName": "MyResume_Federal.pdf",
      "contentType": "application/pdf",
      "fileSizeBytes": 245000,
      "category": "Resume",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "totalCount": 1
}
```

**Download File**
```http
GET /api/files/{id}/download

Response 200:
{
  "downloadUrl": "https://storage.blob.core.windows.net/..?sig=...",
  "expiresAt": "2025-01-15T11:30:00Z"
}
```

### Expiring Certifications

**Get User's Expiring Certifications**
```http
GET /api/certifications/expiring

Response 200:
{
  "items": [
    {
      "id": "guid",
      "certificationName": "AWS Solutions Architect",
      "issuer": "Amazon Web Services",
      "expiryDate": "2025-03-25",
      "daysRemaining": 15,
      "urgencyLevel": "critical"  // "critical" | "warning" | "info"
    }
  ],
  "totalCount": 3
}
```

---

## Configuration

### appsettings.Development.json
```json
{
  "FileStorage": {
    "Provider": "LocalFileSystem",
    "LocalPath": "./uploads"
  }
}
```

### Environment Variables (Production)
```
AzureStorage__ConnectionString=DefaultEndpointsProtocol=https;AccountName=...
AzureStorage__ContainerName=myscheduling-files
```

---

## Notes & Considerations

1. **Extensibility**: The `Category` field on file storage allows future expansion (office leases, profile photos, etc.) without schema changes

2. **Security**: All files are private by default, require authentication, and enforce tenant isolation

3. **Email throttling**: Consider adding a "last notified" timestamp to avoid daily duplicate emails for the same certification

4. **Offline resume editing**: The version tiles link to the editor; users still use the existing detailed editor for content changes

5. **Migration path**: Existing resume page features (status badge, approval workflow) should remain accessible from the editor page, not the simplified home

---

## Related Completed Tasks

1. ✅ Removed Work Location Template from Manager Portal
2. ✅ Added Edit button in Apply Template Modal
3. ✅ Added Clone button on Templates
4. ✅ Fixed PTO notes field to clear when empty
