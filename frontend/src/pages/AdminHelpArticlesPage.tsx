import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, PlayCircle, BookOpen, Search, X, Loader2 } from 'lucide-react';
import { useHelpArticlesAdmin, useCreateHelpArticle, useUpdateHelpArticle, useDeleteHelpArticle } from '../hooks/useHelp';
import { helpModules } from '../config/helpContextKeys';
import type { HelpArticle, CreateHelpArticleRequest, UpdateHelpArticleRequest } from '../types/help';
import toast from 'react-hot-toast';

export function AdminHelpArticlesPage() {
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);

  const { data: articles = [], isLoading } = useHelpArticlesAdmin(includeDeleted);
  const createMutation = useCreateHelpArticle();
  const updateMutation = useUpdateHelpArticle();
  const deleteMutation = useDeleteHelpArticle();

  // Filter articles based on search and module
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.contextKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = !selectedModule || article.moduleName === selectedModule;

    return matchesSearch && matchesModule;
  });

  // Group articles by module
  const groupedArticles = filteredArticles.reduce(
    (acc, article) => {
      const module = article.moduleName || 'general';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(article);
      return acc;
    },
    {} as Record<string, HelpArticle[]>
  );

  const handleCreate = () => {
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (article: HelpArticle) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this help article?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Help article deleted');
    } catch {
      toast.error('Failed to delete help article');
    }
  };

  const handleSave = async (data: CreateHelpArticleRequest | UpdateHelpArticleRequest) => {
    try {
      if (editingArticle) {
        await updateMutation.mutateAsync({ id: editingArticle.id, request: data as UpdateHelpArticleRequest });
        toast.success('Help article updated');
      } else {
        await createMutation.mutateAsync(data as CreateHelpArticleRequest);
        toast.success('Help article created');
      }
      setIsModalOpen(false);
      setEditingArticle(null);
    } catch {
      toast.error(editingArticle ? 'Failed to update help article' : 'Failed to create help article');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage context-sensitive help content, JIRA links, and video tutorials
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Modules</option>
            {helpModules.map((module) => (
              <option key={module.key} value={module.key}>
                {module.label}
              </option>
            ))}
          </select>

          {/* Include Deleted */}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Show deleted</span>
          </label>
        </div>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No help articles found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery || selectedModule ? 'Try adjusting your filters' : 'Get started by creating your first help article'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedArticles).map(([module, moduleArticles]) => (
            <div key={module} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">
                  {helpModules.find((m) => m.key === module)?.label || module}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {moduleArticles.map((article) => (
                  <div
                    key={article.id}
                    className={`p-4 ${article.isDeleted ? 'bg-red-50 opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{article.title}</h3>
                          {article.isSystemWide && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                              System
                            </span>
                          )}
                          {!article.isActive && (
                            <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                              Inactive
                            </span>
                          )}
                          {article.isDeleted && (
                            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              Deleted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          Context: <code className="px-1 py-0.5 bg-gray-100 rounded">{article.contextKey}</code>
                        </p>
                        {article.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{article.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {article.jiraArticleUrl && (
                            <a
                              href={article.jiraArticleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <BookOpen className="w-3 h-3" />
                              JIRA Article
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {article.videoUrl && (
                            <a
                              href={article.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <PlayCircle className="w-3 h-3" />
                              {article.videoTitle || 'Video'}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(article)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!article.isDeleted && (
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <HelpArticleModal
          article={editingArticle}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingArticle(null);
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface HelpArticleModalProps {
  article: HelpArticle | null;
  onSave: (data: CreateHelpArticleRequest | UpdateHelpArticleRequest) => void;
  onClose: () => void;
  isSaving: boolean;
}

function HelpArticleModal({ article, onSave, onClose, isSaving }: HelpArticleModalProps) {
  const [formData, setFormData] = useState({
    contextKey: article?.contextKey || '',
    title: article?.title || '',
    description: article?.description || '',
    jiraArticleUrl: article?.jiraArticleUrl || '',
    videoUrl: article?.videoUrl || '',
    videoTitle: article?.videoTitle || '',
    content: article?.content || '',
    sortOrder: article?.sortOrder || 0,
    moduleName: article?.moduleName || 'general',
    tags: article?.tags || '',
    iconName: article?.iconName || '',
    isSystemWide: article?.isSystemWide || false,
    isActive: article?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {article ? 'Edit Help Article' : 'Create Help Article'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Context Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context Key *</label>
            <input
              type="text"
              value={formData.contextKey}
              onChange={(e) => setFormData({ ...formData, contextKey: e.target.value })}
              required
              placeholder="e.g., work.staffing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to match help articles to specific pages (e.g., work.staffing, forecast.projects)
            </p>
          </div>

          {/* Module */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              value={formData.moduleName}
              onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {helpModules.map((module) => (
                <option key={module.key} value={module.key}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* JIRA Article URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">JIRA Knowledge Base URL</label>
            <input
              type="url"
              value={formData.jiraArticleUrl}
              onChange={(e) => setFormData({ ...formData, jiraArticleUrl: e.target.value })}
              placeholder="https://yourcompany.atlassian.net/wiki/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Video URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://www.loom.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
              <input
                type="text"
                value={formData.videoTitle}
                onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                placeholder="Getting Started Tutorial"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inline Content (HTML/Markdown)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="staffing, schedule, tutorial"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated tags for search</p>
          </div>

          {/* Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon Name</label>
              <input
                type="text"
                value={formData.iconName}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                placeholder="file-text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSystemWide}
                onChange={(e) => setFormData({ ...formData, isSystemWide: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">System-wide (all tenants)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {article ? 'Update' : 'Create'} Article
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminHelpArticlesPage;
