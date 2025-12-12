import { ExternalLink, PlayCircle, FileText, BookOpen } from 'lucide-react';
import type { HelpArticle } from '../../types/help';
import DOMPurify from 'dompurify';

interface HelpArticleCardProps {
  article: HelpArticle;
  onClick?: () => void;
  showContent?: boolean;
}

export function HelpArticleCard({ article, onClick, showContent = false }: HelpArticleCardProps) {
  const hasExternalLinks = article.jiraArticleUrl || article.videoUrl;

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
        onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
          {article.videoUrl ? (
            <PlayCircle className="w-5 h-5" />
          ) : article.jiraArticleUrl ? (
            <BookOpen className="w-5 h-5" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{article.title}</h3>

          {article.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {article.description}
            </p>
          )}

          {showContent && article.content && (
            <div
              className="mt-3 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />
          )}

          {hasExternalLinks && (
            <div className="flex items-center gap-4 mt-3">
              {article.jiraArticleUrl && (
                <a
                  href={article.jiraArticleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BookOpen className="w-4 h-4" />
                  Knowledge Base
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {article.videoUrl && (
                <a
                  href={article.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PlayCircle className="w-4 h-4" />
                  {article.videoTitle || 'Watch Video'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {article.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {article.tags.split(',').map((tag) => (
                <span
                  key={tag.trim()}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
