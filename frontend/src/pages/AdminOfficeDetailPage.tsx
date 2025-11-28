import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { officesService } from '../services/officesService';
import { facilitiesService } from '../services/facilitiesService';
import { facilitiesAdminService } from '../services/facilitiesAdminService';
import { bookingsService } from '../services/bookingsService';
import { SpaceModal } from '../components/SpaceModal';
import { BookingModal } from '../components/BookingModal';
import toast from 'react-hot-toast';
import type { Space, Booking } from '../types/api';
import { SpaceType, BookingStatus } from '../types/api';

type TabType = 'spaces' | 'bookings' | 'floors' | 'zones';

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

const BOOKING_STATUS_LABELS: Record<number, string> = {
  [BookingStatus.Reserved]: 'Reserved',
  [BookingStatus.CheckedIn]: 'Checked In',
  [BookingStatus.Completed]: 'Completed',
  [BookingStatus.Cancelled]: 'Cancelled',
  [BookingStatus.NoShow]: 'No Show',
};

export function AdminOfficeDetailPage() {
  const { officeId } = useParams<{ officeId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useAuthStore();
  const tenantId = currentWorkspace?.tenantId || '';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('spaces');
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch office details
  const { data: office, isLoading: loadingOffice } = useQuery({
    queryKey: ['office', officeId],
    queryFn: () => officesService.getById(officeId!),
    enabled: !!officeId,
  });

  // Fetch all offices for modal
  const { data: allOffices = [] } = useQuery({
    queryKey: ['offices', tenantId],
    queryFn: () => officesService.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  // Fetch spaces for this office
  const { data: spaces = [], isLoading: loadingSpaces } = useQuery({
    queryKey: ['office-spaces', officeId],
    queryFn: () => facilitiesService.getSpaces({ officeId }),
    enabled: !!officeId,
  });

  // Fetch bookings for this office
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['office-bookings', officeId],
    queryFn: () => bookingsService.getAll({ officeId }),
    enabled: !!officeId,
  });

  // Fetch floors for this office
  const { data: floors = [], isLoading: loadingFloors } = useQuery({
    queryKey: ['office-floors', officeId, tenantId],
    queryFn: () => facilitiesAdminService.getFloors(tenantId, officeId),
    enabled: !!officeId && !!tenantId,
  });

  // Fetch zones for this office
  const { data: zones = [], isLoading: loadingZones } = useQuery({
    queryKey: ['office-zones', officeId, tenantId],
    queryFn: () => facilitiesAdminService.getZones(tenantId, undefined, officeId),
    enabled: !!officeId && !!tenantId,
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: (id: string) => facilitiesService.deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-spaces', officeId] });
      toast.success('Space deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete space');
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => bookingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-bookings', officeId] });
      toast.success('Booking deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete booking');
    },
  });

  const copyShareLink = (type: 'office' | 'space', id: string) => {
    const url = `${window.location.origin}/admin/facilities/${type}/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Share link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSpaceName = (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    return space?.name || 'Unknown';
  };

  const isLoading = loadingOffice || loadingSpaces || loadingBookings || loadingFloors || loadingZones;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Office not found</p>
              <Link to="/admin/facilities" className="text-blue-600 hover:underline">
                Back to Facilities
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'spaces' as TabType, label: `Spaces (${spaces.length})`, icon: '🪑' },
    { id: 'bookings' as TabType, label: `Bookings (${bookings.length})`, icon: '📅' },
    { id: 'floors' as TabType, label: `Floors (${floors.length})`, icon: '🏢' },
    { id: 'zones' as TabType, label: `Zones (${zones.length})`, icon: '📍' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin/facilities" className="hover:text-blue-600">Facilities</Link>
            <span>/</span>
            <span>{office.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{office.name}</h1>
            <button
              type="button"
              onClick={() => copyShareLink('office', office.id)}
              className="text-gray-400 hover:text-gray-600"
              title="Copy share link"
            >
              {copiedId === office.id ? '✓ Copied' : '🔗 Share'}
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {office.city && office.stateCode ? `${office.city}, ${office.stateCode}` : 'No location set'}
            {office.address && ` • ${office.address}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/facilities')}>
            Back
          </Button>
          <Link to={`/admin/offices`}>
            <Button variant="secondary">Edit Office</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{spaces.length}</div>
            <div className="text-sm text-gray-600">Total Spaces</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{spaces.filter(s => s.isActive).length}</div>
            <div className="text-sm text-gray-600">Active Spaces</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{bookings.filter(b => b.status === BookingStatus.Reserved).length}</div>
            <div className="text-sm text-gray-600">Active Bookings</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{floors.length}</div>
            <div className="text-sm text-gray-600">Floors</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
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
      {activeTab === 'spaces' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowSpaceModal(true)}>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {spaces.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No spaces found for this office. Add a space to get started.
                        </td>
                      </tr>
                    ) : (
                      spaces.map((space) => (
                        <tr key={space.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              to={`/admin/facilities/space/${space.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {space.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
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
                                type="button"
                                onClick={() => copyShareLink('space', space.id)}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                                title="Copy share link"
                              >
                                {copiedId === space.id ? '✓' : '🔗'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSpace(space)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this space?')) {
                                    deleteSpaceMutation.mutate(space.id);
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
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowBookingModal(true)}>
              Add Booking
            </Button>
          </div>
          <Card padding="none">
            <CardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Space</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No bookings found for this office.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            <Link
                              to={`/admin/facilities/space/${booking.spaceId}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {getSpaceName(booking.spaceId)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(booking.startDatetime).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {booking.isPermanent ? (
                              <span className="text-blue-600 font-medium">Permanent</span>
                            ) : booking.endDatetime ? (
                              new Date(booking.endDatetime).toLocaleString()
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              booking.status === BookingStatus.Reserved ? 'bg-blue-100 text-blue-800' :
                              booking.status === BookingStatus.CheckedIn ? 'bg-green-100 text-green-800' :
                              booking.status === BookingStatus.Completed ? 'bg-gray-100 text-gray-800' :
                              booking.status === BookingStatus.Cancelled ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {BOOKING_STATUS_LABELS[booking.status] || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingBooking(booking)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this booking?')) {
                                    deleteBookingMutation.mutate(booking.id);
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
        </div>
      )}

      {activeTab === 'floors' && (
        <Card padding="none">
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sq. Footage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {floors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No floors found for this office.
                      </td>
                    </tr>
                  ) : (
                    floors.map((floor) => (
                      <tr key={floor.id}>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'zones' && (
        <Card padding="none">
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {zones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No zones found for this office.
                      </td>
                    </tr>
                  ) : (
                    zones.map((zone) => {
                      const floor = floors.find(f => f.id === zone.floorId);
                      return (
                        <tr key={zone.id}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">{zone.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{floor?.name || 'Unknown'}</td>
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Space Modal */}
      {(showSpaceModal || editingSpace) && (
        <SpaceModal
          isOpen={true}
          onClose={() => {
            setShowSpaceModal(false);
            setEditingSpace(null);
            queryClient.invalidateQueries({ queryKey: ['office-spaces', officeId] });
          }}
          space={editingSpace}
          offices={allOffices}
        />
      )}

      {/* Booking Modal */}
      {(showBookingModal || editingBooking) && (
        <BookingModal
          isOpen={true}
          onClose={() => {
            setShowBookingModal(false);
            setEditingBooking(undefined);
            queryClient.invalidateQueries({ queryKey: ['office-bookings', officeId] });
          }}
          booking={editingBooking}
          mode={editingBooking ? 'edit' : 'create'}
          defaultOfficeId={officeId}
          defaultTenantId={tenantId}
        />
      )}
    </div>
  );
}

export default AdminOfficeDetailPage;
