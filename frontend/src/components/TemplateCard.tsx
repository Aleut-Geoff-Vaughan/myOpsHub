import React from 'react';
import type { WorkLocationTemplate } from '../types/template';
import { TemplateType } from '../types/template';
import { WorkLocationType } from '../types/api';

interface TemplateCardProps {
  template: WorkLocationTemplate;
  onEdit: (template: WorkLocationTemplate) => void;
  onDelete: (id: string) => void;
  onApply: (template: WorkLocationTemplate) => void;
  isOwner: boolean;
}

const getTemplateTypeLabel = (type: TemplateType): string => {
  switch (type) {
    case TemplateType.Day:
      return 'Single Day';
    case TemplateType.Week:
      return '5-Day Week';
    case TemplateType.Custom:
      return 'Custom';
    default:
      return 'Unknown';
  }
};

const getLocationTypeLabel = (type: WorkLocationType): string => {
  switch (type) {
    case WorkLocationType.Remote:
      return 'Remote';
    case WorkLocationType.RemotePlus:
      return 'Remote+';
    case WorkLocationType.ClientSite:
      return 'Client Site';
    case WorkLocationType.OfficeNoReservation:
      return 'Office (No Reservation)';
    case WorkLocationType.OfficeWithReservation:
      return 'Office (With Reservation)';
    case WorkLocationType.PTO:
      return 'PTO';
    default:
      return 'Unknown';
  }
};

const getLocationTypeColor = (type: WorkLocationType): string => {
  switch (type) {
    case WorkLocationType.Remote:
      return 'bg-blue-100 text-blue-800';
    case WorkLocationType.RemotePlus:
      return 'bg-purple-100 text-purple-800';
    case WorkLocationType.ClientSite:
      return 'bg-green-100 text-green-800';
    case WorkLocationType.OfficeNoReservation:
      return 'bg-yellow-100 text-yellow-800';
    case WorkLocationType.OfficeWithReservation:
      return 'bg-orange-100 text-orange-800';
    case WorkLocationType.PTO:
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onApply,
  isOwner,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            {template.isShared && (
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                Shared
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{getTemplateTypeLabel(template.type)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onApply(template)}
            className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => onEdit(template)}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(template.id)}
                className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Schedule Preview
        </h4>
        <div className="space-y-1">
          {template.items
            .sort((a, b) => a.dayOffset - b.dayOffset)
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm py-1.5 px-2 bg-gray-50 rounded"
              >
                <span className="text-gray-600">
                  {item.dayOfWeek !== null && item.dayOfWeek !== undefined ? (
                    <>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                        item.dayOfWeek
                      ]}
                    </>
                  ) : (
                    <>Day {item.dayOffset + 1}</>
                  )}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${getLocationTypeColor(
                    item.locationType
                  )}`}
                >
                  {getLocationTypeLabel(item.locationType)}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Created {new Date(template.createdAt).toLocaleDateString()}
          {template.updatedAt && (
            <> · Updated {new Date(template.updatedAt).toLocaleDateString()}</>
          )}
        </p>
      </div>
    </div>
  );
};
