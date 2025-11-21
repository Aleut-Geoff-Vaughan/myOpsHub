import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApplyTemplate } from '../hooks/useTemplates';
import type { WorkLocationTemplate } from '../types/template';

interface TemplateApplyModalProps {
  template: WorkLocationTemplate;
  onClose: () => void;
}

export const TemplateApplyModal: React.FC<TemplateApplyModalProps> = ({ template, onClose }) => {
  const queryClient = useQueryClient();
  const applyTemplate = useApplyTemplate();
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  });
  const [weekCount, setWeekCount] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await applyTemplate.mutateAsync({
        id: template.id,
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

  const getPreviewDates = () => {
    const start = new Date(startDate);
    const dates: string[] = [];

    for (let week = 0; week < weekCount; week++) {
      for (let day = 0; day < template.items.length; day++) {
        const date = new Date(start);
        date.setDate(start.getDate() + week * 7 + day);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }

    return dates;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Apply Template</h2>
          <p className="text-sm text-gray-600 mt-1">
            Apply "{template.name}" to your work location calendar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
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
              Apply this template across multiple consecutive weeks (max 12)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Preview</h3>
            <p className="text-sm text-blue-800">
              This will create or update {template.items.length * weekCount} work location{' '}
              {template.items.length * weekCount === 1 ? 'entry' : 'entries'} starting from{' '}
              {new Date(startDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              .
            </p>
            {weekCount <= 2 && (
              <div className="mt-2">
                <p className="text-xs text-blue-700 font-medium mb-1">Dates affected:</p>
                <p className="text-xs text-blue-700">{getPreviewDates().join(', ')}</p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Note:</span> Existing work location preferences for these
              dates will be updated with the template values.
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
