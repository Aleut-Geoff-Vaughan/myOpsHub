# Simplified Resume Home Page - Design Proposal

## Status: AWAITING USER FEEDBACK

---

## Current State

The current `ResumesPage.tsx` shows:
- Resume status badge
- Stats (sections count, versions count, last reviewed, public status)
- Quick action cards (View & Edit, Experience, Education, Skills)
- Resume sections summary

---

## Proposed New Design

### 1. Simplified Home Page Layout

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
│  │  [View/Edit]  │  │  [View/Edit]  │  │  [View/Edit]  │            │
│  └───────────────┘  └───────────────┘  └───────────────┘            │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Resume Attachments                                    [+ Upload]    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  📎 MyResume_Federal_2025.pdf      PDF • 245 KB    [⬇️] [🗑️]   ││
│  │  📎 MyResume_Commercial.docx       Word • 128 KB   [⬇️] [🗑️]   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Dashboard Section - Expiring Certifications

This would appear on the main dashboard (`MyHubPage.tsx`):

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

### 3. File Attachment Architecture

**Backend:**
- Create `AzureBlobStorageService` implementing existing `IFileStorageService`
- Add new endpoint: `POST /api/resumes/{id}/attachments` for file upload
- Add new endpoint: `GET /api/resumes/{id}/attachments` for listing
- Add new endpoint: `DELETE /api/resumes/attachments/{fileId}` for deletion
- Add new endpoint: `GET /api/resumes/attachments/{fileId}/download` for download

**Storage Structure:**
```
Azure Blob Container: resume-attachments
  └── {tenantId}/
      └── {userId}/
          └── {fileId}_{originalFileName}
```

**Database:**
- Use existing `StoredFile` entity with `EntityType = "ResumeAttachment"`
- Link via `EntityId = ResumeProfile.Id`

---

## Questions Needing Answers

### 1. Version Tiles Display
- [ ] Should clicking a version tile navigate to the full editor (`/resumes/{id}`) or show a quick preview modal?
- [ ] Do you want to show the version's content snapshot summary (e.g., "3 experiences, 5 skills") on each tile?

### 2. File Attachments
- [ ] What file types should be allowed? (e.g., PDF, DOC, DOCX only, or also images?)
- [ ] Max file size limit? (e.g., 10MB, 25MB?)
- [ ] Should we limit the number of attachments per user? (e.g., max 5 files?)
- [ ] Should attachments be tied to specific versions, or shared across all versions?

### 3. Expiring Certifications on Dashboard
- [ ] Should this show on the main myHub dashboard, or only on the resume page?
- [ ] What's the threshold for showing certifications? (e.g., expiring within 90 days?)
- [ ] Should there be email notifications for expiring certifications? (future enhancement?)

### 4. Azure Blob Storage Configuration
- [ ] Do you already have an Azure Storage Account set up, or do I need to provide setup instructions?
- [ ] Should I use the connection string from environment variables (e.g., `AzureStorage__ConnectionString`)?

---

## Existing Infrastructure Summary

### Resume Versions (Already Implemented)
- `ResumeVersion` entity exists with:
  - `VersionNumber`, `VersionName`, `Description`
  - `ContentSnapshot` (JSON snapshot of resume at that point)
  - `IsActive` flag for current version
  - `CreatedByUserId`, timestamps

### File Storage (Interface Exists, Implementation Needed)
- `IFileStorageService` interface defined
- `StoredFile` entity exists with:
  - File metadata (name, size, content type, hash)
  - Storage provider support (SharePoint, AzureBlob, LocalFileSystem, S3)
  - Access control levels (Private, TenantRestricted, Public)
  - Versioning support
  - Access logging

### Certifications (Already Implemented)
- `PersonCertification` entity exists with:
  - `IssueDate`, `ExpiryDate`
  - `CredentialId`
  - Links to `User` and `Certification` entities

---

## Implementation Plan (Once Questions Answered)

### Phase 1: Frontend - Simplified Resume Page
1. Rewrite `ResumesPage.tsx` with version tiles grid
2. Create `ResumeVersionTile.tsx` component
3. Add "Create New Version" functionality

### Phase 2: Backend - Azure Blob Storage Service
1. Create `AzureBlobStorageService.cs` implementing `IFileStorageService`
2. Add configuration for Azure Storage connection string
3. Register service in DI container

### Phase 3: Backend - Resume Attachments API
1. Add attachment endpoints to `ResumesController.cs`
2. Handle file upload with validation
3. Implement download with signed URLs

### Phase 4: Frontend - Attachments UI
1. Create `ResumeAttachments.tsx` component
2. Add upload modal with drag-and-drop
3. Display attachment list with download/delete

### Phase 5: Expiring Certifications Dashboard
1. Add API endpoint for user's expiring certifications
2. Create `ExpiringCertifications.tsx` component
3. Integrate into `MyHubPage.tsx`

---

## Files to Modify/Create

### Frontend (New)
- `frontend/src/components/resume/ResumeVersionTile.tsx`
- `frontend/src/components/resume/ResumeAttachments.tsx`
- `frontend/src/components/resume/ResumeAttachmentUploadModal.tsx`
- `frontend/src/components/ExpiringCertifications.tsx`
- `frontend/src/hooks/useResumeAttachments.ts`
- `frontend/src/hooks/useExpiringCertifications.ts`

### Frontend (Modify)
- `frontend/src/pages/ResumesPage.tsx` - Complete rewrite
- `frontend/src/pages/MyHubPage.tsx` - Add certifications section
- `frontend/src/services/resumeService.ts` - Add attachment methods
- `frontend/src/types/api.ts` - Add attachment types

### Backend (New)
- `backend/src/MyScheduling.Infrastructure/Services/AzureBlobStorageService.cs`

### Backend (Modify)
- `backend/src/MyScheduling.Api/Controllers/ResumesController.cs` - Add attachment endpoints
- `backend/src/MyScheduling.Api/Controllers/CertificationsController.cs` - Add expiring endpoint
- `backend/src/MyScheduling.Api/Program.cs` - Register blob storage service

---

## Related Completed Tasks (This Session)

1. ✅ Removed Work Location Template from Manager Portal
2. ✅ Added Edit button in Apply Template Modal
3. ✅ Added Clone button on Templates
4. ✅ Fixed PTO notes field to clear when empty
