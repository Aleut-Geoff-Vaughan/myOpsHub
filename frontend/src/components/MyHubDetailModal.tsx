import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Modal, ConfirmDialog } from './ui/Modal';
import { Button } from './ui/Button';
import { bookingsService } from '../services/bookingsService';
import { doaService } from '../services/doaService';
import { useAuthStore } from '../stores/authStore';
import { BookingStatus, ProjectAssignmentStatus } from '../types/api';
import { DOAStatus, SignatureRole } from '../types/doa';
import type { Booking, ProjectAssignment } from '../types/api';
import type { DelegationOfAuthorityLetter } from '../types/doa';
import type { Forecast } from '../services/forecastService';
import {
  Calendar,
  Building2,
  Clock,
  MapPin,
  FileText,
  Briefcase,
  ChartBar,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';

// Schedule type for work preferences
interface SchedulePreference {
  id?: string;
  workDate: string;
  locationType: number;
  dayPortion: number;
  office?: { id: string; name: string };
  notes?: string;
}

type ModalType = 'schedule' | 'booking' | 'doa' | 'assignment' | 'forecast';

interface MyHubDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  data: SchedulePreference | Booking | DelegationOfAuthorityLetter | ProjectAssignment | Forecast | null;
  date?: Date;
}

export function MyHubDetailModal({ isOpen, onClose, type, data, date }: MyHubDetailModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => bookingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Booking cancelled successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });

  // Revoke DOA mutation
  const revokeDOAMutation = useMutation({
    mutationFn: (id: string) => doaService.revokeDOALetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
      queryClient.invalidateQueries({ queryKey: ['my-doa-letters-range'] });
      toast.success('DOA letter revoked successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to revoke DOA letter');
    },
  });

  if (!data) return null;

  const handleNavigateToPage = () => {
    switch (type) {
      case 'schedule':
        navigate('/schedule');
        break;
      case 'booking':
        navigate('/hoteling');
        break;
      case 'doa':
        navigate('/doa');
        break;
      case 'assignment':
        navigate('/staffing');
        break;
      case 'forecast':
        navigate('/forecast/my-forecasts');
        break;
    }
    onClose();
  };

  const handleDelete = () => {
    if (type === 'booking') {
      const booking = data as Booking;
      deleteBookingMutation.mutate(booking.id);
    } else if (type === 'doa') {
      const doa = data as DelegationOfAuthorityLetter;
      revokeDOAMutation.mutate(doa.id);
    }
    setShowDeleteConfirm(false);
  };

  const renderScheduleContent = () => {
    const schedule = data as SchedulePreference;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">
            {date ? format(date, 'EEEE, MMMM d, yyyy') : schedule.workDate}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Work Location</div>
              <div className="font-medium">{getLocationLabel(schedule.locationType)}</div>
            </div>
          </div>

          {schedule.dayPortion !== 0 && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-sm text-gray-500">Day Portion</div>
                <div className="font-medium">{getDayPortionLabel(schedule.dayPortion)}</div>
              </div>
            </div>
          )}

          {schedule.office && (
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-500">Office</div>
                <div className="font-medium">{schedule.office.name}</div>
              </div>
            </div>
          )}

          {schedule.notes && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Notes</div>
                <div className="text-sm">{schedule.notes}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBookingContent = () => {
    const booking = data as Booking;
    const canCancel = booking.status === BookingStatus.Reserved;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">
            {format(new Date(booking.startDatetime), 'EEEE, MMMM d, yyyy')}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Time</div>
              <div className="font-medium">
                {format(new Date(booking.startDatetime), 'h:mm a')}
                {booking.endDatetime && ` - ${format(new Date(booking.endDatetime), 'h:mm a')}`}
              </div>
            </div>
          </div>

          {booking.space && (
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-500">Space</div>
                <div className="font-medium">{booking.space.name}</div>
                {booking.space.office && (
                  <div className="text-sm text-gray-500">{booking.space.office.name}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${getBookingStatusDotColor(booking.status)}`}></span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium">{getBookingStatusLabel(booking.status)}</div>
            </div>
          </div>

          {booking.isPermanent && (
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
              This is a permanent booking
            </div>
          )}
        </div>

        {canCancel && (
          <div className="pt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel Booking
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderDOAContent = () => {
    const doa = data as DelegationOfAuthorityLetter;
    const isDelegator = user?.id === doa.delegatorUserId;
    const isDesignee = user?.id === doa.designeeUserId;
    const canRevoke = isDelegator && doa.status === DOAStatus.Active;

    const delegatorSignature = doa.signatures?.find(s => s.role === SignatureRole.Delegator);
    const designeeSignature = doa.signatures?.find(s => s.role === SignatureRole.Designee);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDOAStatusColor(doa.status)}`}>
            {getDOAStatusLabel(doa.status)}
          </span>
          <span className={`text-sm px-2 py-1 rounded ${
            isDesignee ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {isDesignee ? 'Acting for delegator' : 'Delegated to designee'}
          </span>
        </div>

        {doa.subjectLine && (
          <div className="text-lg font-semibold text-gray-900">{doa.subjectLine}</div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Delegator</div>
              <div className="font-medium">{doa.delegatorUser?.displayName || 'Unknown'}</div>
              {delegatorSignature && (
                <div className="text-xs text-green-600 mt-1">Signed</div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">Designee</div>
              <div className="font-medium">{doa.designeeUser?.displayName || 'Unknown'}</div>
              {designeeSignature && (
                <div className="text-xs text-green-600 mt-1">Signed</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Effective From</div>
              <div className="font-medium">{format(new Date(doa.effectiveStartDate), 'MMM d, yyyy')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Effective Until</div>
              <div className="font-medium">{format(new Date(doa.effectiveEndDate), 'MMM d, yyyy')}</div>
            </div>
          </div>
        </div>

        {doa.letterContent && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-2">Letter Content</div>
            <div className="text-sm whitespace-pre-wrap line-clamp-4">{doa.letterContent}</div>
          </div>
        )}

        {canRevoke && (
          <div className="pt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Revoke DOA
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentContent = () => {
    const assignment = data as ProjectAssignment;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-orange-500" />
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getAssignmentStatusColor(assignment.status)}`}>
            {getAssignmentStatusLabel(assignment.status)}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-500">Project ID</div>
            <div className="font-medium text-sm font-mono">{assignment.projectId}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Start Date</div>
              <div className="font-medium">{format(new Date(assignment.startDate), 'MMM d, yyyy')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">End Date</div>
              <div className="font-medium">
                {assignment.endDate ? format(new Date(assignment.endDate), 'MMM d, yyyy') : 'Ongoing'}
              </div>
            </div>
          </div>

          {assignment.notes && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-500">Notes</div>
              <div className="text-sm">{assignment.notes}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderForecastContent = () => {
    const forecast = data as Forecast;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ChartBar className="w-5 h-5 text-cyan-500" />
          <span className="font-medium text-gray-900">
            {format(new Date(forecast.year, forecast.month - 1), 'MMMM yyyy')}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-500">Project</div>
            <div className="font-medium">{forecast.projectName}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Forecasted Hours</div>
              <div className="text-2xl font-bold text-cyan-600">{forecast.forecastedHours}h</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className={`font-medium ${getForecastStatusTextColor(forecast.status)}`}>
                {forecast.statusName}
              </div>
            </div>
          </div>

          {forecast.notes && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-500">Notes</div>
              <div className="text-sm">{forecast.notes}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (type) {
      case 'schedule': return 'Schedule Details';
      case 'booking': return 'Booking Details';
      case 'doa': return 'DOA Letter Details';
      case 'assignment': return 'Assignment Details';
      case 'forecast': return 'Forecast Details';
      default: return 'Details';
    }
  };

  const getDeleteConfirmMessage = () => {
    if (type === 'booking') {
      return 'Are you sure you want to cancel this booking? This action cannot be undone.';
    }
    if (type === 'doa') {
      return 'Are you sure you want to revoke this DOA letter? The designee will no longer have delegation authority.';
    }
    return 'Are you sure you want to delete this item?';
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={getTitle()}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleNavigateToPage}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Page
            </Button>
          </div>
        }
      >
        {type === 'schedule' && renderScheduleContent()}
        {type === 'booking' && renderBookingContent()}
        {type === 'doa' && renderDOAContent()}
        {type === 'assignment' && renderAssignmentContent()}
        {type === 'forecast' && renderForecastContent()}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={type === 'doa' ? 'Revoke DOA Letter' : 'Cancel Booking'}
        message={getDeleteConfirmMessage()}
        confirmText={type === 'doa' ? 'Revoke' : 'Cancel Booking'}
        variant="danger"
      />
    </>
  );
}

// Helper functions
function getLocationLabel(locationType: number): string {
  switch (locationType) {
    case 0: return 'Remote';
    case 1: return 'Remote Plus';
    case 2: return 'Client Site';
    case 3: return 'In Office';
    case 4: return 'In Office (Reserved)';
    case 5: return 'PTO';
    case 6: return 'Travel';
    default: return 'Unknown';
  }
}

function getDayPortionLabel(dayPortion: number): string {
  switch (dayPortion) {
    case 1: return 'AM Only';
    case 2: return 'PM Only';
    default: return 'Full Day';
  }
}

function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.Reserved: return 'Reserved';
    case BookingStatus.CheckedIn: return 'Checked In';
    case BookingStatus.Completed: return 'Completed';
    case BookingStatus.Cancelled: return 'Cancelled';
    case BookingStatus.NoShow: return 'No Show';
    default: return 'Unknown';
  }
}

function getBookingStatusDotColor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.Reserved: return 'bg-emerald-500';
    case BookingStatus.CheckedIn: return 'bg-green-500';
    case BookingStatus.Completed: return 'bg-gray-500';
    case BookingStatus.Cancelled: return 'bg-red-500';
    case BookingStatus.NoShow: return 'bg-amber-500';
    default: return 'bg-gray-500';
  }
}

function getDOAStatusLabel(status: DOAStatus): string {
  switch (status) {
    case DOAStatus.Draft: return 'Draft';
    case DOAStatus.PendingSignatures: return 'Pending Signatures';
    case DOAStatus.Active: return 'Active';
    case DOAStatus.Expired: return 'Expired';
    case DOAStatus.Revoked: return 'Revoked';
    default: return 'Unknown';
  }
}

function getDOAStatusColor(status: DOAStatus): string {
  switch (status) {
    case DOAStatus.Draft: return 'bg-gray-100 text-gray-800';
    case DOAStatus.PendingSignatures: return 'bg-yellow-100 text-yellow-800';
    case DOAStatus.Active: return 'bg-green-100 text-green-800';
    case DOAStatus.Expired: return 'bg-orange-100 text-orange-800';
    case DOAStatus.Revoked: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getAssignmentStatusLabel(status: ProjectAssignmentStatus): string {
  switch (status) {
    case ProjectAssignmentStatus.Draft: return 'Draft';
    case ProjectAssignmentStatus.PendingApproval: return 'Pending Approval';
    case ProjectAssignmentStatus.Active: return 'Active';
    case ProjectAssignmentStatus.Completed: return 'Completed';
    case ProjectAssignmentStatus.Cancelled: return 'Cancelled';
    default: return 'Unknown';
  }
}

function getAssignmentStatusColor(status: ProjectAssignmentStatus): string {
  switch (status) {
    case ProjectAssignmentStatus.Draft: return 'bg-gray-100 text-gray-800';
    case ProjectAssignmentStatus.PendingApproval: return 'bg-yellow-100 text-yellow-800';
    case ProjectAssignmentStatus.Active: return 'bg-green-100 text-green-800';
    case ProjectAssignmentStatus.Completed: return 'bg-blue-100 text-blue-800';
    case ProjectAssignmentStatus.Cancelled: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getForecastStatusTextColor(status: number): string {
  switch (status) {
    case 0: return 'text-gray-600'; // Draft
    case 1: return 'text-yellow-600'; // Submitted
    case 2: return 'text-purple-600'; // Reviewed
    case 3: return 'text-green-600'; // Approved
    case 4: return 'text-red-600'; // Rejected
    case 5: return 'text-cyan-600'; // Locked
    default: return 'text-gray-600';
  }
}
