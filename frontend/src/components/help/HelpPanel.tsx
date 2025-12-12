import { useEffect, useRef } from 'react';
import { X, Search, ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { useHelpContext } from '../../contexts/HelpContext';
import { useHelpSearch } from '../../hooks/useHelp';
import { HelpArticleCard } from './HelpArticleCard';
import { helpModules } from '../../config/helpContextKeys';

export function HelpPanel() {
  const {
    isHelpPanelOpen,
    closeHelpPanel,
    articles,
    isLoading,
    contextKey,
    moduleName,
    selectedArticle,
    selectArticle,
    searchQuery,
    setSearchQuery,
  } = useHelpContext();

  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search results
  const { data: searchResults = [], isLoading: isSearching } = useHelpSearch(searchQuery);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHelpPanelOpen) {
        closeHelpPanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHelpPanelOpen, closeHelpPanel]);

  // Focus search input when panel opens
  useEffect(() => {
    if (isHelpPanelOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isHelpPanelOpen]);

  // Get module label
  const moduleLabel = helpModules.find((m) => m.key === moduleName)?.label || moduleName;

  if (!isHelpPanelOpen) {
    return null;
  }

  const displayedArticles = searchQuery.length >= 2 ? searchResults : articles;
  const showLoading = isLoading || isSearching;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeHelpPanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Help panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {selectedArticle && (
              <button
                onClick={() => selectArticle(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                aria-label="Back to list"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Help</h2>
            </div>
          </div>
          <button
            onClick={closeHelpPanel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            aria-label="Close help panel"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Search */}
        {!selectedArticle && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {!searchQuery && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Showing help for: <span className="font-medium">{moduleLabel}</span>
                {contextKey !== moduleName && (
                  <span className="ml-1">({contextKey})</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedArticle ? (
            // Article detail view
            <div className="p-4">
              <HelpArticleCard article={selectedArticle} showContent />
            </div>
          ) : showLoading ? (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : displayedArticles.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {searchQuery ? 'No results found' : 'No help articles available'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Help articles for this section will appear here when available.'}
              </p>
            </div>
          ) : (
            // Article list
            <div className="p-4 space-y-3">
              {displayedArticles.map((article) => (
                <HelpArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => selectArticle(article)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
          Need more help?{' '}
          <a
            href="mailto:support@myscheduling.com"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </>
  );
}
