import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, CardBody } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { facilitiesAdminService } from '../../services/facilitiesAdminService';
import { officesService } from '../../services/officesService';
import { facilitiesService } from '../../services/facilitiesService';
import { SpaceModal } from '../../components/SpaceModal';
import toast from 'react-hot-toast';
import type { Floor, Zone, Space, Office } from '../../types/api';
import { SpaceType } from '../../types/api';

type TabType = 'overview' | 'spaces' | 'import-export' | 'floors' | 'zones';

export function FacilitiesAdminPage() {
  const { currentWorkspace } = useAuthStore();
  const tenantId = currentWorkspace?.tenantId || '';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');

  // Fetch data
  const { data: offices = [], isLoading: loadingOffices } = useQuery({
    queryKey: ['offices', tenantId],
    queryFn: () => officesService.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: spaces = [], isLoading: loadingSpaces } = useQuery({
    queryKey: ['facilities-spaces', tenantId, selectedOfficeId],
    queryFn: () => facilitiesService.getSpaces(selectedOfficeId ? { officeId: selectedOfficeId } : undefined),
    enabled: !!tenantId,
  });

  const { data: floors = [], isLoading: loadingFloors } = useQuery({
    queryKey: ['facilities-floors', tenantId, selectedOfficeId],
    queryFn: () => facilitiesAdminService.getFloors(tenantId, selectedOfficeId || undefined),
    enabled: !!tenantId,
  });

  const { data: zones = [], isLoading: loadingZones } = useQuery({
    queryKey: ['facilities-zones', tenantId, selectedOfficeId],
    queryFn: () => facilitiesAdminService.getZones(tenantId, undefined, selectedOfficeId || undefined),
    enabled: !!tenantId,
  });

  const isLoading = loadingOffices || loadingSpaces || loadingFloors || loadingZones;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'spaces' as TabType, label: 'Spaces', icon: '🪑' },
    { id: 'import-export' as TabType, label: 'Import/Export', icon: '📁' },
    { id: 'floors' as TabType, label: 'Floors', icon: '🏢' },
    { id: 'zones' as TabType, label: 'Zones', icon: '📍' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facilities Administration</h1>
          <p className="text-gray-600 mt-1">Manage offices, spaces, floors, zones, and bulk data operations</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Office:</label>
          <select
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Offices</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              offices={offices}
              spaces={spaces}
              floors={floors}
              zones={zones}
              selectedOfficeId={selectedOfficeId}
            />
          )}
          {activeTab === 'spaces' && (
            <SpacesTab
              spaces={spaces}
              offices={offices}
              selectedOfficeId={selectedOfficeId}
            />
          )}
          {activeTab === 'import-export' && (
            <ImportExportTab tenantId={tenantId} selectedOfficeId={selectedOfficeId} queryClient={queryClient} />
          )}
          {activeTab === 'floors' && (
            <FloorsTab
              floors={floors}
              offices={offices}
              tenantId={tenantId}
            />
          )}
          {activeTab === 'zones' && (
            <ZonesTab
              zones={zones}
              floors={floors}
              tenantId={tenantId}
            />
          )}
        </>
      )}
    </div>
  );
}

// ==================== OVERVIEW TAB ====================

