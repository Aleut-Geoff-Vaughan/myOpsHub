import { FileText, Download, Trash2, FileType, Image, File } from 'lucide-react';
import { Button } from '../ui/Button';
import type { StoredFileResponse } from '../../services/fileStorageService';
import { formatFileSize, getFileIcon } from '../../services/fileStorageService';

interface FileAttachmentListProps {
  files: StoredFileResponse[];
  onDownload: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  isDeleting?: boolean;
  isDownloading?: boolean;
}

export function FileAttachmentList({
  files,
  onDownload,
  onDelete,
  isDeleting,
  isDownloading,
}: FileAttachmentListProps) {
  const getIcon = (contentType: string) => {
    const iconType = getFileIcon(contentType);
    switch (iconType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
        return <FileType className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No attachments yet</p>
        <p className="text-sm">Upload resume files to keep them organized</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {files.map((file) => (
        <div key={file.id} className="py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">{getIcon(file.contentType)}</div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{file.originalFileName}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.fileSizeBytes)} &bull;{' '}
                {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(file.id)}
              disabled={isDownloading}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(file.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
