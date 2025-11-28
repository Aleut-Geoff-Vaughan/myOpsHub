import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardHeader, CardBody } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { officesService } from '../services/officesService';
import { facilitiesService } from '../services/facilitiesService';
import { bookingsService } from '../services/bookingsService';
import { SpaceModal } from '../components/SpaceModal';
import { BookingModal } from '../components/BookingModal';
import toast from 'react-hot-toast';
import type { Booking } from '../types/api';
import { SpaceType, BookingStatus } from '../types/api';

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

export function AdminSpaceDetailPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useAuthStore();
  const tenantId = currentWorkspace?.tenantId || '';
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  // Fetch space details
  const { data: space, isLoading: loadingSpace } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => facilitiesService.getSpaceById(spaceId!),
    enabled: !!spaceId,
  });

  // Fetch office for this space
  const { data: office } = useQuery({
    queryKey: ['office', space?.officeId],
    queryFn: () => officesService.getById(space!.officeId),
    enabled: !!space?.officeId,
  });

  // Fetch all offices for modal
  const { data: allOffices = [] } = useQuery({
    queryKey: ['offices', tenantId],
    queryFn: () => officesService.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  // Fetch bookings for this space
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['space-bookings', spaceId],
    queryFn: () => bookingsService.getAll({ spaceId }),
    enabled: !!spaceId,
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => bookingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-bookings', spaceId] });
      toast.success('Booking deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete booking');
    },
  });

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Share link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = loadingSpace || loadingBookings;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Space not found</p>
              <Link to="/admin/facilities" className="text-blue-600 hover:underline">
                Back to Facilities
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Group bookings by status
  const activeBookings = bookings.filter(b => b.status === BookingStatus.Reserved || b.status === BookingStatus.CheckedIn);
  const pastBookings = bookings.filter(b => b.status === BookingStatus.Completed || b.status === BookingStatus.Cancelled || b.status === BookingStatus.NoShow);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin/facilities" className="hover:text-blue-600">Facilities</Link>
            <span>/</span>
            {office && (
              <>
                <Link to={`/admin/facilities/office/${office.id}`} className="hover:text-blue-600">
                  {office.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span>{space.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
            <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
              {SPACE_TYPE_LABELS[space.type] || 'Unknown'}
            </span>
            <button
              type="button"
              onClick={copyShareLink}
              className="text-gray-400 hover:text-gray-600"
              title="Copy share link"
            >
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {office?.name || 'Unknown Office'}
            {office?.city && office?.stateCode && ` • ${office.city}, ${office.stateCode}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="primary" onClick={() => setShowEditModal(true)}>
            Edit Space
          </Button>
        </div>
      </div>

      {/* Space Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Space Details" />
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Capacity</dt>
                <dd className="font-medium">{space.capacity} {space.capacity === 1 ? 'person' : 'people'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    space.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {space.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Requires Approval</dt>
                <dd className="font-medium">{space.requiresApproval ? 'Yes' : 'No'}</dd>
              </div>
              {space.dailyCost !== undefined && space.dailyCost !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Daily Cost</dt>
                  <dd className="font-medium">${space.dailyCost.toFixed(2)}</dd>
                </div>
              )}
              {space.maxBookingDays !== undefined && space.maxBookingDays !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Max Booking Days</dt>
                  <dd className="font-medium">{space.maxBookingDays} days</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Equipment & Features" />
          <CardBody>
            <dl className="space-y-4">
              <div>
                <dt className="text-gray-500 mb-1">Equipment</dt>
                <dd className="font-medium">
                  {space.equipment ? (
                    <div className="flex flex-wrap gap-1">
                      {space.equipment.split(',').map((item, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">None specified</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Features</dt>
                <dd className="font-medium">
                  {space.features ? (
                    <div className="flex flex-wrap gap-1">
                      {space.features.split(',').map((item, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">None specified</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Bookings */}
      <Card>
        <CardHeader
          title={`Bookings (${bookings.length})`}
          action={
            <Button variant="primary" size="sm" onClick={() => setShowBookingModal(true)}>
              Add Booking
            </Button>
          }
        />
        <CardBody>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings found for this space.
            </div>
          ) : (
            <div className="space-y-6">
              {activeBookings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Active Bookings</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked For</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.user?.displayName || 'Unknown User'}
                              </div>
                              {booking.user?.email && (
                                <div className="text-xs text-gray-500">{booking.user.email}</div>
                              )}
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
                                'bg-green-100 text-green-800'
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {pastBookings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Past Bookings</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked For</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pastBookings.slice(0, 10).map((booking) => (
                          <tr key={booking.id} className="bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-700">
                                {booking.user?.displayName || 'Unknown User'}
                              </div>
                              {booking.user?.email && (
                                <div className="text-xs text-gray-500">{booking.user.email}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {new Date(booking.startDatetime).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {booking.isPermanent ? (
                                <span className="text-blue-600 font-medium">Permanent</span>
                              ) : booking.endDatetime ? (
                                new Date(booking.endDatetime).toLocaleString()
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === BookingStatus.Completed ? 'bg-gray-100 text-gray-800' :
                                booking.status === BookingStatus.Cancelled ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {BOOKING_STATUS_LABELS[booking.status] || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pastBookings.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2 px-4">
                        Showing 10 of {pastBookings.length} past bookings
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Space Modal */}
      {showEditModal && (
        <SpaceModal
          isOpen={true}
          onClose={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
          }}
          space={space}
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
            queryClient.invalidateQueries({ queryKey: ['space-bookings', spaceId] });
          }}
          booking={editingBooking}
          mode={editingBooking ? 'edit' : 'create'}
          defaultOfficeId={space?.officeId}
          defaultSpaceId={spaceId}
          defaultTenantId={tenantId}
        />
      )}
    </div>
  );
}

export default AdminSpaceDetailPage;
