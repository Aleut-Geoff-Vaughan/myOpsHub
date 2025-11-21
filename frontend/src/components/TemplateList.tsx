import React, { useState } from 'react';
import { useTemplates, useDeleteTemplate } from '../hooks/useTemplates';
import { TemplateCard } from './TemplateCard';
import { TemplateEditor } from './TemplateEditor';
import { TemplateApplyModal } from './TemplateApplyModal';
import type { WorkLocationTemplate } from '../types/template';
import { useAuthStore } from '../stores/authStore';

export const TemplateList: React.FC = () => {
  const { data: templates, isLoading, error } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const currentUser = useAuthStore((state) => state.user);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkLocationTemplate | undefined>();
  const [applyingTemplate, setApplyingTemplate] = useState<WorkLocationTemplate | undefined>();

  const handleCreateNew = () => {
    setEditingTemplate(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: WorkLocationTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteTemplate.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleApply = (template: WorkLocationTemplate) => {
    setApplyingTemplate(template);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingTemplate(undefined);
  };

  const handleApplyClose = () => {
    setApplyingTemplate(undefined);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load templates. Please try again.</p>
        </div>
      </div>
    );
  }

  const myTemplates = templates?.filter((t) => t.userId === currentUser?.id) || [];
  const sharedTemplates = templates?.filter((t) => t.userId !== currentUser?.id && t.isShared) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Location Templates</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage reusable work location schedules
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Create Template
        </button>
      </div>

      {myTemplates.length === 0 && sharedTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first work location template.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Template
            </button>
          </div>
        </div>
      ) : (
        <>
          {myTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onApply={handleApply}
                    isOwner={true}
                  />
                ))}
              </div>
            </div>
          )}

          {sharedTemplates.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shared Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onApply={handleApply}
                    isOwner={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isEditorOpen && (
        <TemplateEditor template={editingTemplate} onClose={handleEditorClose} />
      )}

      {applyingTemplate && (
        <TemplateApplyModal template={applyingTemplate} onClose={handleApplyClose} />
      )}
    </div>
  );
};
