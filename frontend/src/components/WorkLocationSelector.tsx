import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Select, FormGroup, TextArea } from './ui';
import { WorkLocationType, type WorkLocationPreference, type Office } from '../types/api';
import { useOffices } from '../hooks/useBookings';
import { useTenants } from '../hooks/useTenants';
import { useCreateWorkLocationPreference, useUpdateWorkLocationPreference } from '../hooks/useWorkLocation';
import { useAuthStore } from '../stores/authStore';
import { workLocationService } from '../services/workLocationService';

interface WorkLocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  existingPreference?: WorkLocationPreference;
  personId: string;
}

export function WorkLocationSelector({
  isOpen,
  onClose,
  selectedDate,
  existingPreference,
  personId,
}: WorkLocationSelectorProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useTenants();
  const { data: allOffices = [] } = useOffices();
  const createMutation = useCreateWorkLocationPreference();
  const updateMutation = useUpdateWorkLocationPreference();

  const [locationType, setLocationType] = useState<WorkLocationType>(
    existingPreference?.locationType ?? WorkLocationType.Remote
  );
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    existingPreference?.officeId ?? ''
  );
  const [remoteLocation, setRemoteLocation] = useState(
    existingPreference?.remoteLocation ?? ''
  );
  const [city, setCity] = useState(existingPreference?.city ?? '');
  const [state, setState] = useState(existingPreference?.state ?? '');
  const [country, setCountry] = useState(existingPreference?.country ?? '');
  const [notes, setNotes] = useState(existingPreference?.notes ?? '');
  // const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (existingPreference) {
      setLocationType(existingPreference.locationType);
      setSelectedOfficeId(existingPreference.officeId ?? '');
      setRemoteLocation(existingPreference.remoteLocation ?? '');
      setCity(existingPreference.city ?? '');
      setState(existingPreference.state ?? '');
      setCountry(existingPreference.country ?? '');
      setNotes(existingPreference.notes ?? '');
    } else {
      // Reset form for new preference
      setLocationType(WorkLocationType.Remote);
      setSelectedOfficeId('');
      setRemoteLocation('');
      setCity('');
      setState('');
      setCountry('');
      setNotes('');
    }
  }, [existingPreference, isOpen]);

  const companyOffices = allOffices.filter(o => !o.isClientSite);
  const clientSites = allOffices.filter(o => o.isClientSite);

  const handleSubmit = async () => {
    const tenantId = tenants[0]?.id;
    if (!tenantId) {
      alert('No tenant found');
      return;
    }

    const workDate = selectedDate.toISOString().split('T')[0];

    const preferenceData = {
      tenantId,
      personId,
      workDate,
      locationType,
      officeId: (locationType === WorkLocationType.OfficeNoReservation ||
                 locationType === WorkLocationType.ClientSite)
        ? selectedOfficeId
        : undefined,
      bookingId: locationType === WorkLocationType.OfficeWithReservation
        ? undefined // TODO: Get from booking modal
        : undefined,
      remoteLocation: locationType === WorkLocationType.RemotePlus ? remoteLocation : undefined,
      city: locationType === WorkLocationType.RemotePlus ? city : undefined,
      state: locationType === WorkLocationType.RemotePlus ? state : undefined,
      country: locationType === WorkLocationType.RemotePlus ? country : undefined,
      notes,
    };

    try {
      if (existingPreference) {
        await updateMutation.mutateAsync({
          id: existingPreference.id,
          preference: { ...existingPreference, ...preferenceData },
        });
      } else {
        try {
          await createMutation.mutateAsync(preferenceData);
        } catch (createError: any) {
          // If we get a 409 Conflict, it means a preference was created (e.g., by template)
          // but our local cache is stale. Fetch the existing preference and update it instead.
          if (createError?.status === 409 || createError?.message?.includes('409')) {
            console.log('Preference already exists, fetching and updating instead');
            try {
              // Fetch all preferences for this person and date using the proper API service
              const preferences = await workLocationService.getAll({
                personId: preferenceData.personId,
              });

              // Find the one for this specific date
              const existing = preferences.find((p) => p.workDate === preferenceData.workDate);

              if (existing) {
                // Update the existing preference with new data
                await updateMutation.mutateAsync({
                  id: existing.id,
                  preference: { ...existing, ...preferenceData },
                });

                // Wait for dashboard refetch to complete before closing modal
                console.log('Waiting for dashboard refetch...');
                await queryClient.refetchQueries({
                  predicate: (query) => query.queryKey[0] === 'dashboard'
                });
                console.log('Dashboard refetch completed');
              } else {
                throw createError;
              }
            } catch (fetchError) {
              console.error('Failed to fetch existing preference:', fetchError);
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving work location preference:', error);
      alert('Failed to save work location preference');
    }
  };

  const locationTypeOptions = [
    { value: WorkLocationType.Remote.toString(), label: 'Remote - Work from home' },
    { value: WorkLocationType.RemotePlus.toString(), label: 'Remote Plus - Specify location' },
    { value: WorkLocationType.ClientSite.toString(), label: 'Client Site - At client location' },
    { value: WorkLocationType.OfficeNoReservation.toString(), label: 'Office - No desk reservation' },
    { value: WorkLocationType.OfficeWithReservation.toString(), label: 'Office - With desk/room reservation' },
    { value: WorkLocationType.PTO.toString(), label: 'PTO - Paid Time Off' },
  ];

  const officeOptions = companyOffices.map(o => ({
    value: o.id,
    label: `${o.name}${o.address ? ` - ${o.address}` : ''}`,
  }));

  const clientSiteOptions = clientSites.map(o => ({
    value: o.id,
    label: `${o.name}${o.address ? ` - ${o.address}` : ''}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Work Location - ${selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Location Type Selection */}
        <FormGroup columns={1}>
          <Select
            label="Location Type"
            options={locationTypeOptions}
            value={locationType.toString()}
            onChange={(e) => setLocationType(parseInt(e.target.value) as WorkLocationType)}
            required
          />
        </FormGroup>

        {/* Remote Plus Fields */}
        {locationType === WorkLocationType.RemotePlus && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-purple-900">Remote Plus Location Details</h4>
            <FormGroup columns={1}>
              <Input
                label="Location Description"
                placeholder="e.g., Home, Coffee Shop, Co-working Space"
                value={remoteLocation}
                onChange={(e) => setRemoteLocation(e.target.value)}
              />
            </FormGroup>
            <FormGroup columns={3}>
              <Input
                label="City"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="State/Province"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Input
                label="Country"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </FormGroup>
          </div>
        )}

        {/* Client Site Selection */}
        {locationType === WorkLocationType.ClientSite && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-orange-900">Select Client Site</h4>
            <FormGroup columns={1}>
              <Select
                label="Client Site"
                options={clientSiteOptions}
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                required
                helper={clientSiteOptions.length === 0 ? 'No client sites configured' : ''}
              />
            </FormGroup>
          </div>
        )}

        {/* Office Selection (No Reservation) */}
        {locationType === WorkLocationType.OfficeNoReservation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-green-900">Select Office</h4>
            <FormGroup columns={1}>
              <Select
                label="Office Location"
                options={officeOptions}
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                required
              />
            </FormGroup>
          </div>
        )}

        {/* Office with Reservation */}
        {locationType === WorkLocationType.OfficeWithReservation && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-emerald-900">Office with Desk/Room Reservation</h4>
            <p className="text-sm text-emerald-700">
              You'll need to make a desk or room reservation for this day.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowBookingModal(true)}
            >
              Make Reservation
            </Button>
            {/* TODO: Integrate with BookingModal */}
          </div>
        )}

        {/* Notes */}
        <FormGroup columns={1}>
          <TextArea
            label="Notes (Optional)"
            placeholder="Any additional notes about this day..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormGroup>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            createMutation.isPending ||
            updateMutation.isPending ||
            (locationType === WorkLocationType.ClientSite && !selectedOfficeId) ||
            (locationType === WorkLocationType.OfficeNoReservation && !selectedOfficeId)
          }
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving...'
            : existingPreference
            ? 'Update'
            : 'Save'}
        </Button>
      </div>
    </Modal>
  );
}