function OverviewTab({
  offices,
  spaces,
  floors,
  zones,
  selectedOfficeId,
}: {
  offices: Office[];
  spaces: Space[];
  floors: Floor[];
  zones: Zone[];
  selectedOfficeId: string;
}) {
  const filteredOffices = selectedOfficeId ? offices.filter(o => o.id === selectedOfficeId) : offices;
  const filteredSpaces = selectedOfficeId ? spaces.filter(s => s.officeId === selectedOfficeId) : spaces;

  const stats = [
    { label: 'Total Offices', value: filteredOffices.length, icon: '🏢', color: 'bg-teal-50 text-teal-700' },
    { label: 'Total Spaces', value: filteredSpaces.length, icon: '🪑', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Floors', value: floors.length, icon: '📊', color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Zones', value: zones.length, icon: '📍', color: 'bg-orange-50 text-orange-700' },
    { label: 'Active Spaces', value: filteredSpaces.filter(s => s.isActive).length, icon: '✅', color: 'bg-green-50 text-green-700' },
    { label: 'Inactive Spaces', value: filteredSpaces.filter(s => !s.isActive).length, icon: '⏸️', color: 'bg-gray-50 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} padding="sm">
            <div className={`text-center p-2 rounded-lg ${stat.color}`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Offices Summary */}
      <Card padding="none">
        <CardHeader title="Offices Summary" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spaces</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffices.map((office) => {
                  const officeSpaces = spaces.filter(s => s.officeId === office.id);
                  const officeFloors = floors.filter(f => f.officeId === office.id);
                  return (
                    <tr key={office.id}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        <Link
                          to={`/facilities/admin/offices/${office.id}`}
                          className="text-teal-600 hover:text-teal-800 hover:underline"
                        >
                          {office.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {office.city && office.stateCode ? `${office.city}, ${office.stateCode}` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{officeSpaces.length}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{officeFloors.length}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          office.status === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {office.status === 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/facilities/admin/offices/${office.id}`}
                          className="text-teal-600 hover:text-teal-800 text-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ==================== SPACES TAB ====================

const SPACE_TYPE_LABELS: Record<number, string> = {
  [SpaceType.Desk]: 'Desk',
  [SpaceType.HotDesk]: 'Hot Desk',
  [SpaceType.Office]: 'Private Office',
  [SpaceType.Cubicle]: 'Cubicle',
  [SpaceType.Room]: 'Room',
  [SpaceType.ConferenceRoom]: 'Conference Room',
  [SpaceType.HuddleRoom]: 'Huddle Room',
  [SpaceType.PhoneBooth]: 'Phone Booth',
  [SpaceType.TrainingRoom]: 'Training Room',
  [SpaceType.BreakRoom]: 'Break Room',
  [SpaceType.ParkingSpot]: 'Parking Spot',
};

function SpacesTab({
  spaces,
  offices,
  selectedOfficeId,
}: {
  spaces: Space[];
  offices: Office[];
  selectedOfficeId: string;
}) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facilitiesService.deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-spaces'] });
      toast.success('Space deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete space');
    },
  });

  const getOfficeName = (officeId: string) => {
    const office = offices.find(o => o.id === officeId);
    return office?.name || 'Unknown';
  };

  const filteredSpaces = spaces.filter(s => {
    if (selectedOfficeId && s.officeId !== selectedOfficeId) return false;
    if (filterType && s.type.toString() !== filterType) return false;
    return true;
  });

  const copyShareLink = (spaceId: string) => {
    const url = `${window.location.origin}/facilities/admin/spaces/${spaceId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(spaceId);
    toast.success('Share link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Spaces ({filteredSpaces.length})</h3>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Types</option>
            {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
          Add Space
        </Button>
      </div>

      <Card padding="none">
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSpaces.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No spaces found. Add a space to get started.
                    </td>
                  </tr>
                ) : (
                  filteredSpaces.map((space) => (
                    <tr key={space.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/facilities/admin/spaces/${space.id}`}
                          className="font-medium text-teal-600 hover:text-teal-800 hover:underline"
                        >
                          {space.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {getOfficeName(space.officeId)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-800">
                          {SPACE_TYPE_LABELS[space.type] || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{space.capacity}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-500">
                        {space.equipment || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          space.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {space.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyShareLink(space.id)}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                            title="Copy share link"
                          >
                            {copiedId === space.id ? '✓' : '🔗'}
                          </button>
                          <button
                            onClick={() => setEditingSpace(space)}
                            className="text-teal-600 hover:text-teal-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this space?')) {
                                deleteMutation.mutate(space.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSpace) && (
        <SpaceModal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSpace(null);
          }}
          space={editingSpace}
          offices={offices}
        />
      )}
    </div>
  );
}

// ==================== IMPORT/EXPORT TAB ====================

function ImportExportTab({
  tenantId,
  selectedOfficeId,
  queryClient,
}: {
  tenantId: string;
  selectedOfficeId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<'offices' | 'spaces' | 'floors' | 'zones' | 'assignments'>('offices');
  const [importResult, setImportResult] = useState<{success: boolean; totalRows: number; importedRows: number; errors: string[]} | null>(null);

  const entityOptions = [
    { value: 'offices', label: 'Offices' },
    { value: 'spaces', label: 'Spaces' },
    { value: 'floors', label: 'Floors' },
    { value: 'zones', label: 'Zones' },
    { value: 'assignments', label: 'Space Assignments' },
  ];

  const handleExport = async (entityType: 'offices' | 'spaces' | 'floors' | 'zones' | 'assignments' | 'booking-rules') => {
    try {
      const blob = await facilitiesAdminService.exportToExcel(tenantId, entityType, selectedOfficeId || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${entityType} exported successfully`);
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadTemplate = async (entityType: 'offices' | 'spaces' | 'floors' | 'zones' | 'assignments') => {
    try {
      const blob = await facilitiesAdminService.downloadTemplate(entityType);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch (error) {
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setImportResult(null);
      const result = await facilitiesAdminService.importFromExcel(tenantId, selectedEntity, file);
      setImportResult(result);
      if (result.success) {
        toast.success(`Imported ${result.importedRows} of ${result.totalRows} rows`);
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['offices'] });
        queryClient.invalidateQueries({ queryKey: ['facilities-spaces'] });
        queryClient.invalidateQueries({ queryKey: ['facilities-floors'] });
        queryClient.invalidateQueries({ queryKey: ['facilities-zones'] });
      } else {
        toast.error(`Import completed with errors`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card padding="md">
        <CardHeader title="Export Data to Excel" />
        <CardBody>
          <p className="text-gray-600 mb-4">
            Download facility data as Excel files. {selectedOfficeId ? 'Data will be filtered by the selected office.' : 'All data will be exported.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button variant="secondary" onClick={() => handleExport('offices')}>
              Export Offices
            </Button>
            <Button variant="secondary" onClick={() => handleExport('spaces')}>
              Export Spaces
            </Button>
            <Button variant="secondary" onClick={() => handleExport('floors')}>
              Export Floors
            </Button>
            <Button variant="secondary" onClick={() => handleExport('zones')}>
              Export Zones
            </Button>
            <Button variant="secondary" onClick={() => handleExport('assignments')}>
              Export Assignments
            </Button>
            <Button variant="secondary" onClick={() => handleExport('booking-rules')}>
              Export Rules
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Import Section */}
      <Card padding="md">
        <CardHeader title="Import Data from Excel" />
        <CardBody className="space-y-4">
          <p className="text-gray-600">
            Upload an Excel file to bulk import facility data. Download a template first to see the required format.
          </p>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value as typeof selectedEntity)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {entityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-6">
              <Button variant="secondary" onClick={() => handleDownloadTemplate(selectedEntity)}>
                Download Template
              </Button>
              <Button variant="primary" onClick={() => fileInputRef.current?.click()} className="bg-teal-600 hover:bg-teal-700">
                Upload Excel File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h4 className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                Import {importResult.success ? 'Successful' : 'Completed with Errors'}
              </h4>
              <p className="text-sm mt-1">
                Imported {importResult.importedRows} of {importResult.totalRows} rows
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...and {importResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Import Guidelines */}
      <Card padding="md">
        <CardHeader title="Import Guidelines" />
        <CardBody>
          <div className="prose prose-sm max-w-none">
            <ul className="space-y-2 text-gray-600">
              <li><strong>Offices:</strong> Name is required. Address, City, State, Timezone are optional.</li>
              <li><strong>Spaces:</strong> OfficeName and SpaceName are required. Type must be a valid space type (Desk, HotDesk, Office, etc.).</li>
              <li><strong>Floors:</strong> OfficeName, FloorName, and Level are required.</li>
              <li><strong>Zones:</strong> FloorName and ZoneName are required. Color should be a hex color code.</li>
              <li><strong>Assignments:</strong> SpaceName, UserEmail, StartDate, and Type are required.</li>
            </ul>
            <p className="mt-4 text-gray-500 text-sm">
              Download the template for each entity type to see the exact column format required.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ==================== FLOORS TAB ====================

function FloorsTab({
  floors,
  offices,
  tenantId,
}: {
  floors: Floor[];
  offices: Office[];
  tenantId: string;
}) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facilitiesAdminService.deleteFloor(id, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-floors'] });
      toast.success('Floor deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete floor');
    },
  });

  const getOfficeName = (officeId: string) => {
    const office = offices.find(o => o.id === officeId);
    return office?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Floors ({floors.length})</h3>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
          Add Floor
        </Button>
      </div>

      <Card padding="none">
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sq. Footage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {floors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No floors found. Add a floor to get started.
                    </td>
                  </tr>
                ) : (
                  floors.map((floor) => (
                    <tr key={floor.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{getOfficeName(floor.officeId)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{floor.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{floor.level}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {floor.squareFootage ? `${floor.squareFootage.toLocaleString()} sq ft` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          floor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {floor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingFloor(floor)}
                            className="text-teal-600 hover:text-teal-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this floor?')) {
                                deleteMutation.mutate(floor.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFloor) && (
        <FloorModal
          floor={editingFloor}
          offices={offices}
          tenantId={tenantId}
          onClose={() => {
            setShowCreateModal(false);
            setEditingFloor(null);
          }}
        />
      )}
    </div>
  );
}

// ==================== ZONES TAB ====================

function ZonesTab({
  zones,
  floors,
  tenantId,
}: {
  zones: Zone[];
  floors: Floor[];
  tenantId: string;
}) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facilitiesAdminService.deleteZone(id, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-zones'] });
      toast.success('Zone deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete zone');
    },
  });

  const getFloorName = (floorId: string) => {
    const floor = floors.find(f => f.id === floorId);
    return floor?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Zones ({zones.length})</h3>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
          Add Zone
        </Button>
      </div>

      <Card padding="none">
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No zones found. Add a zone to get started.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{getFloorName(zone.floorId)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{zone.name}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{zone.description || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {zone.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: zone.color }}
                            />
                            <span className="text-xs text-gray-500">{zone.color}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          zone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingZone(zone)}
                            className="text-teal-600 hover:text-teal-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this zone?')) {
                                deleteMutation.mutate(zone.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingZone) && (
        <ZoneModal
          zone={editingZone}
          floors={floors}
          tenantId={tenantId}
          onClose={() => {
            setShowCreateModal(false);
            setEditingZone(null);
          }}
        />
      )}
    </div>
  );
}

// ==================== FLOOR MODAL ====================

function FloorModal({
  floor,
  offices,
  tenantId,
  onClose,
}: {
  floor: Floor | null;
  offices: Office[];
  tenantId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!floor;
  const [formData, setFormData] = useState({
    officeId: floor?.officeId || offices[0]?.id || '',
    name: floor?.name || '',
    level: floor?.level || 1,
    squareFootage: floor?.squareFootage || undefined,
    floorPlanUrl: floor?.floorPlanUrl || '',
    isActive: floor?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => facilitiesAdminService.createFloor(tenantId, {
      officeId: data.officeId,
      name: data.name,
      level: data.level,
      squareFootage: data.squareFootage,
      floorPlanUrl: data.floorPlanUrl || undefined,
      isActive: data.isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-floors'] });
      toast.success('Floor created');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create floor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => facilitiesAdminService.updateFloor(floor!.id, tenantId, {
      name: data.name,
      level: data.level,
      squareFootage: data.squareFootage,
      floorPlanUrl: data.floorPlanUrl || undefined,
      isActive: data.isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-floors'] });
      toast.success('Floor updated');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update floor');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Floor' : 'Add Floor'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office *</label>
              <select
                value={formData.officeId}
                onChange={(e) => setFormData({ ...formData, officeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                required
              >
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>{office.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., 1st Floor, Ground Floor"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
            <input
              type="number"
              value={formData.squareFootage || ''}
              onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Optional"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== ZONE MODAL ====================

function ZoneModal({
  zone,
  floors,
  tenantId,
  onClose,
}: {
  zone: Zone | null;
  floors: Floor[];
  tenantId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!zone;
  const [formData, setFormData] = useState({
    floorId: zone?.floorId || floors[0]?.id || '',
    name: zone?.name || '',
    description: zone?.description || '',
    color: zone?.color || '#0d9488',
    isActive: zone?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => facilitiesAdminService.createZone(tenantId, {
      floorId: data.floorId,
      name: data.name,
      description: data.description || undefined,
      color: data.color || undefined,
      isActive: data.isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-zones'] });
      toast.success('Zone created');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create zone');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => facilitiesAdminService.updateZone(zone!.id, tenantId, {
      name: data.name,
      description: data.description || undefined,
      color: data.color || undefined,
      isActive: data.isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-zones'] });
      toast.success('Zone updated');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update zone');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Zone' : 'Add Zone'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
              <select
                value={formData.floorId}
                onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                required
              >
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>{floor.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., North Wing, Engineering Area"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-16 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{formData.color}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="zoneIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="zoneIsActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FacilitiesAdminPage;
