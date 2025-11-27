import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTemplates, useApplyTemplate } from '../hooks/useTemplates';
import type { WorkLocationTemplate } from '../types/template';
import { TemplateType } from '../types/template';
import { WorkLocationType } from '../types/api';

interface ApplyTemplateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getLocationTypeLabel = (type: WorkLocationType): string => {
  switch (type) {
    case WorkLocationType.Remote:
      return 'Remote';
    case WorkLocationType.RemotePlus:
      return 'Remote+';
    case WorkLocationType.ClientSite:
      return 'Client Site';
    case WorkLocationType.OfficeNoReservation:
      return 'Office';
    case WorkLocationType.OfficeWithReservation:
      return 'Office (Reserved)';
    case WorkLocationType.PTO:
      return 'PTO';
    case WorkLocationType.Travel:
      return 'Travel';
    default:
      return 'Unknown';
  }
};

const getLocationColor = (type: WorkLocationType): string => {
  switch (type) {
    case WorkLocationType.Remote:
      return 'bg-blue-100 text-blue-800';
    case WorkLocationType.RemotePlus:
      return 'bg-purple-100 text-purple-800';
    case WorkLocationType.ClientSite:
      return 'bg-orange-100 text-orange-800';
    case WorkLocationType.OfficeNoReservation:
    case WorkLocationType.OfficeWithReservation:
      return 'bg-green-100 text-green-800';
    case WorkLocationType.PTO:
      return 'bg-amber-100 text-amber-800';
    case WorkLocationType.Travel:
      return 'bg-cyan-100 text-cyan-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ApplyTemplateSelectModal: React.FC<ApplyTemplateSelectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading } = useTemplates();
  const applyTemplate = useApplyTemplate();

  const [selectedTemplate, setSelectedTemplate] = useState<WorkLocationTemplate | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  });
  const [weekCount, setWeekCount] = useState(1);

  if (!isOpen) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await applyTemplate.mutateAsync({
        id: selectedTemplate.id,
        request: {
          startDate,
          weekCount,
        },
      });

      // Wait for dashboard refetch to complete before closing modal
      await queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      onClose();
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Apply Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a template to apply to your work location calendar
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create templates from the Templates page first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {template.type === TemplateType.Week ? '5-Day Week' :
                             template.type === TemplateType.Day ? 'Single Day' : 'Custom'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.items.length} {template.items.length === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        {/* Preview of schedule */}
                        <div className="flex gap-1 mt-3">
                          {template.items.slice(0, 5).map((item, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded ${getLocationColor(item.locationType)}`}
                              title={getLocationTypeLabel(item.locationType)}
                            >
                              {DAYS_OF_WEEK[idx] || `D${idx + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application form view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to templates
          </button>
          <h2 className="text-xl font-bold text-gray-900">Apply "{selectedTemplate.name}"</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure when to apply this template
          </p>
        </div>

        <form onSubmit={handleApply} className="px-6 py-4 space-y-6">
          {/* Preview of template */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Template Schedule:</p>
            <div className="flex gap-1">
              {selectedTemplate.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center text-xs py-2 px-1 rounded ${getLocationColor(item.locationType)}`}
                >
                  <div className="font-medium">{DAYS_OF_WEEK[idx] || `D${idx + 1}`}</div>
                  <div className="text-[10px] mt-0.5 truncate">
                    {getLocationTypeLabel(item.locationType)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Monday) *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The template will be applied starting from this Monday
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Weeks *
            </label>
            <input
              type="number"
              value={weekCount}
              onChange={(e) => setWeekCount(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Apply across multiple consecutive weeks (max 12)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This will create or update <strong>{selectedTemplate.items.length * weekCount}</strong> work location{' '}
              {selectedTemplate.items.length * weekCount === 1 ? 'entry' : 'entries'} starting from{' '}
              <strong>
                {new Date(startDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </strong>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyTemplate.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {applyTemplate.isPending ? 'Applying...' : 'Apply Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
