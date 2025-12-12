import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppTiles, useCreateUserTile, useDeleteTile } from '../hooks/useAppTiles';
import { useAuthStore } from '../stores/authStore';
import type { AppTile, CreateAppTileRequest } from '../types/appTile';

// Icon mapping for built-in icons
const iconMap: Record<string, React.ReactNode> = {
  briefcase: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  'chart-line': (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  'building-office': (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  link: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  globe: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  document: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  plus: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
};

interface AddTileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tile: CreateAppTileRequest) => void;
  isLoading?: boolean;
}

function AddTileModal({ isOpen, onClose, onSubmit, isLoading }: AddTileModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      url,
      backgroundColor,
      openInNewTab,
      icon: 'link',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold mb-4">Add Personal App</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tile Color</label>
                <div className="flex gap-2">
                  {['#2563eb', '#059669', '#0d9488', '#7c3aed', '#dc2626', '#ea580c', '#6366f1'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        backgroundColor === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openInNewTab"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="openInNewTab" className="text-sm text-gray-700">
                  Open in new tab
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add App'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface TileCardProps {
  tile: AppTile;
  onDelete?: () => void;
}

function TileCard({ tile, onDelete }: TileCardProps) {
  const isExternal = tile.url.startsWith('http');
  const [showMenu, setShowMenu] = useState(false);

  const tileContent = (
    <div
      className="relative group rounded-xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
      style={{ backgroundColor: tile.backgroundColor, color: tile.textColor }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-3">{iconMap[tile.icon] || iconMap.link}</div>
        <h3 className="text-lg font-semibold mb-1">{tile.name}</h3>
        {tile.description && <p className="text-sm opacity-80 line-clamp-2">{tile.description}</p>}
      </div>
      {tile.isUserTile && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      )}
      {showMenu && (
        <div className="absolute top-8 right-2 bg-white text-gray-800 rounded-md shadow-lg py-1 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.();
              setShowMenu(false);
            }}
            className="px-4 py-2 hover:bg-gray-100 w-full text-left text-sm text-red-600"
          >
            Remove
          </button>
        </div>
      )}
      {tile.openInNewTab && isExternal && (
        <div className="absolute top-2 left-2 opacity-60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      )}
    </div>
  );

  if (isExternal) {
    return (
      <a href={tile.url} target={tile.openInNewTab ? '_blank' : '_self'} rel="noopener noreferrer">
        {tileContent}
      </a>
    );
  }

  return <Link to={tile.url}>{tileContent}</Link>;
}

export default function AppLauncherPage() {
  const { data: tiles, isLoading } = useAppTiles();
  const createUserTile = useCreateUserTile();
  const deleteTile = useDeleteTile();
  const user = useAuthStore((state) => state.user);
  const [showAddModal, setShowAddModal] = useState(false);

  // Group tiles by category
  const groupedTiles = useMemo(() => {
    if (!tiles) return {};
    const groups: Record<string, AppTile[]> = {};
    tiles.forEach((tile) => {
      const category = tile.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(tile);
    });
    return groups;
  }, [tiles]);

  const handleAddTile = async (request: CreateAppTileRequest) => {
    await createUserTile.mutateAsync(request);
    setShowAddModal(false);
  };

  const handleDeleteTile = async (id: string) => {
    if (confirm('Are you sure you want to remove this app?')) {
      await deleteTile.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray-600">Select an application to get started</p>
        </div>

        {/* Tile Groups */}
        {Object.entries(groupedTiles).map(([category, categoryTiles]) => (
          <div key={category} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryTiles.map((tile) => (
                <TileCard
                  key={tile.id}
                  tile={tile}
                  onDelete={tile.isUserTile ? () => handleDeleteTile(tile.id) : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Add Personal App Button */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add Your Own</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 hover:bg-gray-50 transition-all w-full sm:w-auto sm:min-w-[200px] flex flex-col items-center text-center text-gray-500 hover:text-gray-700"
          >
            <div className="mb-3">{iconMap.plus}</div>
            <span className="font-medium">Add Personal App</span>
          </button>
        </div>

        {/* Feedback Link */}
        <div className="mt-12 text-center">
          <Link
            to="/feedback"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Submit Feedback or Report an Issue
          </Link>
        </div>
      </div>

      <AddTileModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTile}
        isLoading={createUserTile.isPending}
      />
    </div>
  );
}
