import { FileText, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ResumeVersion } from '../../types/api';

interface ResumeVersionTileProps {
  version: ResumeVersion;
  onClick: () => void;
}

export function ResumeVersionTile({ version, onClick }: ResumeVersionTileProps) {
  const formattedDate = new Date(version.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all hover:border-blue-300 ${
        version.isActive ? 'border-blue-500 ring-1 ring-blue-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          {version.isActive && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">v{version.versionNumber}</p>
          <h3 className="font-semibold text-gray-900 truncate">
            {version.versionName || `Version ${version.versionNumber}`}
          </h3>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>

        {version.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{version.description}</p>
        )}
      </div>
    </Card>
  );
}
