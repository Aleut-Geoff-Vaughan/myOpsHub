interface ViewSelectorProps {
  selectedView: 'current-week' | 'two-weeks' | 'month';
  onViewChange: (view: 'current-week' | 'two-weeks' | 'month') => void;
}

export function ViewSelector({ selectedView, onViewChange }: ViewSelectorProps) {
  const views = [
    { id: 'current-week' as const, label: 'Current Week', icon: '📅' },
    { id: 'two-weeks' as const, label: 'This and Next Week', icon: '📆' },
    { id: 'month' as const, label: 'Month View', icon: '🗓️' },
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium
            ${
              selectedView === view.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-sm hover:bg-gray-50'
            }
          `}
        >
          <span className="text-lg">{view.icon}</span>
          <span className="font-medium text-sm">{view.label}</span>
        </button>
      ))}
    </div>
  );
}
