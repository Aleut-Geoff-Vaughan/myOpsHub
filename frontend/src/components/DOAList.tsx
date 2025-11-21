import { useState } from 'react';
import { useDOALetters } from '../hooks/useDOA';
import { DOACard } from './DOACard';
import { DOAEditor } from './DOAEditor';
import { DOAViewer } from './DOAViewer';
import type { DOAFilter } from '../types/doa';
import { useAuthStore } from '../stores/authStore';

export function DOAList() {
  const [filter, setFilter] = useState<DOAFilter>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDOAId, setSelectedDOAId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { user } = useAuthStore();
  const { data: doaLetters, isLoading, error } = useDOALetters(filter);

  // When showing 'all', separate by created vs assigned for UI organization
  const createdLetters = filter === 'all'
    ? doaLetters?.filter((doa) => doa.delegatorUserId === user?.id)
    : null;
  const assignedLetters = filter === 'all'
    ? doaLetters?.filter((doa) => doa.designeeUserId === user?.id)
    : null;

  const handleCreateNew = () => {
    setSelectedDOAId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedDOAId(id);
    setIsEditorOpen(true);
  };

  const handleView = (id: string) => {
    setSelectedDOAId(id);
    setIsViewerOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedDOAId(null);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDOAId(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h3 className="text-red-800 font-medium">Error Loading DOA Letters</h3>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Delegation of Authority Letters
          </h1>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New DOA Letter
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Letters
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'created'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            I Created
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'assigned'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assigned to Me
          </button>
        </div>
      </div>

      {/* DOA Letters Grid */}
      {filter === 'all' && (
        <>
          {/* Created Letters */}
          {createdLetters && createdLetters.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Letters I Created
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {createdLetters.map((doa) => (
                  <DOACard
                    key={doa.id}
                    doa={doa}
                    onView={handleView}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assigned Letters */}
          {assignedLetters && assignedLetters.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Letters Assigned to Me
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {assignedLetters.map((doa) => (
                  <DOACard
                    key={doa.id}
                    doa={doa}
                    onView={handleView}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!createdLetters || createdLetters.length === 0) &&
            (!assignedLetters || assignedLetters.length === 0) && (
              <div className="text-center py-12">
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No DOA Letters
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new delegation of authority letter.
                </p>
              </div>
            )}
        </>
      )}

      {filter === 'created' && (
        <>
          {doaLetters && doaLetters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {doaLetters.map((doa) => (
                <DOACard
                  key={doa.id}
                  doa={doa}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No DOA letters created by you.</p>
            </div>
          )}
        </>
      )}

      {filter === 'assigned' && (
        <>
          {doaLetters && doaLetters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {doaLetters.map((doa) => (
                <DOACard
                  key={doa.id}
                  doa={doa}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No DOA letters assigned to you.</p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {isEditorOpen && (
        <DOAEditor doaId={selectedDOAId} onClose={handleCloseEditor} />
      )}

      {isViewerOpen && selectedDOAId && (
        <DOAViewer doaId={selectedDOAId} onClose={handleCloseViewer} />
      )}
    </div>
  );
}
