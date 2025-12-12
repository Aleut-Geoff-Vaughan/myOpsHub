import { HelpCircle } from 'lucide-react';
import { useHelpContext } from '../../contexts/HelpContext';

interface HelpButtonProps {
  className?: string;
}

export function HelpButton({ className = '' }: HelpButtonProps) {
  const { toggleHelpPanel, articles, isLoading } = useHelpContext();

  const hasArticles = articles.length > 0;

  return (
    <button
      onClick={toggleHelpPanel}
      className={`relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      title="Help"
      aria-label="Open help panel"
    >
      <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      {!isLoading && hasArticles && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </button>
  );
}
