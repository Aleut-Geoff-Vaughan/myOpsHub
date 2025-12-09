import { api } from '../lib/api-client';
import { buildApiUrl } from '../config/api';

export interface StoredFileResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  category?: string;
  createdAt: string;
}

export interface FileListResponse {
  items: StoredFileResponse[];
  totalCount: number;
}

export interface FileDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

// Helper to get auth headers for XMLHttpRequest
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  try {
    const authState = localStorage.getItem('auth-storage');
    if (authState) {
      const parsed = JSON.parse(authState);
      const token = parsed.state?.token;
      const tenantId = parsed.state?.currentWorkspace?.tenantId;

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }
    }
  } catch (error) {
    console.error('Failed to get auth headers:', error);
  }

  return headers;
}

export const uploadFile = async (
  file: File,
  category: string = 'Resume',
  onProgress?: (progress: number) => void
): Promise<StoredFileResponse> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const xhr = new XMLHttpRequest();
    const url = buildApiUrl('/files/upload');

    xhr.open('POST', url, true);

    // Set auth headers
    const headers = getAuthHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // Track upload progress
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out'));
    };

    xhr.send(formData);
  });
};

export const listFiles = async (category?: string): Promise<FileListResponse> => {
  const endpoint = category ? `/files?category=${encodeURIComponent(category)}` : '/files';
  return api.get<FileListResponse>(endpoint);
};

export const getFile = async (fileId: string): Promise<StoredFileResponse> => {
  return api.get<StoredFileResponse>(`/files/${fileId}`);
};

export const downloadFile = async (fileId: string): Promise<void> => {
  // First get the file metadata
  const fileMetadata = await getFile(fileId);

  // Fetch the download endpoint
  const url = buildApiUrl(`/files/${fileId}/download`);
  const headers = getAuthHeaders();

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  // Check if response is JSON (Azure signed URL) or binary (local file)
  if (contentType.includes('application/json')) {
    const data = await response.json() as FileDownloadResponse;
    // Open signed URL in new tab for Azure storage
    window.open(data.downloadUrl, '_blank');
  } else {
    // Binary response - create download link
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileMetadata.originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }
};

export const getDownloadUrl = async (fileId: string): Promise<FileDownloadResponse> => {
  return api.get<FileDownloadResponse>(`/files/${fileId}/download`);
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await api.delete(`/files/${fileId}`);
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper function to get file icon based on content type
export const getFileIcon = (contentType: string): string => {
  if (contentType.includes('pdf')) return 'pdf';
  if (contentType.includes('word') || contentType.includes('document')) return 'doc';
  if (contentType.includes('image')) return 'image';
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'xls';
  return 'file';
};
