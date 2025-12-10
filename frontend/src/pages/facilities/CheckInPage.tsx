import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facilitiesPortalService, CheckInMethod } from '../../services/facilitiesPortalService';
import type { FacilityCheckInRequest } from '../../services/facilitiesPortalService';
import { format } from 'date-fns';

export function CheckInPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(searchParams.get('office') || '');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Fetch offices
  const { data: offices = [], isLoading: loadingOffices } = useQuery({
    queryKey: ['office-directory'],
    queryFn: () => facilitiesPortalService.getOfficeDirectory(),
  });

  // Fetch user's current check-ins
  const { data: myCheckIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ['my-check-ins'],
    queryFn: () => facilitiesPortalService.getMyCheckIns(),
  });

  // Active check-in (not checked out)
  const activeCheckIn = myCheckIns.find(c => !c.checkOutTime);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (request: FacilityCheckInRequest) => facilitiesPortalService.checkIn(request),
    onSuccess: () => {
      toast.success('Checked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-check-ins'] });
      setNotes('');
      setSelectedSpaceId('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check in');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: (checkInId: string) => facilitiesPortalService.checkOut(checkInId),
    onSuccess: () => {
      toast.success('Checked out successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-check-ins'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check out');
    },
  });

  // Get user location
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('success');
        toast.success('Location captured');
      },
      (error) => {
        setLocationStatus('error');
        toast.error('Unable to get your location');
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle check-in
  const handleCheckIn = () => {
    if (!selectedOfficeId) {
      toast.error('Please select an office');
      return;
    }

    const request: FacilityCheckInRequest = {
      officeId: selectedOfficeId,
      spaceId: selectedSpaceId || undefined,
      method: CheckInMethod.Web,
      deviceInfo: navigator.userAgent,
      latitude: location?.latitude,
      longitude: location?.longitude,
      notes: notes || undefined,
    };

    checkInMutation.mutate(request);
  };

  // Handle check-out
  const handleCheckOut = () => {
    if (activeCheckIn) {
      checkOutMutation.mutate(activeCheckIn.id);
    }
  };

  const selectedOffice = offices.find(o => o.id === selectedOfficeId);

  if (loadingOffices || loadingCheckIns) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Quick Check-In</h1>
        <p className="text-gray-600 mt-1">Check in to an office or workspace</p>
      </div>

      {/* Current Status Card */}
      {activeCheckIn && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900">Currently Checked In</h3>
                <p className="text-teal-700">{activeCheckIn.office?.name || 'Unknown Office'}</p>
                {activeCheckIn.space?.name && (
                  <p className="text-sm text-teal-600">{activeCheckIn.space.name}</p>
                )}
                <p className="text-sm text-teal-600 mt-1">
                  Since {format(new Date(activeCheckIn.checkInTime), 'h:mm a')}
                </p>
              </div>
            </div>
            <button
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
        </div>
      )}

      {/* Check-In Form */}
      {!activeCheckIn && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Office Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Office *
              </label>
              <select
                value={selectedOfficeId}
                onChange={(e) => {
                  setSelectedOfficeId(e.target.value);
                  setSelectedSpaceId('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Choose an office...</option>
                {offices.filter(o => o.status === 0).map(office => (
                  <option key={office.id} value={office.id}>
                    {office.name} {office.city && `- ${office.city}, ${office.stateCode}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Space Selection (Optional) */}
            {selectedOffice && selectedOffice.spaceCount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Space (Optional)
                </label>
                <select
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">General check-in (no specific space)</option>
                  {/* Note: Would need to fetch spaces for this office */}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedOffice.spaceCount} spaces available
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="E.g., Working from conference room today..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locationStatus === 'loading'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                    locationStatus === 'success'
                      ? 'border-teal-300 bg-teal-50 text-teal-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {locationStatus === 'loading' ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {locationStatus === 'success' ? 'Location Captured' : 'Capture Location'}
                </button>
                {location && (
                  <span className="text-sm text-gray-500">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Help us verify your presence at the office
              </p>
            </div>
          </div>

          {/* Check-In Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleCheckIn}
              disabled={!selectedOfficeId || checkInMutation.isPending}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkInMutation.isPending ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking In...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check In Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent Check-Ins */}
      {myCheckIns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Check-Ins</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {myCheckIns.slice(0, 5).map((checkIn) => (
              <div key={checkIn.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    checkIn.checkOutTime ? 'bg-gray-100' : 'bg-teal-100'
                  }`}>
                    <svg className={`w-5 h-5 ${checkIn.checkOutTime ? 'text-gray-600' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{checkIn.office?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(checkIn.checkInTime), 'MMM d, yyyy h:mm a')}
                      {checkIn.checkOutTime && (
                        <> - {format(new Date(checkIn.checkOutTime), 'h:mm a')}</>
                      )}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  checkIn.checkOutTime
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-teal-100 text-teal-700'
                }`}>
                  {checkIn.checkOutTime ? 'Checked Out' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
