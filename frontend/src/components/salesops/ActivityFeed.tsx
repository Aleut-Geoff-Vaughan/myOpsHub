import { useState } from 'react';
import {
  MessageSquare,
  History,
  Phone,
  Mail,
  Calendar,
  User,
  Send,
  Loader2,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  useOpportunityActivityFeed,
  useOpportunityNotes,
  useAddOpportunityNote,
  useUpdateOpportunityNote,
  useDeleteOpportunityNote,
} from '../../hooks/useSalesOps';
import type { OpportunityNote, ActivityFeedItem } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

const NOTE_TYPES = [
  { value: 'General', label: 'General Note', icon: MessageSquare },
  { value: 'Call', label: 'Phone Call', icon: Phone },
  { value: 'Email', label: 'Email', icon: Mail },
  { value: 'Meeting', label: 'Meeting', icon: Calendar },
];

function getActivityIcon(type: string, subtype?: string) {
  if (type === 'field_change') {
    return <History className="h-4 w-4 text-gray-400" />;
  }
  const noteType = NOTE_TYPES.find((t) => t.value === subtype);
  if (noteType) {
    const Icon = noteType.icon;
    return <Icon className="h-4 w-4 text-blue-500" />;
  }
  return <MessageSquare className="h-4 w-4 text-blue-500" />;
}

interface ActivityItemProps {
  item: ActivityFeedItem;
  opportunityId: string;
  onEdit?: (note: OpportunityNote) => void;
  onDelete?: (noteId: string) => void;
}

function ActivityItem({ item, onEdit, onDelete }: ActivityItemProps) {
  const isNote = item.type === 'note';

  return (
    <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg group">
      <div className="flex-shrink-0 mt-1">{getActivityIcon(item.type, item.subtype)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {isNote ? (
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.content}</p>
            ) : (
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">{item.subtype}</span>{' '}
                changed from{' '}
                <span className="text-gray-500 italic">
                  {item.oldValue || '(empty)'}
                </span>{' '}
                to{' '}
                <span className="text-gray-900 font-medium">
                  {item.newValue || '(empty)'}
                </span>
              </p>
            )}
          </div>
          {isNote && onEdit && onDelete && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={() =>
                  onEdit({
                    id: item.id,
                    content: item.content,
                    noteType: item.subtype,
                    createdAt: item.timestamp,
                    createdByUserId: item.userId,
                    createdByUserName: item.userName,
                  })
                }
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edit note"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <User className="h-3 w-3" />
          <span>{item.userName || 'Unknown'}</span>
          <span>•</span>
          <span title={format(new Date(item.timestamp), 'PPpp')}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </span>
          {isNote && item.subtype && (
            <>
              <span>•</span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                {item.subtype}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface NoteEditorProps {
  opportunityId: string;
  editingNote?: OpportunityNote | null;
  onCancelEdit?: () => void;
}

function NoteEditor({ opportunityId, editingNote, onCancelEdit }: NoteEditorProps) {
  const [content, setContent] = useState(editingNote?.content || '');
  const [noteType, setNoteType] = useState(editingNote?.noteType || 'General');

  const addNoteMutation = useAddOpportunityNote();
  const updateNoteMutation = useUpdateOpportunityNote();

  const isEditing = !!editingNote;
  const isPending = addNoteMutation.isPending || updateNoteMutation.isPending;

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      if (isEditing && editingNote) {
        await updateNoteMutation.mutateAsync({
          opportunityId,
          noteId: editingNote.id,
          data: { content: content.trim(), noteType },
        });
        toast.success('Note updated');
        onCancelEdit?.();
      } else {
        await addNoteMutation.mutateAsync({
          opportunityId,
          data: { content: content.trim(), noteType },
        });
        toast.success('Note added');
        setContent('');
        setNoteType('General');
      }
    } catch {
      toast.error('Failed to save note');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <label htmlFor="note-type" className="sr-only">
            Note Type
          </label>
          <select
            id="note-type"
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            {NOTE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isEditing ? 'Update' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  opportunityId: string;
  showNotes?: boolean;
  showHistory?: boolean;
  maxItems?: number;
}

export function ActivityFeed({
  opportunityId,
  showNotes = true,
  showHistory = true,
  maxItems = 50,
}: ActivityFeedProps) {
  const [editingNote, setEditingNote] = useState<OpportunityNote | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'notes' | 'history'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: activity, isLoading: activityLoading } = useOpportunityActivityFeed(
    opportunityId,
    maxItems
  );
  const { data: notes } = useOpportunityNotes(opportunityId);
  const deleteNoteMutation = useDeleteOpportunityNote();

  const handleDeleteNote = async (noteId: string) => {
    if (confirmDelete !== noteId) {
      setConfirmDelete(noteId);
      return;
    }

    try {
      await deleteNoteMutation.mutateAsync({ opportunityId, noteId });
      toast.success('Note deleted');
      setConfirmDelete(null);
    } catch {
      toast.error('Failed to delete note');
    }
  };

  // Filter activity based on view mode
  const filteredActivity =
    activity?.filter((item) => {
      if (viewMode === 'all') return true;
      if (viewMode === 'notes') return item.type === 'note';
      if (viewMode === 'history') return item.type === 'field_change';
      return true;
    }) || [];

  if (activityLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Note Editor */}
      {showNotes && (
        <NoteEditor
          opportunityId={opportunityId}
          editingNote={editingNote}
          onCancelEdit={() => setEditingNote(null)}
        />
      )}

      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setViewMode('all')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'all'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Activity
        </button>
        {showNotes && (
          <button
            onClick={() => setViewMode('notes')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'notes'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes ({notes?.length || 0})
          </button>
        )}
        {showHistory && (
          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'history'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {filteredActivity.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          filteredActivity.map((item) => (
            <div key={item.id}>
              <ActivityItem
                item={item}
                opportunityId={opportunityId}
                onEdit={(note) => setEditingNote(note)}
                onDelete={handleDeleteNote}
              />
              {confirmDelete === item.id && (
                <div className="px-3 pb-3 flex items-center gap-2 text-sm">
                  <span className="text-red-600">Delete this note?</span>
                  <button
                    onClick={() => handleDeleteNote(item.id)}
                    disabled={deleteNoteMutation.isPending}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    {deleteNoteMutation.isPending ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
