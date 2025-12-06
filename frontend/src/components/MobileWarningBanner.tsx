import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface MobileWarningBannerProps {
  pageName?: string;
}

export function MobileWarningBanner({ pageName = 'This page' }: MobileWarningBannerProps) {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(false);

  if (!isMobile || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              <strong>Desktop Recommended:</strong> {pageName} is optimized for desktop use.
              Some features may be limited on smaller screens.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-amber-500 hover:text-amber-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileWarningBanner;
