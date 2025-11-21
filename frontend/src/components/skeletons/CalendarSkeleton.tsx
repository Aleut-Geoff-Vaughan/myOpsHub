/**
 * Loading skeleton for calendar view
 * Displays animated placeholder while data is loading
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading calendar">
      {/* Week 1 */}
      <div>
        <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
        <div className="grid grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((day) => (
            <div
              key={`week1-${day}`}
              className="p-4 rounded-lg border-2 border-gray-200 bg-white animate-pulse"
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className="h-3 w-12 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-6 w-8 bg-gray-200 rounded mx-auto"></div>
              </div>

              {/* Icon placeholder */}
              <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto mb-2"></div>

              {/* Label placeholder */}
              <div className="h-3 w-20 bg-gray-200 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Week 2 */}
      <div>
        <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
        <div className="grid grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((day) => (
            <div
              key={`week2-${day}`}
              className="p-4 rounded-lg border-2 border-gray-200 bg-white animate-pulse"
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className="h-3 w-12 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-6 w-8 bg-gray-200 rounded mx-auto"></div>
              </div>

              {/* Icon placeholder */}
              <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto mb-2"></div>

              {/* Label placeholder */}
              <div className="h-3 w-20 bg-gray-200 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={`legend-${i}`} className="h-3 w-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading calendar data...</span>
    </div>
  );
}

/**
 * Loading skeleton for dashboard stats cards
 */
export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-12 bg-gray-200 rounded"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
